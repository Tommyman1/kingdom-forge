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
db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS vaults (user_id INTEGER PRIMARY KEY, payload TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
`);

const app = express();
app.use(express.json({ limit: "8mb" }));
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
app.post("/api/register", async (request, response) => {
  const username = String(request.body.username || "")
    .trim()
    .toLowerCase();
  const displayName = String(request.body.displayName || username).trim();
  const password = String(request.body.password || "");
  if (!/^[a-z0-9_.-]{3,32}$/.test(username))
    return response
      .status(400)
      .json({
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
    response.json({ user: publicUser(user) });
  } catch {
    response.status(409).json({ error: "That username already exists" });
  }
});
app.post("/api/login", async (request, response) => {
  const username = String(request.body.username || "")
    .trim()
    .toLowerCase();
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (
    !user ||
    !(await bcrypt.compare(
      String(request.body.password || ""),
      user.password_hash,
    ))
  )
    return response
      .status(401)
      .json({ error: "Incorrect username or password" });
  issueSession(response, user);
  response.json({ user: publicUser(user) });
});
app.post("/api/logout", (request, response) => {
  const token = cookie(request, "kf_session");
  if (token)
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
  response.setHeader(
    "Set-Cookie",
    "kf_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  );
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
