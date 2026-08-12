import crypto from "node:crypto";
import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import express from "express";
import httpProxy from "http-proxy";

const dataDir = process.env.DATA_DIR || "/data";
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "kingdom-forge.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS vaults (user_id INTEGER PRIMARY KEY, payload TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL, name TEXT NOT NULL, invite_code TEXT UNIQUE NOT NULL, payload TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS campaign_members (campaign_id TEXT NOT NULL, user_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'player', joined_at TEXT NOT NULL, PRIMARY KEY(campaign_id,user_id), FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS campaign_characters (campaign_id TEXT NOT NULL, user_id INTEGER NOT NULL, character_id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(campaign_id,user_id,character_id), FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS campaign_events (id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id TEXT NOT NULL, user_id INTEGER NOT NULL, visibility TEXT NOT NULL DEFAULT 'public', kind TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, action TEXT NOT NULL, target TEXT, detail TEXT, created_at TEXT NOT NULL);
`);
db.prepare("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(?,?)").run(2, new Date().toISOString());
db.prepare(
  "INSERT OR IGNORE INTO settings(key,value) VALUES('allow_registration','true')",
).run();
const backupDir = path.join(dataDir, "backups");
fs.mkdirSync(backupDir, { recursive: true });
function scheduledBackup() {
  try {
    db.pragma("wal_checkpoint(FULL)");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(path.join(dataDir, "kingdom-forge.sqlite"), path.join(backupDir, `kingdom-forge-${stamp}.sqlite`));
    const backups = fs.readdirSync(backupDir).filter((name) => name.endsWith(".sqlite")).sort().reverse();
    backups.slice(Math.max(1, Number(process.env.BACKUP_RETENTION || 14))).forEach((name) => fs.unlinkSync(path.join(backupDir, name)));
  } catch (error) {
    console.error("Scheduled backup failed", error);
  }
}
setTimeout(scheduledBackup, 30_000).unref();
setInterval(scheduledBackup, 24 * 60 * 60 * 1000).unref();

const app = express();
app.use(express.json({ limit: "8mb" }));
app.disable("x-powered-by");
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "same-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
const loginAttempts = new Map();
function audit(userId, action, target = "", detail = "") {
  db.prepare("INSERT INTO audit_log(user_id,action,target,detail,created_at) VALUES(?,?,?,?,?)").run(userId || null, action, target, String(detail).slice(0, 500), new Date().toISOString());
}
const cookie = (request, name) =>
  Object.fromEntries(
    (request.headers.cookie || "")
      .split(";")
      .map((v) => v.trim().split("="))
      .filter((v) => v.length === 2),
  )[name];
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const publicUser = (user) => ({
  id: user.id,
  username: user.username,
  displayName: user.display_name,
  role: user.role,
});
function currentUser(request) {
  const token = cookie(request, "kf_session");
  if (!token) return null;
  return (
    db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?",
      )
      .get(hash(token), Date.now()) || null
  );
}
function requireUser(request, response, next) {
  const user = currentUser(request);
  if (!user) return response.status(401).json({ error: "Please sign in" });
  request.user = user;
  next();
}
function issueSession(response, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  db.prepare(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
  ).run(hash(token), user.id, Date.now() + 1000 * 60 * 60 * 24 * 30);
  response.setHeader(
    "Set-Cookie",
    `kf_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`,
  );
}

app.get("/api/session", (request, response) => {
  const user = currentUser(request);
  response.json({
    user: user ? publicUser(user) : null,
    setupRequired:
      db.prepare("SELECT COUNT(*) count FROM users").get().count === 0,
  });
});
app.get("/health", (_request, response) => response.json({ status: "ok", version: "2.5.3", time: new Date().toISOString() }));
app.get("/ready", (_request, response) => {
  try {
    db.prepare("SELECT 1 value").get();
    response.json({ status: "ready", database: "ok", schema: 2 });
  } catch (error) {
    response.status(503).json({ status: "not-ready", error: String(error) });
  }
});
app.post("/api/register", async (request, response) => {
  const username = String(request.body.username || "")
    .trim()
    .toLowerCase();
  const displayName = String(request.body.displayName || username).trim();
  const password = String(request.body.password || "");
  const hasUsers =
    db.prepare("SELECT COUNT(*) count FROM users").get().count > 0;
  if (
    hasUsers &&
    db
      .prepare("SELECT value FROM settings WHERE key='allow_registration'")
      .get()?.value !== "true"
  )
    return response
      .status(403)
      .json({ error: "Registration is currently invite-only" });
  if (!/^[a-z0-9_.-]{3,32}$/.test(username))
    return response.status(400).json({
      error:
        "Username must be 3–32 letters, numbers, dots, dashes, or underscores",
    });
  if (password.length < 8)
    return response
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  const role =
    db.prepare("SELECT COUNT(*) count FROM users").get().count === 0
      ? "admin"
      : "user";
  try {
    const info = db
      .prepare(
        "INSERT INTO users(username,display_name,password_hash,role,created_at) VALUES(?,?,?,?,?)",
      )
      .run(
        username,
        displayName || username,
        await bcrypt.hash(password, 12),
        role,
        new Date().toISOString(),
      );
    const user = db
      .prepare("SELECT * FROM users WHERE id=?")
      .get(info.lastInsertRowid);
    issueSession(response, user);
    audit(user.id, "account.created", String(user.id), role);
    response.json({ user: publicUser(user) });
  } catch {
    response.status(409).json({ error: "That username already exists" });
  }
});
app.post("/api/login", async (request, response) => {
  const username = String(request.body.username || "")
    .trim()
    .toLowerCase();
  const attemptKey = `${request.ip}:${username}`;
  const attempt = loginAttempts.get(attemptKey) || { count: 0, until: 0 };
  if (attempt.until > Date.now()) return response.status(429).json({ error: "Too many attempts. Try again in 15 minutes." });
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (
    !user ||
    !(await bcrypt.compare(
      String(request.body.password || ""),
      user.password_hash,
    ))
  )
    {
      const count = attempt.count + 1;
      loginAttempts.set(attemptKey, count >= 8 ? { count: 0, until: Date.now() + 15 * 60 * 1000 } : { count, until: 0 });
      return response.status(401).json({ error: "Incorrect username or password" });
    }
  loginAttempts.delete(attemptKey);
  issueSession(response, user);
  audit(user.id, "session.login", String(user.id));
  response.json({ user: publicUser(user) });
});
app.post("/api/logout", (request, response) => {
  const user = currentUser(request);
  const token = cookie(request, "kf_session");
  if (token)
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
  response.setHeader(
    "Set-Cookie",
    "kf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );
  response.json({ ok: true });
  if (user) audit(user.id, "session.logout", String(user.id));
});
app.get("/api/account/sessions", requireUser, (request, response) => {
  response.json({ sessions: db.prepare("SELECT token_hash,expires_at FROM sessions WHERE user_id=? ORDER BY expires_at DESC").all(request.user.id).map((row, index) => ({ id: row.token_hash.slice(0, 12), expiresAt: row.expires_at, current: index === 0 })) });
});
app.delete("/api/account/sessions", requireUser, (request, response) => {
  const token = cookie(request, "kf_session");
  db.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash<>?").run(request.user.id, hash(token || ""));
  audit(request.user.id, "session.revoke_others", String(request.user.id));
  response.json({ ok: true });
});
app.put("/api/account/password", requireUser, async (request, response) => {
  const current = String(request.body.currentPassword || "");
  const nextPassword = String(request.body.newPassword || "");
  if (!(await bcrypt.compare(current, request.user.password_hash))) return response.status(403).json({ error: "Current password is incorrect" });
  if (nextPassword.length < 10) return response.status(400).json({ error: "New password must be at least 10 characters" });
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(await bcrypt.hash(nextPassword, 12), request.user.id);
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(request.user.id);
  audit(request.user.id, "account.password_changed", String(request.user.id));
  issueSession(response, request.user);
  response.json({ ok: true });
});
app.get("/api/vault", requireUser, (request, response) => {
  const row = db
    .prepare("SELECT payload FROM vaults WHERE user_id=?")
    .get(request.user.id);
  response.json(row ? JSON.parse(row.payload) : {});
});
app.put("/api/vault", requireUser, (request, response) => {
  const payload = JSON.stringify(request.body);
  if (Buffer.byteLength(payload) > 7_500_000)
    return response
      .status(413)
      .json({ error: "Vault is too large; use smaller images" });
  db.prepare(
    "INSERT INTO vaults(user_id,payload,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at",
  ).run(request.user.id, payload, new Date().toISOString());
  audit(request.user.id, "vault.saved", String(request.user.id), `${Buffer.byteLength(payload)} bytes`);
  response.json({ ok: true });
});
app.get("/api/admin/users", requireUser, (request, response) => {
  if (request.user.role !== "admin")
    return response
      .status(403)
      .json({ error: "Administrator access required" });
  response.json({
    users: db
      .prepare(
        "SELECT id,username,display_name,role,created_at FROM users ORDER BY id",
      )
      .all()
      .map(publicUser),
  });
});
app.get("/api/settings", (request, response) =>
  response.json({
    allowRegistration:
      db
        .prepare("SELECT value FROM settings WHERE key='allow_registration'")
        .get()?.value === "true",
  }),
);
app.put("/api/admin/settings", requireUser, (request, response) => {
  if (request.user.role !== "admin")
    return response
      .status(403)
      .json({ error: "Administrator access required" });
  db.prepare("UPDATE settings SET value=? WHERE key='allow_registration'").run(
    request.body.allowRegistration ? "true" : "false",
  );
  response.json({ ok: true });
});
app.put("/api/admin/users/:id/role", requireUser, (request, response) => {
  if (request.user.role !== "admin")
    return response
      .status(403)
      .json({ error: "Administrator access required" });
  const id = Number(request.params.id);
  if (id === request.user.id)
    return response
      .status(400)
      .json({ error: "You cannot change your own administrator role" });
  const role = request.body.role === "admin" ? "admin" : "user";
  db.prepare("UPDATE users SET role=? WHERE id=?").run(role, id);
  response.json({ ok: true });
});
app.get("/api/admin/backup", requireUser, (request, response) => {
  if (request.user.role !== "admin")
    return response
      .status(403)
      .json({ error: "Administrator access required" });
  db.pragma("wal_checkpoint(FULL)");
  response.download(
    path.join(dataDir, "kingdom-forge.sqlite"),
    `kingdom-forge-database-${new Date().toISOString().slice(0, 10)}.sqlite`,
  );
});
app.get("/api/admin/diagnostics", requireUser, (request, response) => {
  if (request.user.role !== "admin") return response.status(403).json({ error: "Administrator access required" });
  const databasePath = path.join(dataDir, "kingdom-forge.sqlite");
  response.json({ version: "2.5.3", schema: 2, databaseBytes: fs.statSync(databasePath).size, users: db.prepare("SELECT COUNT(*) count FROM users").get().count, campaigns: db.prepare("SELECT COUNT(*) count FROM campaigns").get().count, events: db.prepare("SELECT COUNT(*) count FROM campaign_events").get().count, journalMode: db.pragma("journal_mode", { simple: true }), dataDir });
});
app.get("/api/admin/audit", requireUser, (request, response) => {
  if (request.user.role !== "admin") return response.status(403).json({ error: "Administrator access required" });
  response.json({ entries: db.prepare("SELECT audit_log.*,users.username FROM audit_log LEFT JOIN users ON users.id=audit_log.user_id ORDER BY audit_log.id DESC LIMIT 200").all() });
});

const campaignPublic = (row) => ({
  id: row.id,
  name: row.name,
  inviteCode: row.invite_code,
  role: row.member_role,
  ownerId: row.owner_id,
  ...JSON.parse(row.payload || "{}"),
});
app.get("/api/campaigns", requireUser, (request, response) => {
  const rows = db
    .prepare(
      "SELECT campaigns.*,campaign_members.role member_role FROM campaigns JOIN campaign_members ON campaign_members.campaign_id=campaigns.id WHERE campaign_members.user_id=? ORDER BY campaigns.updated_at DESC",
    )
    .all(request.user.id);
  response.json({ campaigns: rows.map(campaignPublic) });
});
app.post("/api/campaigns", requireUser, (request, response) => {
  const id = crypto.randomUUID();
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const name = String(request.body.name || "New Campaign")
    .trim()
    .slice(0, 80);
  const now = new Date().toISOString();
  const payload = JSON.stringify(request.body.payload || {});
  const create = db.transaction(() => {
    db.prepare(
      "INSERT INTO campaigns(id,owner_id,name,invite_code,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
    ).run(id, request.user.id, name, code, payload, now, now);
    db.prepare(
      "INSERT INTO campaign_members(campaign_id,user_id,role,joined_at) VALUES(?,?,?,?)",
    ).run(id, request.user.id, "dm", now);
  });
  create();
  response.json({
    id,
    inviteCode: code,
    name,
    role: "dm",
    ...(request.body.payload || {}),
  });
});
app.post("/api/campaigns/join", requireUser, (request, response) => {
  const code = String(request.body.code || "")
    .trim()
    .toUpperCase();
  const campaign = db
    .prepare("SELECT * FROM campaigns WHERE invite_code=?")
    .get(code);
  if (!campaign)
    return response
      .status(404)
      .json({ error: "Campaign invite code not found" });
  db.prepare(
    "INSERT OR IGNORE INTO campaign_members(campaign_id,user_id,role,joined_at) VALUES(?,?,?,?)",
  ).run(campaign.id, request.user.id, "player", new Date().toISOString());
  response.json({ ok: true, id: campaign.id });
});
app.get("/api/campaigns/:id", requireUser, (request, response) => {
  const membership = db
    .prepare(
      "SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?",
    )
    .get(request.params.id, request.user.id);
  if (!membership)
    return response.status(403).json({ error: "Campaign access required" });
  const campaign = db
    .prepare("SELECT * FROM campaigns WHERE id=?")
    .get(request.params.id);
  const members = db
    .prepare(
      "SELECT users.id,users.username,users.display_name,campaign_members.role FROM campaign_members JOIN users ON users.id=campaign_members.user_id WHERE campaign_id=?",
    )
    .all(request.params.id)
    .map(publicUser);
  const characters = db
    .prepare(
      "SELECT user_id,payload FROM campaign_characters WHERE campaign_id=?",
    )
    .all(request.params.id)
    .map((row) => ({ ...JSON.parse(row.payload), userId: row.user_id }));
  response.json({
    campaign: {
      ...campaignPublic({ ...campaign, member_role: membership.role }),
      members,
      characters,
    },
  });
});
app.put("/api/campaigns/:id", requireUser, (request, response) => {
  const membership = db
    .prepare(
      "SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?",
    )
    .get(request.params.id, request.user.id);
  if (!membership || !["dm", "assistant"].includes(membership.role))
    return response.status(403).json({ error: "DM access required" });
  const campaign = db
    .prepare("SELECT payload FROM campaigns WHERE id=?")
    .get(request.params.id);
  const payload = {
    ...JSON.parse(campaign.payload || "{}"),
    ...(request.body.payload || {}),
  };
  const name = String(
    request.body.name || request.body.payload?.name || "Campaign",
  ).slice(0, 80);
  db.prepare(
    "UPDATE campaigns SET name=?,payload=?,updated_at=? WHERE id=?",
  ).run(
    name,
    JSON.stringify(payload),
    new Date().toISOString(),
    request.params.id,
  );
  response.json({ ok: true });
});
app.put("/api/campaigns/:id/character", requireUser, (request, response) => {
  const membership = db
    .prepare(
      "SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?",
    )
    .get(request.params.id, request.user.id);
  if (!membership)
    return response.status(403).json({ error: "Campaign access required" });
  const character = request.body.character;
  if (!character?.id)
    return response.status(400).json({ error: "Character required" });
  db.prepare(
    "INSERT INTO campaign_characters(campaign_id,user_id,character_id,payload,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(campaign_id,user_id,character_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at",
  ).run(
    request.params.id,
    request.user.id,
    String(character.id),
    JSON.stringify(character),
    new Date().toISOString(),
  );
  response.json({ ok: true });
});
function campaignMembership(campaignId, userId) {
  return db.prepare("SELECT role FROM campaign_members WHERE campaign_id=? AND user_id=?").get(campaignId, userId);
}
app.get("/api/campaigns/:id/events", requireUser, (request, response) => {
  const membership = campaignMembership(request.params.id, request.user.id);
  if (!membership) return response.status(403).json({ error: "Campaign access required" });
  const after = Math.max(0, Number(request.query.after || 0));
  const rows = db.prepare(`SELECT campaign_events.*,users.display_name FROM campaign_events JOIN users ON users.id=campaign_events.user_id WHERE campaign_events.campaign_id=? AND campaign_events.id>? AND (campaign_events.visibility='public' OR campaign_events.user_id=? OR ? IN ('dm','assistant')) ORDER BY campaign_events.id ASC LIMIT 200`).all(request.params.id, after, request.user.id, membership.role);
  response.json({ events: rows.map((row) => ({ id: row.id, kind: row.kind, visibility: row.visibility, createdAt: row.created_at, userId: row.user_id, displayName: row.display_name, ...JSON.parse(row.payload) })) });
});
app.post("/api/campaigns/:id/events", requireUser, (request, response) => {
  const membership = campaignMembership(request.params.id, request.user.id);
  if (!membership) return response.status(403).json({ error: "Campaign access required" });
  const kind = ["roll", "request", "message", "combat"].includes(request.body.kind) ? request.body.kind : "message";
  if (kind === "request" && !["dm", "assistant"].includes(membership.role)) return response.status(403).json({ error: "Only the DM can request rolls" });
  const visibility = ["public", "private", "dm"].includes(request.body.visibility) ? request.body.visibility : "public";
  const payload = JSON.stringify({ label: String(request.body.label || "").slice(0, 120), formula: String(request.body.formula || "").slice(0, 80), total: Number.isFinite(Number(request.body.total)) ? Number(request.body.total) : undefined, detail: String(request.body.detail || "").slice(0, 500) });
  const info = db.prepare("INSERT INTO campaign_events(campaign_id,user_id,visibility,kind,payload,created_at) VALUES(?,?,?,?,?,?)").run(request.params.id, request.user.id, visibility, kind, payload, new Date().toISOString());
  audit(request.user.id, `campaign.${kind}`, request.params.id, visibility);
  response.json({ ok: true, id: info.lastInsertRowid });
});
app.put("/api/campaigns/:id/members/:userId", requireUser, (request, response) => {
  const membership = campaignMembership(request.params.id, request.user.id);
  if (!membership || membership.role !== "dm") return response.status(403).json({ error: "Campaign owner access required" });
  const role = ["assistant", "player", "viewer"].includes(request.body.role) ? request.body.role : "player";
  db.prepare("UPDATE campaign_members SET role=? WHERE campaign_id=? AND user_id=?").run(role, request.params.id, Number(request.params.userId));
  audit(request.user.id, "campaign.member_role", request.params.id, `${request.params.userId}:${role}`);
  response.json({ ok: true });
});

const internalPort = Number(process.env.INTERNAL_PORT || 3001);
const child = spawn(
  process.execPath,
  ["node_modules/vinext/dist/cli.js", "start"],
  {
    stdio: "inherit",
    env: { ...process.env, PORT: String(internalPort), HOST: "127.0.0.1" },
  },
);
const proxy = httpProxy.createProxyServer({
  target: `http://127.0.0.1:${internalPort}`,
  ws: true,
});
proxy.on("error", (_error, _request, response) => {
  if (!response.headersSent)
    response.writeHead(503, { "content-type": "text/plain" });
  response.end("Kingdom Forge is starting…");
});
app.use((request, response) => proxy.web(request, response));
const server = app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log(`Kingdom Forge gateway listening on ${process.env.PORT || 3000}`),
);
server.on("upgrade", (request, socket, head) =>
  proxy.ws(request, socket, head),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    child.kill(signal);
    db.close();
    process.exit(0);
  });
