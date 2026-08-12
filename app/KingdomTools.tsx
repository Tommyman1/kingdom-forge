"use client";

import { useEffect, useMemo, useState } from "react";
import { BACKGROUNDS, SPECIES, STARTER_SPELLS } from "../lib/builder2024";
import { CLASS_RULES, ITEM_CATALOG } from "../lib/rules2024";
import { featureDescription, spellInfo } from "../lib/rulesContent";
import type { Hero } from "./page";

export type HomebrewEntry = {
  id: number;
  type:
    | "Spell"
    | "Item"
    | "Feat"
    | "Monster"
    | "Species"
    | "Subclass"
    | "Condition";
  name: string;
  summary: string;
  formula?: string;
  tags: string[];
};
type LiveEvent = { id: number; kind: string; visibility: string; createdAt: string; displayName: string; label?: string; formula?: string; total?: number; detail?: string };

function LiveTable({ campaign, toast }: { campaign: Campaign; toast: (message: string) => void }) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [formula, setFormula] = useState("1d20");
  const [visibility, setVisibility] = useState("public");
  const [requestText, setRequestText] = useState("Everyone roll Perception");
  async function refresh() {
    const data = await fetch(`/api/campaigns/${campaign.id}/events`).then((response) => response.json());
    setEvents(data.events ?? []);
  }
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 2500);
    return () => window.clearInterval(timer);
  }, [campaign.id]);
  function calculate(input: string) {
    const terms = input.replace(/\s/g, "").toLowerCase().match(/[+-]?[^+-]+/g);
    if (!terms) return null;
    let total = 0;
    const detail: string[] = [];
    for (const raw of terms) {
      const sign = raw.startsWith("-") ? -1 : 1;
      const term = raw.replace(/^[+-]/, "");
      const die = term.match(/^(\d*)d(\d+)$/);
      if (die) {
        const count = Math.min(50, Number(die[1] || 1));
        const sides = Math.min(1000, Number(die[2]));
        if (!sides) return null;
        const values = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        total += sign * values.reduce((sum, value) => sum + value, 0);
        detail.push(values.join(" + "));
      } else if (/^\d+$/.test(term)) total += sign * Number(term);
      else return null;
    }
    return { total, detail: detail.join(" · ") };
  }
  async function roll() {
    const result = calculate(formula);
    if (!result) return toast("Use a formula such as 2d6+3");
    await fetch(`/api/campaigns/${campaign.id}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "roll", visibility, label: "Campaign roll", formula, ...result }) });
    await refresh();
  }
  async function requestRoll() {
    const response = await fetch(`/api/campaigns/${campaign.id}/events`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "request", visibility: "public", label: requestText }) });
    if (!response.ok) return toast("Only the DM or assistant can request rolls");
    await refresh();
  }
  return <section className="live-table">
    <header><div><p>LIVE CAMPAIGN</p><h2>Shared Table Feed</h2><span>Public, private, and DM-visible rolls refresh automatically.</span></div><b>{events.length} events</b></header>
    <div className="live-controls"><input value={formula} onChange={(event) => setFormula(event.target.value)} /><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="public">Public</option><option value="private">Private</option><option value="dm">DM only</option></select><button className="primary" onClick={roll}>Roll</button></div>
    {["dm", "assistant"].includes(campaign.role) && <div className="live-controls"><input value={requestText} onChange={(event) => setRequestText(event.target.value)} /><button onClick={requestRoll}>Request Roll</button></div>}
    <div className="live-feed">{[...events].reverse().map((event) => <article key={event.id} className={event.kind}><div><strong>{event.displayName}</strong><span>{event.label || event.kind} · {event.visibility}</span></div>{event.total !== undefined && <b>{event.total}</b>}<small>{event.formula} {event.detail && `· ${event.detail}`}</small></article>)}{!events.length && <p className="muted">The table is quiet. Make the first roll.</p>}</div>
  </section>;
}

function CampaignRecords({ records, save, canSeeSecrets }: { records: CampaignRecord[]; save: (records: CampaignRecord[]) => void; canSeeSecrets: boolean }) {
  const [type, setType] = useState<CampaignRecord["type"]>("Session");
  const [title, setTitle] = useState("");
  const visible = records.filter((record) => canSeeSecrets || !record.secret);
  return <section className="records-board">
    <header><div><p>CAMPAIGN ARCHIVE</p><h2>Sessions & World Records</h2><span>Schedule sessions and organize handouts, downtime, shops, companions, relationships, locations, and recaps.</span></div></header>
    <div className="live-controls"><select value={type} onChange={(event) => setType(event.target.value as CampaignRecord["type"])}>{["Session", "Handout", "Downtime", "Shop", "Companion", "Relationship", "Location", "Recap"].map((value) => <option key={value}>{value}</option>)}</select><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={`New ${type.toLowerCase()} title`} /><button className="primary" onClick={() => { if (!title.trim()) return; save([{ id: Date.now(), type, title: title.trim(), body: "", status: "Active", secret: false, date: new Date().toISOString().slice(0, 10) }, ...records]); setTitle(""); }}>Create</button></div>
    <div className="records-grid">{visible.map((record) => <article key={record.id}><small>{record.type}</small><input value={record.title} onChange={(event) => save(records.map((item) => item.id === record.id ? { ...item, title: event.target.value } : item))} /><div><input type="date" value={record.date ?? ""} onChange={(event) => save(records.map((item) => item.id === record.id ? { ...item, date: event.target.value } : item))} /><select value={record.status} onChange={(event) => save(records.map((item) => item.id === record.id ? { ...item, status: event.target.value } : item))}><option>Active</option><option>Planned</option><option>Complete</option><option>Archived</option></select><label><input type="checkbox" checked={record.secret} onChange={(event) => save(records.map((item) => item.id === record.id ? { ...item, secret: event.target.checked } : item))} /> DM secret</label></div><textarea value={record.body} placeholder="Details, inventory, prices, reveals, progress, or recap…" onChange={(event) => save(records.map((item) => item.id === record.id ? { ...item, body: event.target.value } : item))} /><button className="danger" onClick={() => save(records.filter((item) => item.id !== record.id))}>Delete</button></article>)}</div>
  </section>;
}
type Campaign = {
  id: string;
  name: string;
  inviteCode: string;
  role: "dm" | "assistant" | "player";
  description?: string;
  cover?: string;
  journal?: Note[];
  quests?: Quest[];
  npcs?: WorldEntry[];
  factions?: WorldEntry[];
  encounters?: Encounter[];
  partyInventory?: string[];
  map?: MapData;
  members?: Account[];
  characters?: Hero[];
  records?: CampaignRecord[];
};
type CampaignRecord = { id: number; type: "Session" | "Handout" | "Downtime" | "Shop" | "Companion" | "Relationship" | "Location" | "Recap"; title: string; body: string; status: string; secret: boolean; date?: string };
type Account = {
  id: number;
  username: string;
  displayName: string;
  role: string;
};
type Note = {
  id: number;
  title: string;
  body: string;
  secret?: boolean;
  createdAt: string;
};
type Quest = {
  id: number;
  name: string;
  status: "Active" | "Complete" | "Failed";
  notes: string;
};
type WorldEntry = { id: number; name: string; description: string };
type Combatant = {
  id: number;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  conditions: string[];
  kind: "Player" | "Monster";
};
type Encounter = {
  id: number;
  name: string;
  round: number;
  activeTurn: number;
  combatants: Combatant[];
};
type MapData = {
  background?: string;
  grid?: boolean;
  fog?: boolean;
  gridSize?: number;
  tokens: { id: number; name: string; x: number; y: number; color: string }[];
};

const blankCampaign = () => ({
  description: "A new realm awaits.",
  journal: [],
  quests: [],
  npcs: [],
  factions: [],
  encounters: [],
  partyInventory: [],
  map: { tokens: [] },
  records: [],
});

export function CampaignHub({
  hero,
  toast,
}: {
  hero: Hero;
  toast: (message: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [tab, setTab] = useState("party");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  async function loadList() {
    setLoading(true);
    try {
      const data = await fetch("/api/campaigns").then((r) => r.json());
      setCampaigns(data.campaigns ?? []);
    } finally {
      setLoading(false);
    }
  }
  async function openCampaign(id: string) {
    const data = await fetch(`/api/campaigns/${id}`).then((r) => r.json());
    setSelected(data.campaign);
    setTab("party");
  }
  useEffect(() => {
    loadList();
  }, []);
  async function create() {
    if (!name.trim()) return;
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, payload: blankCampaign() }),
    });
    const campaign = await response.json();
    setName("");
    await loadList();
    await openCampaign(campaign.id);
    toast("Campaign created");
  }
  async function join() {
    const response = await fetch("/api/campaigns/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await response.json();
    if (!response.ok) return toast(data.error || "Invite failed");
    setCode("");
    await loadList();
    await openCampaign(data.id);
    toast("Joined campaign");
  }
  async function save(patch: Partial<Campaign>) {
    if (!selected) return;
    const next = { ...selected, ...patch };
    setSelected(next);
    const response = await fetch(`/api/campaigns/${selected.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: next.name, payload: patch }),
    });
    if (!response.ok) toast("Only the DM can change campaign records");
  }
  async function syncHero() {
    if (!selected) return;
    await fetch(`/api/campaigns/${selected.id}/character`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ character: hero }),
    });
    await openCampaign(selected.id);
    toast(`${hero.name} synced to the party`);
  }
  if (selected)
    return (
      <section className="tool-page">
        <header className="tool-hero">
          <button onClick={() => setSelected(null)}>← Campaigns</button>
          <div>
            <p>{selected.role.toUpperCase()} COMMAND CENTER</p>
            <h1>{selected.name}</h1>
            <span>{selected.description}</span>
          </div>
          <div>
            <small>INVITE CODE</small>
            <strong>{selected.inviteCode}</strong>
            <button
              onClick={() => navigator.clipboard.writeText(selected.inviteCode)}
            >
              Copy
            </button>
          </div>
        </header>
        <nav className="tool-tabs">
          {[
            "party",
            "encounters",
            "journal",
            "quests",
            "world",
            "homebrew",
            "map",
            "live",
            "records",
          ].map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        {tab === "party" && (
          <PartyBoard
            campaign={selected}
            hero={hero}
            sync={syncHero}
            save={save}
          />
        )}{" "}
        {tab === "encounters" && (
          <EncounterBoard
            encounters={selected.encounters ?? []}
            save={(encounters) => save({ encounters })}
          />
        )}{" "}
        {tab === "journal" && (
          <JournalBoard
            notes={selected.journal ?? []}
            save={(journal) => save({ journal })}
          />
        )}{" "}
        {tab === "quests" && (
          <QuestBoard
            quests={selected.quests ?? []}
            save={(quests) => save({ quests })}
          />
        )}{" "}
        {tab === "world" && <WorldBoard campaign={selected} save={save} />}{" "}
        {tab === "homebrew" && (
          <div className="tool-empty">
            <b>Campaign Homebrew</b>
            <span>
              Create reusable homebrew in the Forge, then record
              campaign-specific rulings in the journal.
            </span>
          </div>
        )}{" "}
        {tab === "live" && <LiveTable campaign={selected} toast={toast} />}{" "}
        {tab === "records" && <CampaignRecords records={selected.records ?? []} save={(records) => save({ records })} canSeeSecrets={["dm", "assistant"].includes(selected.role)} />}{" "}
        {tab === "map" && (
          <MapBoard
            map={selected.map ?? { tokens: [] }}
            save={(map) => save({ map })}
          />
        )}
      </section>
    );
  return (
    <section className="tool-page">
      <div className="tool-title">
        <div>
          <p>THE GREAT HALL</p>
          <h1>Campaigns</h1>
          <span>
            Shared worlds, live party sheets, encounters, journals, quests, and
            maps.
          </span>
        </div>
      </div>
      <div className="campaign-create">
        <label>
          <span>Create a campaign</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wall Gloria"
          />
        </label>
        <button className="primary" onClick={create}>
          Create
        </button>
        <i />
        <label>
          <span>Join with invite code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="8-character code"
          />
        </label>
        <button onClick={join}>Join</button>
      </div>
      {loading ? (
        <div className="tool-empty">Loading campaigns…</div>
      ) : (
        <div className="campaign-grid">
          {campaigns.map((c) => (
            <button key={c.id} onClick={() => openCampaign(c.id)}>
              <i>{c.name.slice(0, 1)}</i>
              <span>
                <small>{c.role.toUpperCase()}</small>
                <strong>{c.name}</strong>
                <em>{c.description || "Open campaign"}</em>
              </span>
            </button>
          ))}
          {!campaigns.length && (
            <div className="tool-empty">
              <b>No campaigns yet</b>
              <span>Create one as DM or enter an invitation code.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function PartyBoard({
  campaign,
  hero,
  sync,
  save,
}: {
  campaign: Campaign;
  hero: Hero;
  sync: () => void;
  save: (patch: Partial<Campaign>) => void;
}) {
  const characters = campaign.characters ?? [];
  const [item, setItem] = useState("");
  return (
    <div className="command-grid">
      <section>
        <div className="section-title">
          <h3>Live Party</h3>
          <button onClick={sync}>Sync {hero.name}</button>
        </div>
        <div className="party-cards">
          {characters.map((character: any) => (
            <article key={`${character.userId}-${character.id}`}>
              <div className="avatar">{character.initials}</div>
              <span>
                <b>{character.name}</b>
                <small>
                  Level {character.level} {character.className}
                </small>
              </span>
              <div>
                <b>
                  {character.hp}/{character.maxHp}
                </b>
                <small>HP</small>
              </div>
              <div>
                <b>{character.ac}</b>
                <small>AC</small>
              </div>
              <div>
                <b>{character.conditions?.join(", ") || "Clear"}</b>
                <small>Conditions</small>
              </div>
            </article>
          ))}
          {!characters.length && (
            <div className="tool-empty">
              Players can sync a character from this tab.
            </div>
          )}
        </div>
      </section>
      <section>
        <div className="section-title">
          <h3>Party Inventory</h3>
        </div>
        <div className="inline-add">
          <input
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Shared treasure or supplies"
          />
          <button
            onClick={() => {
              if (item.trim()) {
                save({
                  partyInventory: [
                    ...(campaign.partyInventory ?? []),
                    item.trim(),
                  ],
                });
                setItem("");
              }
            }}
          >
            Add
          </button>
        </div>
        {(campaign.partyInventory ?? []).map((entry, index) => (
          <div className="record-line" key={`${entry}-${index}`}>
            <span>{entry}</span>
            <button
              onClick={() =>
                save({
                  partyInventory: campaign.partyInventory?.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            >
              ×
            </button>
          </div>
        ))}
        <div className="section-title"><h3>Campaign Access</h3></div>
        {(campaign.members ?? []).map((member) => <div className="record-line" key={member.id}><span><b>{member.displayName}</b> · @{member.username}</span>{campaign.role === "dm" && member.role !== "dm" ? <select defaultValue={member.role} onChange={(event) => fetch(`/api/campaigns/${campaign.id}/members/${member.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: event.target.value }) })}><option value="player">Player</option><option value="assistant">Assistant DM</option><option value="viewer">Viewer</option></select> : <small>{member.role}</small>}</div>)}
      </section>
    </div>
  );
}
function EncounterBoard({
  encounters,
  save,
}: {
  encounters: Encounter[];
  save: (value: Encounter[]) => void;
}) {
  const [name, setName] = useState("");
  const [combatant, setCombatant] = useState("");
  const active = encounters[0];
  function patch(p: Partial<Encounter>) {
    if (active) save([{ ...active, ...p }, ...encounters.slice(1)]);
  }
  return (
    <div className="command-grid">
      <section>
        <div className="section-title">
          <h3>Encounter Builder</h3>
        </div>
        {!active ? (
          <div className="inline-add">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Encounter name"
            />
            <button
              onClick={() => {
                if (name.trim())
                  save([
                    {
                      id: Date.now(),
                      name,
                      round: 1,
                      activeTurn: 0,
                      combatants: [],
                    },
                  ]);
              }}
            >
              Create Encounter
            </button>
          </div>
        ) : (
          <>
            <div className="encounter-bar">
              <button
                onClick={() => patch({ round: Math.max(1, active.round - 1) })}
              >
                −
              </button>
              <strong>Round {active.round}</strong>
              <button onClick={() => patch({ round: active.round + 1 })}>
                ＋
              </button>
              <button onClick={() => save([])}>End</button>
            </div>
            <div className="inline-add">
              <input
                value={combatant}
                onChange={(e) => setCombatant(e.target.value)}
                placeholder="Add monster or NPC"
              />
              <button
                onClick={() => {
                  if (combatant.trim()) {
                    patch({
                      combatants: [
                        ...active.combatants,
                        {
                          id: Date.now(),
                          name: combatant,
                          initiative: Math.floor(Math.random() * 20) + 1,
                          hp: 10,
                          maxHp: 10,
                          ac: 12,
                          conditions: [],
                          kind: "Monster",
                        },
                      ],
                    });
                    setCombatant("");
                  }
                }}
              >
                Add
              </button>
            </div>
            <div className="initiative-list">
              {[...active.combatants]
                .sort((a, b) => b.initiative - a.initiative)
                .map((unit, index) => (
                  <article
                    className={active.activeTurn === index ? "active" : ""}
                    key={unit.id}
                  >
                    <b>{unit.initiative}</b>
                    <span>
                      {unit.name}
                      <small>
                        {unit.kind} · AC {unit.ac}
                      </small>
                    </span>
                    <label>
                      HP{" "}
                      <input
                        type="number"
                        value={unit.hp}
                        onChange={(e) =>
                          patch({
                            combatants: active.combatants.map((c) =>
                              c.id === unit.id
                                ? { ...c, hp: Number(e.target.value) }
                                : c,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      onClick={() =>
                        patch({
                          combatants: active.combatants.filter(
                            (c) => c.id !== unit.id,
                          ),
                        })
                      }
                    >
                      ×
                    </button>
                  </article>
                ))}
            </div>
            <button
              className="primary"
              onClick={() =>
                patch({
                  activeTurn:
                    (active.activeTurn + 1) %
                    Math.max(1, active.combatants.length),
                })
              }
            >
              Next Turn
            </button>
          </>
        )}
      </section>
      <section>
        <div className="section-title">
          <h3>Saved Encounters</h3>
        </div>
        {encounters.slice(1).map((item) => (
          <button
            className="record-card"
            key={item.id}
            onClick={() =>
              save([item, ...encounters.filter((e) => e.id !== item.id)])
            }
          >
            <b>{item.name}</b>
            <span>{item.combatants.length} combatants</span>
          </button>
        ))}
      </section>
    </div>
  );
}
function JournalBoard({
  notes,
  save,
}: {
  notes: Note[];
  save: (notes: Note[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div>
      <div className="journal-compose">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Session title"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Recap, clues, promises, discoveries…"
        />
        <button
          className="primary"
          onClick={() => {
            if (title.trim()) {
              save([
                {
                  id: Date.now(),
                  title,
                  body,
                  createdAt: new Date().toISOString(),
                },
                ...notes,
              ]);
              setTitle("");
              setBody("");
            }
          }}
        >
          Add Journal Entry
        </button>
      </div>
      <div className="journal-grid">
        {notes.map((note) => (
          <article key={note.id}>
            <small>{new Date(note.createdAt).toLocaleDateString()}</small>
            <h3>{note.title}</h3>
            <p>{note.body}</p>
            <button onClick={() => save(notes.filter((n) => n.id !== note.id))}>
              Delete
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
function QuestBoard({
  quests,
  save,
}: {
  quests: Quest[];
  save: (quests: Quest[]) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div>
      <div className="inline-add">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New quest or objective"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              save([
                ...quests,
                { id: Date.now(), name, status: "Active", notes: "" },
              ]);
              setName("");
            }
          }}
        >
          Add Quest
        </button>
      </div>
      <div className="quest-board">
        {quests.map((quest) => (
          <article key={quest.id} className={quest.status.toLowerCase()}>
            <select
              value={quest.status}
              onChange={(e) =>
                save(
                  quests.map((q) =>
                    q.id === quest.id
                      ? { ...q, status: e.target.value as Quest["status"] }
                      : q,
                  ),
                )
              }
            >
              <option>Active</option>
              <option>Complete</option>
              <option>Failed</option>
            </select>
            <b>{quest.name}</b>
            <textarea
              value={quest.notes}
              placeholder="Objectives and rewards"
              onChange={(e) =>
                save(
                  quests.map((q) =>
                    q.id === quest.id ? { ...q, notes: e.target.value } : q,
                  ),
                )
              }
            />
          </article>
        ))}
      </div>
    </div>
  );
}
function WorldBoard({
  campaign,
  save,
}: {
  campaign: Campaign;
  save: (patch: Partial<Campaign>) => void;
}) {
  const [kind, setKind] = useState<"npcs" | "factions">("npcs");
  const [name, setName] = useState("");
  const entries = campaign[kind] ?? [];
  return (
    <div>
      <div className="score-methods">
        <button
          className={kind === "npcs" ? "active" : ""}
          onClick={() => setKind("npcs")}
        >
          NPC Directory
        </button>
        <button
          className={kind === "factions" ? "active" : ""}
          onClick={() => setKind("factions")}
        >
          Factions
        </button>
      </div>
      <div className="inline-add">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={kind === "npcs" ? "NPC name" : "Faction name"}
        />
        <button
          onClick={() => {
            if (name.trim()) {
              save({
                [kind]: [...entries, { id: Date.now(), name, description: "" }],
              });
              setName("");
            }
          }}
        >
          Add
        </button>
      </div>
      <div className="world-grid">
        {entries.map((entry) => (
          <article key={entry.id}>
            <input
              value={entry.name}
              onChange={(e) =>
                save({
                  [kind]: entries.map((item) =>
                    item.id === entry.id
                      ? { ...item, name: e.target.value }
                      : item,
                  ),
                })
              }
            />
            <textarea
              value={entry.description}
              placeholder="Description, allegiance, secrets…"
              onChange={(e) =>
                save({
                  [kind]: entries.map((item) =>
                    item.id === entry.id
                      ? { ...item, description: e.target.value }
                      : item,
                  ),
                })
              }
            />
          </article>
        ))}
      </div>
    </div>
  );
}
function MapBoard({
  map,
  save,
}: {
  map: MapData;
  save: (map: MapData) => void;
}) {
  const [name, setName] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  function uploadMap(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 4_000_000) return window.alert("Use a map image under 4 MB.");
    const reader = new FileReader();
    reader.onload = () => save({ ...map, background: String(reader.result) });
    reader.readAsDataURL(file);
  }
  return (
    <div className="map-layout">
      <div className="map-toolbar">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Token name"
        />
        <button
          onClick={() => {
            if (name.trim()) {
              save({
                ...map,
                tokens: [
                  ...map.tokens,
                  { id: Date.now(), name, x: 50, y: 50, color: "#a65de0" },
                ],
              });
              setName("");
            }
          }}
        >
          Add token
        </button>
        <label>
          Map image URL
          <input
            value={map.background ?? ""}
            onChange={(e) => save({ ...map, background: e.target.value })}
          />
        </label>
        <label className="map-upload">Upload map<input type="file" accept="image/*" onChange={uploadMap} /></label>
        <button className={map.grid ? "active" : ""} onClick={() => save({ ...map, grid: !map.grid })}>Grid</button>
        <button className={map.fog ? "active" : ""} onClick={() => save({ ...map, fog: !map.fog })}>Fog</button>
        <label>Grid size<input type="range" min="20" max="100" value={map.gridSize ?? 50} onChange={(event) => save({ ...map, gridSize: Number(event.target.value) })} /></label>
        <button onClick={() => setFullscreen(!fullscreen)}>{fullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
      </div>
      <div
        className={`battle-map ${map.grid ? "with-grid" : ""} ${map.fog ? "with-fog" : ""} ${fullscreen ? "map-fullscreen" : ""}`}
        style={
          map.background
            ? { backgroundImage: `${map.fog ? "linear-gradient(rgba(0,0,0,.72),rgba(0,0,0,.72))," : ""}url(${map.background})`, backgroundSize: map.grid ? `${map.gridSize ?? 50}px ${map.gridSize ?? 50}px, cover` : "cover" }
            : { backgroundSize: `${map.gridSize ?? 50}px ${map.gridSize ?? 50}px` }
        }
        onClick={(event) => {
          if (!map.tokens.length) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const last = map.tokens.at(-1)!;
          save({
            ...map,
            tokens: map.tokens.map((token) =>
              token.id === last.id
                ? {
                    ...token,
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                  }
                : token,
            ),
          });
        }}
      >
        {map.tokens.map((token) => (
          <button
            key={token.id}
            style={{
              left: `${token.x}%`,
              top: `${token.y}%`,
              background: token.color,
            }}
            title="Click the map to move the newest token"
          >
            {token.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompendiumHub() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ type: string; name: string; detail: string } | null>(null);
  const records = useMemo(() => {
    const classes = Object.entries(CLASS_RULES).map(([name, data]) => ({
      type: "Class",
      name,
      detail: `d${data.hitDie} · ${data.primary}`,
    }));
    const items = ITEM_CATALOG.map((item) => ({
      type: "Equipment",
      name: item.name,
      detail: `${item.cost} · ${item.weight} lb`,
    }));
    const species = Object.entries(SPECIES).map(([name, data]) => ({
      type: "Species",
      name,
      detail: data.summary,
    }));
    const backgrounds = Object.entries(BACKGROUNDS).map(([name, data]) => ({
      type: "Background",
      name,
      detail: `${data.feat} · ${data.skills}`,
    }));
    const spells = Object.values(STARTER_SPELLS)
      .flat()
      .filter((name, index, array) => array.indexOf(name) === index)
      .map((name) => ({ type: "Spell", name, detail: spellInfo(name).summary }));
    return [...classes, ...items, ...species, ...backgrounds, ...spells];
  }, []);
  const filtered = records.filter((record) =>
    `${record.type} ${record.name} ${record.detail}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="tool-page">
      <div className="tool-title">
        <div>
          <p>ROYAL ARCHIVES</p>
          <h1>Compendium</h1>
          <span>
            Search classes, species, backgrounds, spells, weapons, armor, and
            gear.
          </span>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
        />
      </div>
      <div className={`compendium-layout ${selected ? "inspecting" : ""}`}>
      <div className="compendium-grid">
        {filtered.map((record) => (
          <button className={selected?.type === record.type && selected?.name === record.name ? "selected" : ""} onClick={() => setSelected(record)} key={`${record.type}-${record.name}`}>
            <small>{record.type}</small>
            <b>{record.name}</b>
            <span>{record.detail}</span>
            <em>Inspect details →</em>
          </button>
        ))}
      </div>
      {selected && <aside className="compendium-detail">
        <header><div><small>{selected.type}</small><h2>{selected.name}</h2></div><button aria-label="Close inspector" onClick={() => setSelected(null)}>×</button></header>
        {selected.type === "Class" && (() => {
          const rule = CLASS_RULES[selected.name];
          return <>
            <div className="archive-facts"><span><b>d{rule.hitDie}</b> Hit Die</span><span><b>{rule.primary}</b> Primary ability</span></div>
            <section><h3>Subclass choices</h3><p>{rule.subclasses.join(" · ")}</p></section>
            <section><h3>Features by class level</h3><div className="archive-feature-list">{[...rule.features].sort((a,b) => a.level-b.level).map((feature, index) => <article key={`${feature.level}-${feature.name}-${index}`}><b>Level {feature.level} · {feature.name}</b><p>{featureDescription(feature.name, feature.track)}</p>{feature.track && <small>Uses can be tracked from the character's Actions tab.</small>}</article>)}</div></section>
          </>;
        })()}
        {selected.type === "Species" && (() => { const species = SPECIES[selected.name as keyof typeof SPECIES]; return <><p className="archive-summary">{species.summary}</p><section><h3>Species traits</h3><div className="archive-feature-list">{species.traits.map((trait) => <article key={trait.name}><b>{trait.name}</b><p>{trait.summary}</p></article>)}</div></section></>; })()}
        {selected.type === "Background" && (() => { const background = BACKGROUNDS[selected.name as keyof typeof BACKGROUNDS]; return <><div className="archive-facts"><span><b>{background.skills}</b> Skill proficiencies</span><span><b>{background.feat}</b> Origin feat</span></div><section><h3>What it changes</h3><p>These skills become proficient, adding your proficiency bonus to their checks. At level 1 that is +2, in addition to the linked ability modifier.</p><p><b>Eligible abilities:</b> {background.abilities}</p><p><b>Tool:</b> {background.tool}</p></section></>; })()}
        {selected.type === "Spell" && (() => { const spell = spellInfo(selected.name); return <><div className="archive-facts"><span><b>{spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}</b> {spell.school}</span><span><b>{spell.castingTime}</b> Casting time</span></div><section><h3>Spell rules</h3><p>{spell.summary}</p><p><b>Range:</b> {spell.range}</p><p><b>Duration:</b> {spell.duration}{spell.concentration ? " · Concentration" : ""}</p></section></>; })()}
        {selected.type === "Equipment" && (() => { const item = ITEM_CATALOG.find((entry) => entry.name === selected.name)!; return <><div className="archive-facts"><span><b>{item.cost}</b> Cost</span><span><b>{item.weight} lb</b> Weight</span></div><section><h3>Equipment record</h3><p>Standard adventuring equipment is Common. Add it from Inventory, where you can equip armor and weapons or customize damage and rarity.</p></section></>; })()}
      </aside>}
      </div>
    </section>
  );
}
export function HomebrewHub({
  entries,
  setEntries,
}: {
  entries: HomebrewEntry[];
  setEntries: (entries: HomebrewEntry[]) => void;
}) {
  const [draft, setDraft] = useState<HomebrewEntry>({
    id: 0,
    type: "Item",
    name: "",
    summary: "",
    formula: "",
    tags: [],
  });
  return (
    <section className="tool-page">
      <div className="tool-title">
        <div>
          <p>THE FORGE</p>
          <h1>Homebrew Studio</h1>
          <span>
            Create spells, items, feats, monsters, species, subclasses, and
            conditions.
          </span>
        </div>
      </div>
      <div className="homebrew-layout">
        <section className="homebrew-form">
          <label>
            Type
            <select
              value={draft.type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  type: e.target.value as HomebrewEntry["type"],
                })
              }
            >
              {[
                "Spell",
                "Item",
                "Feat",
                "Monster",
                "Species",
                "Subclass",
                "Condition",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Rules summary
            <textarea
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            />
          </label>
          <label>
            Dice formula or effect
            <input
              value={draft.formula}
              onChange={(e) => setDraft({ ...draft, formula: e.target.value })}
              placeholder="2d6+3, AC +1, 3/Long Rest…"
            />
          </label>
          <button
            className="primary"
            onClick={() => {
              if (draft.name.trim()) {
                setEntries([...entries, { ...draft, id: Date.now() }]);
                setDraft({
                  ...draft,
                  id: 0,
                  name: "",
                  summary: "",
                  formula: "",
                });
              }
            }}
          >
            Forge Creation
          </button>
        </section>
        <section className="homebrew-list">
          {entries.map((entry) => (
            <article key={entry.id}>
              <small>{entry.type}</small>
              <h3>{entry.name}</h3>
              <p>{entry.summary}</p>
              {entry.formula && <code>{entry.formula}</code>}
              <button
                onClick={() =>
                  setEntries(entries.filter((item) => item.id !== entry.id))
                }
              >
                Delete
              </button>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
export function AdminHub() {
  const [users, setUsers] = useState<Account[]>([]);
  const [allow, setAllow] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Record<string, string | number>>({});
  const [audit, setAudit] = useState<{ id: number; username?: string; action: string; target?: string; created_at: string }[]>([]);
  async function load() {
    const [u, s, d, a] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/admin/diagnostics").then((r) => r.json()),
      fetch("/api/admin/audit").then((r) => r.json()),
    ]);
    setUsers(u.users ?? []);
    setAllow(s.allowRegistration);
    setDiagnostics(d);
    setAudit(a.entries ?? []);
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <section className="tool-page">
      <div className="tool-title">
        <div>
          <p>ROYAL AUTHORITY</p>
          <h1>Administration</h1>
          <span>Manage registration, roles, storage, and account access.</span>
        </div>
      </div>
      <label className="animation-toggle admin-setting">
        <span>
          <b>Open registration</b>
          <small>When disabled, only existing accounts can sign in.</small>
        </span>
        <input
          type="checkbox"
          checked={allow}
          onChange={async (e) => {
            setAllow(e.target.checked);
            await fetch("/api/admin/settings", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ allowRegistration: e.target.checked }),
            });
          }}
        />
        <i />
      </label>
      <div className="admin-actions">
        <a className="primary" href="/api/admin/backup">
          Download Database Backup
        </a>
        <span>
          Includes accounts, campaign memberships, shared campaigns, and vaults.
          Keep it private.
        </span>
      </div>
      <div className="diagnostic-grid">
        {Object.entries(diagnostics).filter(([key]) => key !== "dataDir").map(([key, value]) => <article key={key}><small>{key.replace(/([A-Z])/g, " $1")}</small><b>{key === "databaseBytes" ? `${(Number(value) / 1024 / 1024).toFixed(2)} MB` : String(value)}</b></article>)}
      </div>
      <div className="admin-users">
        {users.map((user) => (
          <article key={user.id}>
            <div className="avatar">
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <span>
              <b>{user.displayName}</b>
              <small>@{user.username}</small>
            </span>
            <select
              value={user.role}
              onChange={async (e) => {
                await fetch(`/api/admin/users/${user.id}/role`, {
                  method: "PUT",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ role: e.target.value }),
                });
                load();
              }}
            >
              <option value="user">Player</option>
              <option value="admin">Administrator</option>
            </select>
          </article>
        ))}
      </div>
      <section className="audit-panel"><h2>Recent security & change history</h2>{audit.slice(0, 40).map((entry) => <article key={entry.id}><b>{entry.action}</b><span>{entry.username || "system"} · {entry.target || "—"}</span><time>{new Date(entry.created_at).toLocaleString()}</time></article>)}</section>
    </section>
  );
}
