"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
type Tab = "core" | "actions" | "spells" | "inventory" | "features" | "notes";
type RollMode = "normal" | "advantage" | "disadvantage";
type Roll = { id: number; label: string; formula: string; total: number; detail: string; critical?: boolean; fumble?: boolean };
type Item = { id: number; name: string; quantity: number; weight: number; equipped: boolean };
type Spell = { id: number; name: string; level: number; school: string; prepared: boolean; description: string };
type Hero = {
  id: number; name: string; className: string; subclass: string; level: number; ancestry: string; background: string;
  hp: number; maxHp: number; tempHp: number; ac: number; speed: number; xp: number; inspiration: boolean;
  abilities: Record<AbilityKey, number>; proficiency: AbilityKey[]; skillProficiency: string[];
  initials: string; notes: string; personality: string; ideals: string; bonds: string; flaws: string;
  hitDice: number; maxHitDice: number; deathSuccess: number; deathFail: number;
  spellSlots: Record<number, { used: number; max: number }>; inventory: Item[]; spells: Spell[];
};

const STORAGE_KEY = "kingdom-forge-v2";
const abilities: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" }, { key: "dex", label: "DEX" }, { key: "con", label: "CON" },
  { key: "int", label: "INT" }, { key: "wis", label: "WIS" }, { key: "cha", label: "CHA" },
];
const skills: { name: string; ability: AbilityKey }[] = [
  { name: "Acrobatics", ability: "dex" }, { name: "Animal Handling", ability: "wis" }, { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" }, { name: "Deception", ability: "cha" }, { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" }, { name: "Intimidation", ability: "cha" }, { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" }, { name: "Nature", ability: "int" }, { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" }, { name: "Persuasion", ability: "cha" }, { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" }, { name: "Stealth", ability: "dex" }, { name: "Survival", ability: "wis" },
];
const tabs: { key: Tab; label: string }[] = [
  { key: "core", label: "Core" }, { key: "actions", label: "Actions" }, { key: "spells", label: "Spells" },
  { key: "inventory", label: "Inventory" }, { key: "features", label: "Features" }, { key: "notes", label: "Notes" },
];

function makeHero(id = Date.now()): Hero {
  return {
    id, name: "New Adventurer", className: "Fighter", subclass: "", level: 1, ancestry: "Human", background: "Folk Hero",
    hp: 12, maxHp: 12, tempHp: 0, ac: 16, speed: 30, xp: 0, inspiration: false,
    abilities: { str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 11 }, proficiency: ["str", "con"],
    skillProficiency: ["Athletics", "Perception"], initials: "NA", notes: "", personality: "", ideals: "", bonds: "", flaws: "",
    hitDice: 1, maxHitDice: 1, deathSuccess: 0, deathFail: 0,
    spellSlots: { 1: { used: 0, max: 0 }, 2: { used: 0, max: 0 }, 3: { used: 0, max: 0 } },
    inventory: [{ id: 1, name: "Longsword", quantity: 1, weight: 3, equipped: true }, { id: 2, name: "Explorer's Pack", quantity: 1, weight: 10, equipped: false }],
    spells: [],
  };
}

const initialHeroes: Hero[] = [
  {
    ...makeHero(1), name: "Soren Vale", className: "Paladin", subclass: "Oath of Devotion", level: 7, ancestry: "Aasimar", background: "Soldier",
    hp: 61, maxHp: 68, ac: 19, xp: 23000, initials: "SV", abilities: { str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 18 },
    proficiency: ["wis", "cha"], skillProficiency: ["Athletics", "Insight", "Intimidation", "Persuasion", "Religion"], hitDice: 5, maxHitDice: 7,
    spellSlots: { 1: { used: 1, max: 4 }, 2: { used: 1, max: 3 }, 3: { used: 0, max: 0 } },
    spells: [
      { id: 1, name: "Bless", level: 1, school: "Enchantment", prepared: true, description: "Bolster up to three allies with divine favor." },
      { id: 2, name: "Cure Wounds", level: 1, school: "Evocation", prepared: true, description: "Restore vitality to a creature you touch." },
      { id: 3, name: "Lesser Restoration", level: 2, school: "Abjuration", prepared: true, description: "End one disease or debilitating condition." },
      { id: 4, name: "Zone of Truth", level: 2, school: "Enchantment", prepared: false, description: "Create an area that guards against deliberate lies." },
    ],
    personality: "Calm under pressure and fiercely protective.", ideals: "Power is meaningful only when used to protect others.",
    bonds: "I owe my life to the company that raised me.", flaws: "I carry every failure as if it were mine alone.",
    notes: "The silver sigil reacts to Zechon energy. Ask the archivist about the eastern ruins.",
  },
  { ...makeHero(2), name: "Arturo Reyes", className: "Monk", subclass: "Way of the Open Hand", level: 6, ancestry: "Human", hp: 48, maxHp: 48, ac: 17, initials: "AR", abilities: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 11 }, proficiency: ["str", "dex"], hitDice: 6, maxHitDice: 6 },
  { ...makeHero(3), name: "Nyx Thorn", className: "Rogue", subclass: "Arcane Trickster", level: 5, ancestry: "Tiefling", hp: 35, maxHp: 42, ac: 16, initials: "NT", abilities: { str: 9, dex: 18, con: 13, int: 16, wis: 12, cha: 14 }, proficiency: ["dex", "int"], hitDice: 3, maxHitDice: 5 },
];

function mod(score: number) { return Math.floor((score - 10) / 2); }
function signed(value: number) { return value >= 0 ? `+${value}` : `${value}`; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"; }

export default function Home() {
  const [heroes, setHeroes] = useState<Hero[]>(initialHeroes);
  const [selectedId, setSelectedId] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("core");
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [formula, setFormula] = useState("1d20+4");
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const hero = useMemo(() => heroes.find((item) => item.id === selectedId) ?? heroes[0], [heroes, selectedId]);
  const proficiencyBonus = Math.ceil(hero.level / 4) + 1;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { heroes: Hero[]; selectedId: number };
        if (parsed.heroes?.length) { setHeroes(parsed.heroes); setSelectedId(parsed.selectedId ?? parsed.heroes[0].id); }
      }
    } catch { /* use starter data if a local save is damaged */ }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ heroes, selectedId })); }, [heroes, selectedId, ready]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timer); }, [toast]);

  function updateHero(patch: Partial<Hero>) { setHeroes((items) => items.map((item) => item.id === hero.id ? { ...item, ...patch } : item)); }
  function createHero() { const next = makeHero(); setHeroes((items) => [...items, next]); setSelectedId(next.id); setActiveTab("core"); setShowEditor(true); }
  function duplicateHero() { const copy = { ...hero, id: Date.now(), name: `${hero.name} Copy`, initials: initials(`${hero.name} Copy`), inventory: hero.inventory.map((item) => ({ ...item, id: Date.now() + item.id })), spells: hero.spells.map((spell) => ({ ...spell, id: Date.now() + spell.id })) }; setHeroes((items) => [...items, copy]); setSelectedId(copy.id); setShowMenu(false); setToast("Character duplicated"); }
  function deleteHero() { if (heroes.length === 1 || !window.confirm(`Delete ${hero.name}? This cannot be undone.`)) return; const remaining = heroes.filter((item) => item.id !== hero.id); setHeroes(remaining); setSelectedId(remaining[0].id); setShowMenu(false); setToast("Character deleted"); }
  function applyHp(amount: number) { const next = Math.max(0, Math.min(hero.maxHp, hero.hp + amount)); updateHero({ hp: next, deathSuccess: next > 0 ? 0 : hero.deathSuccess, deathFail: next > 0 ? 0 : hero.deathFail }); }
  function shortRest() { updateHero({ hp: Math.min(hero.maxHp, hero.hp + Math.max(1, Math.floor(hero.maxHp / 4))), hitDice: Math.max(0, hero.hitDice - 1) }); setToast("Short rest complete"); }
  function longRest() { updateHero({ hp: hero.maxHp, tempHp: 0, hitDice: Math.min(hero.maxHitDice, hero.hitDice + Math.max(1, Math.floor(hero.maxHitDice / 2))), deathSuccess: 0, deathFail: 0, spellSlots: Object.fromEntries(Object.entries(hero.spellSlots).map(([level, slot]) => [level, { ...slot, used: 0 }])) }); setToast("Long rest complete"); }

  function parseAndRoll(input: string, label = "Custom Roll", mode = rollMode) {
    const clean = input.replace(/\s+/g, "").toLowerCase();
    const terms = clean.match(/[+-]?[^+-]+/g);
    if (!terms?.length) { setToast("Try a formula like 2d6+3"); return; }
    let total = 0; const parts: string[] = []; let firstD20: number | undefined;
    for (const raw of terms) {
      const sign = raw.startsWith("-") ? -1 : 1; const term = raw.replace(/^[+-]/, ""); const die = term.match(/^(\d*)d(\d+)$/);
      if (die) {
        const count = Math.min(Number(die[1] || 1), 50); const sides = Math.min(Number(die[2]), 1000);
        if (!sides) { setToast("That dice formula is not valid"); return; }
        let values = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        if (sides === 20 && count === 1 && mode !== "normal") { const extra = Math.floor(Math.random() * 20) + 1; values = [values[0], extra]; const kept = mode === "advantage" ? Math.max(...values) : Math.min(...values); firstD20 = kept; total += sign * kept; parts.push(`${mode === "advantage" ? "max" : "min"}(${values.join(", ")})`); }
        else { if (sides === 20 && count === 1) firstD20 = values[0]; total += sign * values.reduce((sum, value) => sum + value, 0); parts.push(`${sign < 0 ? "− " : ""}${values.join(" + ")}`); }
      } else if (/^\d+$/.test(term)) { total += sign * Number(term); parts.push(`${sign > 0 ? "+" : "−"} ${term}`); }
      else { setToast("Try a formula like 2d6+3"); return; }
    }
    setRolls((items) => [{ id: Date.now(), label, formula: input, total, detail: parts.join(" "), critical: firstD20 === 20, fumble: firstD20 === 1 }, ...items].slice(0, 12));
  }

  function exportHero() { const blob = new Blob([JSON.stringify(hero, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${hero.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`; link.click(); URL.revokeObjectURL(url); setShowMenu(false); setToast("Character exported"); }
  function importHero(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const value = JSON.parse(String(reader.result)) as Hero; const imported = { ...makeHero(), ...value, id: Date.now(), name: value.name ? `${value.name} (Imported)` : "Imported Adventurer" }; setHeroes((items) => [...items, imported]); setSelectedId(imported.id); setToast("Character imported"); } catch { setToast("That file is not a valid Kingdom Forge character"); } }; reader.readAsText(file); event.target.value = ""; }

  function skillBonus(skill: { name: string; ability: AbilityKey }) { return mod(hero.abilities[skill.ability]) + (hero.skillProficiency.includes(skill.name) ? proficiencyBonus : 0); }

  return (
    <main className="app-shell">
      {toast && <div className="toast" role="status">✦ {toast}</div>}
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">K</div><div><strong>KINGDOM</strong><span>FORGE</span></div></div>
        <nav aria-label="Main navigation"><button className="nav-item active"><span>◆</span> Characters</button><button className="nav-item"><span>⚔</span> Campaigns <small>Soon</small></button><button className="nav-item"><span>✦</span> Compendium <small>Soon</small></button><button className="nav-item"><span>◈</span> Homebrew <small>Soon</small></button></nav>
        <div className="sidebar-callout"><span>✦</span><strong>Local Vault</strong><p>Your characters autosave privately on this device.</p></div>
        <div className="sidebar-footer"><div className="avatar small">TC</div><div><strong>Tommy</strong><span>Dungeon Master</span></div><button aria-label="Settings">⚙</button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p>THE GREAT HALL</p><h1>Your Characters</h1></div><div className="top-actions"><button className="secondary" onClick={() => importRef.current?.click()}>Import</button><input ref={importRef} type="file" accept="application/json" hidden onChange={importHero}/><button className="primary" onClick={createHero}>＋ Create Character</button></div></header>
        <div className="character-strip" aria-label="Character list">{heroes.map((item) => <button key={item.id} className={`hero-chip ${hero.id === item.id ? "selected" : ""}`} onClick={() => { setSelectedId(item.id); setActiveTab("core"); }}><div className="avatar">{item.initials}</div><div><strong>{item.name}</strong><span>Level {item.level} {item.className}</span></div><i style={{ width: `${Math.max(0, item.hp / item.maxHp * 100)}%` }}/></button>)}<button className="new-chip" onClick={createHero}>＋<span>New hero</span></button></div>

        <div className="content-grid">
          <section className="sheet-card">
            <div className="sheet-hero"><button className={`inspiration ${hero.inspiration ? "lit" : ""}`} onClick={() => updateHero({ inspiration: !hero.inspiration })} title="Toggle inspiration">✦</button><div className="portrait">{hero.initials}</div><div className="identity"><p>LEVEL {hero.level} · {hero.ancestry} · {hero.background}</p><h2>{hero.name}</h2><span>{hero.subclass || hero.className} {hero.subclass && `· ${hero.className}`}</span></div><div className="sheet-tools"><button className="ghost" onClick={() => setShowEditor(true)}>Edit Sheet</button><div className="more-wrap"><button className="more" onClick={() => setShowMenu(!showMenu)} aria-label="Character options">•••</button>{showMenu && <div className="dropdown"><button onClick={duplicateHero}>Duplicate</button><button onClick={exportHero}>Export JSON</button><button className="danger" onClick={deleteHero}>Delete</button></div>}</div></div></div>
            <div className="xp-bar"><span>XP {hero.xp.toLocaleString()}</span><i><b style={{ width: `${Math.min(100, hero.xp / Math.max(300, hero.level * hero.level * 1000) * 100)}%` }}/></i><span>LEVEL {hero.level + 1}</span></div>
            <div className="combat-row"><div><span>ARMOR CLASS</span><strong>{hero.ac}</strong></div><div><span>INITIATIVE</span><button onClick={() => parseAndRoll(`1d20${signed(mod(hero.abilities.dex))}`, "Initiative")}>{signed(mod(hero.abilities.dex))}</button></div><div><span>SPEED</span><strong>{hero.speed}<small> ft</small></strong></div><div className="hp"><span>HIT POINTS</span><div className="hp-number"><button onClick={() => applyHp(-1)}>−</button><strong>{hero.hp} <small>/ {hero.maxHp}</small></strong><button onClick={() => applyHp(1)}>＋</button></div><div className="hp-track"><i style={{ width: `${Math.max(0, hero.hp / hero.maxHp * 100)}%` }}/></div></div></div>
            <div className="resource-row"><button onClick={() => updateHero({ tempHp: Math.max(0, hero.tempHp - 1) })}><span>TEMP HP</span><strong>{hero.tempHp}</strong></button><button onClick={shortRest}><span>HIT DICE</span><strong>{hero.hitDice}/{hero.maxHitDice}</strong><small>Short Rest</small></button><button onClick={longRest}><span>REST</span><strong>☾</strong><small>Long Rest</small></button><div className="death-saves"><span>DEATH SAVES</span><label>Success {[0,1,2].map((index) => <button key={index} className={hero.deathSuccess > index ? "success" : ""} onClick={() => updateHero({ deathSuccess: hero.deathSuccess === index + 1 ? index : index + 1 })}/>)}</label><label>Failure {[0,1,2].map((index) => <button key={index} className={hero.deathFail > index ? "failure" : ""} onClick={() => updateHero({ deathFail: hero.deathFail === index + 1 ? index : index + 1 })}/>)}</label></div></div>
            <div className="tabs" role="tablist">{tabs.map((tab) => <button key={tab.key} className={activeTab === tab.key ? "active" : ""} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}</div>

            <div className="tab-content">
              {activeTab === "core" && <CoreTab hero={hero} proficiencyBonus={proficiencyBonus} skillBonus={skillBonus} onRoll={parseAndRoll}/>} 
              {activeTab === "actions" && <ActionsTab hero={hero} proficiencyBonus={proficiencyBonus} onRoll={parseAndRoll}/>} 
              {activeTab === "spells" && <SpellsTab hero={hero} updateHero={updateHero} onRoll={parseAndRoll}/>} 
              {activeTab === "inventory" && <InventoryTab hero={hero} updateHero={updateHero}/>} 
              {activeTab === "features" && <FeaturesTab hero={hero} updateHero={updateHero}/>} 
              {activeTab === "notes" && <NotesTab hero={hero} updateHero={updateHero}/>} 
            </div>
          </section>

          <DicePanel formula={formula} setFormula={setFormula} mode={rollMode} setMode={setRollMode} rolls={rolls} setRolls={setRolls} onRoll={parseAndRoll}/>
        </div>
      </section>
      {showEditor && <Editor hero={hero} onClose={() => setShowEditor(false)} onSave={(patch) => { updateHero({ ...patch, initials: initials(patch.name ?? hero.name), maxHitDice: patch.level ?? hero.level, hitDice: Math.min(hero.hitDice, patch.level ?? hero.level) }); setShowEditor(false); setToast("Character saved"); }}/>} 
    </main>
  );
}

function CoreTab({ hero, proficiencyBonus, skillBonus, onRoll }: { hero: Hero; proficiencyBonus: number; skillBonus: (skill: { name: string; ability: AbilityKey }) => number; onRoll: (formula: string, label?: string) => void }) {
  return <><div className="abilities">{abilities.map(({ key, label }) => <button key={key} onClick={() => onRoll(`1d20${signed(mod(hero.abilities[key]))}`, `${label} Check`)}><span>{label}</span><strong>{signed(mod(hero.abilities[key]))}</strong><small>{hero.abilities[key]}</small></button>)}</div><div className="core-columns"><section><div className="section-title"><h3>Saving Throws</h3><span>PROF {signed(proficiencyBonus)}</span></div>{abilities.map(({ key, label }) => { const value = mod(hero.abilities[key]) + (hero.proficiency.includes(key) ? proficiencyBonus : 0); return <button className="stat-line" key={key} onClick={() => onRoll(`1d20${signed(value)}`, `${label} Save`)}><i className={hero.proficiency.includes(key) ? "trained" : ""}/><span>{label}</span><strong>{signed(value)}</strong></button>; })}</section><section className="skills"><div className="section-title"><h3>Skills</h3><span>PASSIVE {10 + skillBonus({ name: "Perception", ability: "wis" })}</span></div>{skills.map((skill) => { const value = skillBonus(skill); return <button className="stat-line" key={skill.name} onClick={() => onRoll(`1d20${signed(value)}`, skill.name)}><i className={hero.skillProficiency.includes(skill.name) ? "trained" : ""}/><span>{skill.name}<small>{skill.ability.toUpperCase()}</small></span><strong>{signed(value)}</strong></button>; })}</section></div></>;
}

function ActionsTab({ hero, proficiencyBonus, onRoll }: { hero: Hero; proficiencyBonus: number; onRoll: (formula: string, label?: string) => void }) {
  const attack = mod(hero.abilities.str) + proficiencyBonus;
  return <div className="feature-layout"><section><div className="section-title"><h3>Attacks & Actions</h3><span>ATTACK {signed(attack)}</span></div><button className="big-action" onClick={() => onRoll(`1d20${signed(attack)}`, "Longsword Attack")}><span className="action-icon">⚔</span><span><b>Longsword</b><small>Melee weapon · 5 ft</small></span><strong>{signed(attack)}</strong><em onClick={(event) => { event.stopPropagation(); onRoll(`1d8${signed(mod(hero.abilities.str))}`, "Longsword Damage"); }}>1d8{signed(mod(hero.abilities.str))}</em></button><button className="big-action" onClick={() => onRoll(`1d20${signed(proficiencyBonus + mod(hero.abilities.cha))}`, "Spell Attack")}><span className="action-icon gold">✦</span><span><b>Divine Smite</b><small>Radiant · expend spell slot</small></span><strong>{signed(proficiencyBonus + mod(hero.abilities.cha))}</strong><em onClick={(event) => { event.stopPropagation(); onRoll("2d8", "Divine Smite Damage"); }}>2d8</em></button><button className="big-action"><span className="action-icon blue">♥</span><span><b>Lay on Hands</b><small>Healing pool · action</small></span><strong>{hero.level * 5}</strong><em>HP</em></button></section><section><div className="section-title"><h3>Combat Reference</h3></div><div className="reference-grid"><article><b>Attack</b><span>d20 + modifier + proficiency</span></article><article><b>Grapple</b><span>Athletics vs Athletics/Acrobatics</span></article><article><b>Dash</b><span>Gain movement equal to your speed</span></article><article><b>Dodge</b><span>Attacks against you have disadvantage</span></article><article><b>Help</b><span>Grant advantage to an ally</span></article><article><b>Ready</b><span>Choose trigger and reaction</span></article></div></section></div>;
}

function SpellsTab({ hero, updateHero, onRoll }: { hero: Hero; updateHero: (patch: Partial<Hero>) => void; onRoll: (formula: string, label?: string) => void }) {
  const casting = mod(hero.abilities.cha); const prof = Math.ceil(hero.level / 4) + 1;
  function useSlot(level: number) { const slot = hero.spellSlots[level]; if (!slot?.max) return; updateHero({ spellSlots: { ...hero.spellSlots, [level]: { ...slot, used: slot.used >= slot.max ? 0 : slot.used + 1 } } }); }
  return <div><div className="spell-summary"><article><span>SPELLCASTING</span><strong>CHA</strong></article><article><span>SAVE DC</span><strong>{8 + prof + casting}</strong></article><article><span>ATTACK</span><button onClick={() => onRoll(`1d20${signed(prof + casting)}`, "Spell Attack")}>{signed(prof + casting)}</button></article><article><span>PREPARED</span><strong>{hero.spells.filter((spell) => spell.prepared).length}</strong></article></div><div className="slot-row">{Object.entries(hero.spellSlots).map(([level, slot]) => <button key={level} onClick={() => useSlot(Number(level))}><span>LEVEL {level}</span><div>{Array.from({ length: slot.max || 1 }, (_, index) => <i key={index} className={slot.used > index ? "used" : slot.max ? "" : "locked"}/>)}</div></button>)}</div><div className="section-title"><h3>Spellbook</h3><span>{hero.spells.length} SPELLS</span></div><div className="spell-list">{hero.spells.length ? hero.spells.map((spell) => <article key={spell.id}><button className={`prepare ${spell.prepared ? "active" : ""}`} onClick={() => updateHero({ spells: hero.spells.map((item) => item.id === spell.id ? { ...item, prepared: !item.prepared } : item) })}>✦</button><span><b>{spell.name}</b><small>Level {spell.level} · {spell.school}</small><p>{spell.description}</p></span><button onClick={() => onRoll(`1d20${signed(prof + casting)}`, spell.name)}>Cast</button></article>) : <div className="empty-state"><strong>No spells yet</strong><span>Add spell management in the next update.</span></div>}</div></div>;
}

function InventoryTab({ hero, updateHero }: { hero: Hero; updateHero: (patch: Partial<Hero>) => void }) {
  const [name, setName] = useState(""); const total = hero.inventory.reduce((sum, item) => sum + item.weight * item.quantity, 0);
  function add() { if (!name.trim()) return; updateHero({ inventory: [...hero.inventory, { id: Date.now(), name: name.trim(), quantity: 1, weight: 0, equipped: false }] }); setName(""); }
  return <div><div className="inventory-summary"><span>CARRYING <b>{total} lb</b></span><span>CAPACITY <b>{hero.abilities.str * 15} lb</b></span><div><i style={{ width: `${Math.min(100, total / (hero.abilities.str * 15) * 100)}%` }}/></div></div><div className="add-row"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="Add an item…"/><button onClick={add}>Add Item</button></div><div className="inventory-list"><div className="inventory-head"><span>ITEM</span><span>QTY</span><span>WEIGHT</span><span/></div>{hero.inventory.map((item) => <div key={item.id}><button className={`equip ${item.equipped ? "active" : ""}`} onClick={() => updateHero({ inventory: hero.inventory.map((entry) => entry.id === item.id ? { ...entry, equipped: !entry.equipped } : entry) })}>◆</button><span><b>{item.name}</b><small>{item.equipped ? "Equipped" : "Stowed"}</small></span><input type="number" min="0" value={item.quantity} onChange={(event) => updateHero({ inventory: hero.inventory.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) } : entry) })}/><input type="number" min="0" value={item.weight} onChange={(event) => updateHero({ inventory: hero.inventory.map((entry) => entry.id === item.id ? { ...entry, weight: Number(event.target.value) } : entry) })}/><button className="remove" onClick={() => updateHero({ inventory: hero.inventory.filter((entry) => entry.id !== item.id) })}>×</button></div>)}</div></div>;
}

function FeaturesTab({ hero, updateHero }: { hero: Hero; updateHero: (patch: Partial<Hero>) => void }) { return <div className="feature-layout"><section><div className="section-title"><h3>Character Details</h3></div>{([ ["Personality", "personality"], ["Ideals", "ideals"], ["Bonds", "bonds"], ["Flaws", "flaws"] ] as const).map(([label, key]) => <label className="text-card" key={key}><span>{label}</span><textarea value={hero[key]} onChange={(event) => updateHero({ [key]: event.target.value })}/></label>)}</section><section><div className="section-title"><h3>Class Features</h3></div><article className="feature-card"><span>PALADIN · LEVEL 1</span><h4>Divine Sense</h4><p>Detect strong celestial, fiendish, or undead presences nearby.</p></article><article className="feature-card"><span>PALADIN · LEVEL 2</span><h4>Divine Smite</h4><p>Expend a spell slot when you hit to deal additional radiant damage.</p></article><article className="feature-card"><span>{hero.ancestry.toUpperCase()}</span><h4>Healing Hands</h4><p>Channel divine energy to restore hit points to a creature you touch.</p></article></section></div>; }
function NotesTab({ hero, updateHero }: { hero: Hero; updateHero: (patch: Partial<Hero>) => void }) { return <div className="notes-tab"><div><span>ADVENTURE JOURNAL</span><strong>Session Notes</strong></div><textarea value={hero.notes} onChange={(event) => updateHero({ notes: event.target.value })} placeholder="Track clues, promises, NPCs, treasure, and everything your hero learns…"/><small>Autosaved on this device</small></div>; }

function DicePanel({ formula, setFormula, mode, setMode, rolls, setRolls, onRoll }: { formula: string; setFormula: (value: string) => void; mode: RollMode; setMode: (value: RollMode) => void; rolls: Roll[]; setRolls: (rolls: Roll[]) => void; onRoll: (formula: string, label?: string, mode?: RollMode) => void }) {
  return <aside className="dice-panel"><div className="dice-heading"><div><p>DICE TRAY</p><h2>Roll destiny</h2></div><span className="d20">20</span></div><div className="quick-dice">{[4,6,8,10,12,20,100].map((die) => <button key={die} onClick={() => { setFormula(`1d${die}`); onRoll(`1d${die}`, `d${die}`); }}>d{die}</button>)}</div><div className="roll-mode">{(["disadvantage", "normal", "advantage"] as RollMode[]).map((value) => <button key={value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>{value === "normal" ? "Straight" : value}</button>)}</div><div className="formula"><input value={formula} onChange={(event) => setFormula(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onRoll(formula)} aria-label="Dice formula"/><button onClick={() => onRoll(formula)}>ROLL</button></div><p className="formula-help">Try 2d6+3, 1d20-1, or 4d8+1d6</p><div className="history-head"><h3>Recent Rolls</h3><button onClick={() => setRolls([])}>Clear</button></div><div className="roll-list">{rolls.length ? rolls.map((roll) => <div className={`roll ${roll.critical ? "critical" : ""} ${roll.fumble ? "fumble" : ""}`} key={roll.id}><div><strong>{roll.label}</strong><span>{roll.formula} · {roll.detail}</span></div><b>{roll.total}</b></div>) : <div className="empty-state compact"><strong>The dice await</strong><span>Click any check or choose a die above.</span></div>}</div><div className="dice-tip"><span>✦</span><p><strong>Table ready</strong>Every ability, skill, save, and attack can roll directly into this tray.</p></div></aside>;
}

function Editor({ hero, onClose, onSave }: { hero: Hero; onClose: () => void; onSave: (patch: Partial<Hero>) => void }) {
  const [draft, setDraft] = useState(hero); const set = (key: keyof Hero, value: string | number) => setDraft((item) => ({ ...item, [key]: value }));
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><header><div><p>CHARACTER BUILDER</p><h2 id="editor-title">Edit {hero.name}</h2></div><button onClick={onClose}>×</button></header><div className="editor-grid"><label><span>Character Name</span><input value={draft.name} onChange={(event) => set("name", event.target.value)}/></label><label><span>Class</span><input value={draft.className} onChange={(event) => set("className", event.target.value)}/></label><label><span>Subclass</span><input value={draft.subclass} onChange={(event) => set("subclass", event.target.value)}/></label><label><span>Level</span><input type="number" min="1" max="20" value={draft.level} onChange={(event) => set("level", Number(event.target.value))}/></label><label><span>Ancestry</span><input value={draft.ancestry} onChange={(event) => set("ancestry", event.target.value)}/></label><label><span>Background</span><input value={draft.background} onChange={(event) => set("background", event.target.value)}/></label><label><span>Maximum HP</span><input type="number" min="1" value={draft.maxHp} onChange={(event) => set("maxHp", Number(event.target.value))}/></label><label><span>Armor Class</span><input type="number" min="0" value={draft.ac} onChange={(event) => set("ac", Number(event.target.value))}/></label><label><span>Speed</span><input type="number" min="0" value={draft.speed} onChange={(event) => set("speed", Number(event.target.value))}/></label><label><span>Experience</span><input type="number" min="0" value={draft.xp} onChange={(event) => set("xp", Number(event.target.value))}/></label></div><div className="editor-abilities"><span>ABILITY SCORES</span><div>{abilities.map(({ key, label }) => <label key={key}><span>{label}</span><input type="number" min="1" max="30" value={draft.abilities[key]} onChange={(event) => setDraft((item) => ({ ...item, abilities: { ...item.abilities, [key]: Number(event.target.value) } }))}/></label>)}</div></div><footer><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={() => onSave(draft)}>Save Character</button></footer></section></div>;
}
