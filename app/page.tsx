"use client";

import {
  ChangeEvent,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  attacksPerAction,
  CLASS_RULES,
  ITEM_CATALOG,
  rollAbilitySet,
  STANDARD_ARRAY,
} from "../lib/rules2024";
import GuidedEditor from "./GuidedEditor";
import LevelUpWizard from "./LevelUpWizard";
import { cantripKnownLimit, featureDescription, preparedSpellLimit, spellInfo } from "../lib/rulesContent";
import { BACKGROUNDS, SPECIES } from "../lib/builder2024";
import {
  AdminHub,
  CampaignHub,
  CompendiumHub,
  HomebrewHub,
  type HomebrewEntry,
} from "./KingdomTools";
const ThreeDice = lazy(() => import("./ThreeDice"));

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
type Tab = "core" | "actions" | "spells" | "inventory" | "features" | "notes";
type RollMode = "normal" | "advantage" | "disadvantage";
type AppView = "characters" | "campaigns" | "compendium" | "homebrew" | "settings" | "admin";
type Roll = {
  id: number;
  label: string;
  formula: string;
  total: number;
  detail: string;
  critical?: boolean;
  fumble?: boolean;
};
type AnimatedRoll = { total: number; dice: { sides: number; value: number }[] };
export type Item = {
  id: number;
  name: string;
  quantity: number;
  weight: number;
  equipped: boolean;
  cost?: string;
  category?: "gear" | "weapon" | "armor";
  damage?: string;
  damageType?: string;
  elementDamage?: string;
  elementType?: string;
  armorBase?: number;
  armorType?: "light" | "medium" | "heavy" | "shield";
  dexCap?: number;
  acBonus?: number;
  rarity?: "Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary" | "Artifact";
};
type Account = {
  id: number;
  username: string;
  displayName: string;
  role: "admin" | "user";
};
export type Spell = {
  id: number;
  name: string;
  level: number;
  school: string;
  prepared: boolean;
  description: string;
};
export type Hero = {
  id: number;
  name: string;
  className: string;
  subclass: string;
  level: number;
  ancestry: string;
  background: string;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  xp: number;
  inspiration: boolean;
  abilities: Record<AbilityKey, number>;
  proficiency: AbilityKey[];
  skillProficiency: string[];
  initials: string;
  notes: string;
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
  hitDice: number;
  maxHitDice: number;
  deathSuccess: number;
  deathFail: number;
  spellSlots: Record<number, { used: number; max: number }>;
  inventory: Item[];
  spells: Spell[];
  usedFeatures: Record<string, boolean>;
  portrait?: string;
  baseAc?: number;
  advancementMethod?: "milestone" | "xp";
  levelHistory?: {
    level: number;
    date: string;
    method: "milestone" | "xp";
    hpGain: number;
    abilityChanges: string;
  }[];
  conditions?: string[];
  concentration?: boolean;
  exhaustion?: number;
  resources?: {
    id: number;
    name: string;
    current: number;
    max: number;
    resetsOn: "short" | "long";
  }[];
  feats?: { id: number; name: string; description: string }[];
  classes?: { name: string; level: number; subclass?: string }[];
  ruleset?: "SRD 5.1" | "2024 SRD" | "Wall Gloria" | "Homebrew";
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  shortRestsSinceLong?: number;
  size?: string;
  darkvision?: number;
  conditionAdvantages?: string[];
  carryingMultiplier?: number;
  longRestHours?: number;
  speciesChoices?: { size?: string; skill?: string; lineage?: string; originFeat?: string };
  speciesResistances?: string[];
  speciesGrantedSpells?: string[];
  speciesGrantedFeat?: string;
  classSkillProficiencies?: string[];
  backgroundGrantedSkills?: string[];
  backgroundGrantedFeat?: string;
  backgroundTool?: string;
  backgroundAbilityBonuses?: Partial<Record<AbilityKey, number>>;
};

type HeroSnapshot = { id: number; heroId: number; savedAt: string; hero: Hero };

const abilities: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];
const skills: { name: string; ability: AbilityKey }[] = [
  { name: "Acrobatics", ability: "dex" },
  { name: "Animal Handling", ability: "wis" },
  { name: "Arcana", ability: "int" },
  { name: "Athletics", ability: "str" },
  { name: "Deception", ability: "cha" },
  { name: "History", ability: "int" },
  { name: "Insight", ability: "wis" },
  { name: "Intimidation", ability: "cha" },
  { name: "Investigation", ability: "int" },
  { name: "Medicine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Performance", ability: "cha" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Sleight of Hand", ability: "dex" },
  { name: "Stealth", ability: "dex" },
  { name: "Survival", ability: "wis" },
];
const tabs: { key: Tab; label: string }[] = [
  { key: "core", label: "Core" },
  { key: "actions", label: "Actions" },
  { key: "spells", label: "Spells" },
  { key: "inventory", label: "Inventory" },
  { key: "features", label: "Features" },
  { key: "notes", label: "Notes" },
];

function makeHero(id = Date.now()): Hero {
  return {
    id,
    name: "New Adventurer",
    className: "Fighter",
    subclass: "",
    level: 1,
    ancestry: "Human",
    background: "Folk Hero",
    hp: 12,
    maxHp: 12,
    tempHp: 0,
    ac: 16,
    speed: 30,
    xp: 0,
    inspiration: false,
    abilities: { str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 11 },
    proficiency: ["str", "con"],
    skillProficiency: ["Athletics", "Perception"],
    initials: "NA",
    notes: "",
    personality: "",
    ideals: "",
    bonds: "",
    flaws: "",
    hitDice: 1,
    maxHitDice: 1,
    deathSuccess: 0,
    deathFail: 0,
    usedFeatures: {},
    conditions: [],
    concentration: false,
    exhaustion: 0,
    resources: [],
    feats: [],
    classes: [{ name: "Fighter", level: 1 }],
    ruleset: "2024 SRD",
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    shortRestsSinceLong: 0,
    size: "Medium",
    darkvision: 0,
    conditionAdvantages: [],
    carryingMultiplier: 1,
    longRestHours: 8,
    speciesChoices: { size: "Medium", skill: "Perception", originFeat: "Alert" },
    speciesResistances: [],
    speciesGrantedSpells: [],
    classSkillProficiencies: ["Athletics", "Perception"],
    backgroundGrantedSkills: [],
    backgroundAbilityBonuses: {},
    spellSlots: {
      1: { used: 0, max: 0 },
      2: { used: 0, max: 0 },
      3: { used: 0, max: 0 },
    },
    inventory: [
      { id: 1, name: "Longsword", quantity: 1, weight: 3, equipped: true },
      {
        id: 2,
        name: "Explorer's Pack",
        quantity: 1,
        weight: 10,
        equipped: false,
      },
    ],
    spells: [],
  };
}

const initialHeroes: Hero[] = [
  {
    ...makeHero(1),
    name: "Soren Vale",
    className: "Paladin",
    subclass: "Oath of Devotion",
    level: 7,
    ancestry: "Aasimar",
    background: "Soldier",
    hp: 61,
    maxHp: 68,
    ac: 19,
    xp: 23000,
    initials: "SV",
    abilities: { str: 16, dex: 12, con: 15, int: 10, wis: 13, cha: 18 },
    proficiency: ["wis", "cha"],
    skillProficiency: [
      "Athletics",
      "Insight",
      "Intimidation",
      "Persuasion",
      "Religion",
    ],
    hitDice: 5,
    maxHitDice: 7,
    spellSlots: {
      1: { used: 1, max: 4 },
      2: { used: 1, max: 3 },
      3: { used: 0, max: 0 },
    },
    spells: [
      {
        id: 1,
        name: "Bless",
        level: 1,
        school: "Enchantment",
        prepared: true,
        description: "Bolster up to three allies with divine favor.",
      },
      {
        id: 2,
        name: "Cure Wounds",
        level: 1,
        school: "Evocation",
        prepared: true,
        description: "Restore vitality to a creature you touch.",
      },
      {
        id: 3,
        name: "Lesser Restoration",
        level: 2,
        school: "Abjuration",
        prepared: true,
        description: "End one disease or debilitating condition.",
      },
      {
        id: 4,
        name: "Zone of Truth",
        level: 2,
        school: "Enchantment",
        prepared: false,
        description: "Create an area that guards against deliberate lies.",
      },
    ],
    personality: "Calm under pressure and fiercely protective.",
    ideals: "Power is meaningful only when used to protect others.",
    bonds: "I owe my life to the company that raised me.",
    flaws: "I carry every failure as if it were mine alone.",
    notes:
      "The silver sigil reacts to Zechon energy. Ask the archivist about the eastern ruins.",
  },
  {
    ...makeHero(2),
    name: "Arturo Reyes",
    className: "Monk",
    subclass: "Way of the Open Hand",
    level: 6,
    ancestry: "Human",
    hp: 48,
    maxHp: 48,
    ac: 17,
    initials: "AR",
    abilities: { str: 12, dex: 18, con: 14, int: 10, wis: 16, cha: 11 },
    proficiency: ["str", "dex"],
    hitDice: 6,
    maxHitDice: 6,
  },
  {
    ...makeHero(3),
    name: "Nyx Thorn",
    className: "Rogue",
    subclass: "Arcane Trickster",
    level: 5,
    ancestry: "Tiefling",
    hp: 35,
    maxHp: 42,
    ac: 16,
    initials: "NT",
    abilities: { str: 9, dex: 18, con: 13, int: 16, wis: 12, cha: 14 },
    proficiency: ["dex", "int"],
    hitDice: 3,
    maxHitDice: 5,
  },
];

function mod(score: number) {
  return Math.floor((score - 10) / 2);
}
function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
function calculatedAc(hero: Hero) {
  const dex = mod(hero.abilities.dex);
  const armor = hero.inventory.filter(
    (item) => item.equipped && item.category === "armor",
  );
  const body = armor
    .filter((item) => item.armorType !== "shield")
    .sort((a, b) => (b.armorBase ?? 0) - (a.armorBase ?? 0))[0];
  const shield = armor
    .filter((item) => item.armorType === "shield")
    .reduce((sum, item) => sum + (item.acBonus ?? 0), 0);
  const bodyAc = body
    ? (body.armorBase ?? 10) +
      (body.armorType === "heavy" ? 0 : Math.min(dex, body.dexCap ?? 99)) +
      (body.acBonus ?? 0)
    : (hero.baseAc ?? 10) + dex;
  return bodyAc + shield;
}
function castingAbility(hero: Hero): AbilityKey {
  const primary = CLASS_RULES[hero.className]?.primary ?? "Charisma";
  if (primary.includes("Intelligence")) return "int";
  if (primary.includes("Wisdom")) return "wis";
  return "cha";
}

export default function Home() {
  const [account, setAccount] = useState<Account | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [heroes, setHeroes] = useState<Hero[]>(initialHeroes);
  const [view, setView] = useState<AppView>("characters");
  const [homebrew, setHomebrew] = useState<HomebrewEntry[]>([]);
  const [selectedId, setSelectedId] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("core");
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [formula, setFormula] = useState("1d20+4");
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [diceAnimation, setDiceAnimation] = useState(true);
  const [diceSound, setDiceSound] = useState(true);
  const [animatedRoll, setAnimatedRoll] = useState<AnimatedRoll | null>(null);
  const [tableMode, setTableMode] = useState(false);
  const [snapshots, setSnapshots] = useState<HeroSnapshot[]>([]);
  const [accessibility, setAccessibility] = useState({ reducedMotion: false, highContrast: false, largeText: false });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [xpAward, setXpAward] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);
  const hero = useMemo(
    () => heroes.find((item) => item.id === selectedId) ?? heroes[0],
    [heroes, selectedId],
  );
  const proficiencyBonus = Math.ceil(hero.level / 4) + 1;

  useEffect(() => {
    (async () => {
      try {
        const session = await fetch("/api/session").then((response) =>
          response.json(),
        );
        setAccount(session.user);
        if (session.user) {
          const saved = await fetch("/api/vault").then((response) =>
            response.json(),
          );
          if (saved.heroes?.length) {
            setHeroes(
              saved.heroes.map((item: Hero) => ({
                ...makeHero(item.id),
                ...item,
                usedFeatures: item.usedFeatures ?? {},
              })),
            );
            setSelectedId(saved.selectedId ?? saved.heroes[0].id);
          } else setHeroes([makeHero(1)]);
          if (typeof saved.diceAnimation === "boolean")
            setDiceAnimation(saved.diceAnimation);
          if (typeof saved.diceSound === "boolean")
            setDiceSound(saved.diceSound);
          if (Array.isArray(saved.homebrew)) setHomebrew(saved.homebrew);
          if (Array.isArray(saved.snapshots)) setSnapshots(saved.snapshots);
          if (saved.accessibility) setAccessibility({ reducedMotion: false, highContrast: false, largeText: false, ...saved.accessibility });
        }
      } catch {
        setToast("Could not reach the account server");
      } finally {
        setSessionReady(true);
        setReady(true);
      }
    })();
  }, []);
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready || !account) return;
    const timer = window.setTimeout(() => {
      setSaveState("saving");
      fetch("/api/vault", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          heroes,
          selectedId,
          diceAnimation,
          diceSound,
          homebrew,
          snapshots,
          accessibility,
        }),
      }).then((response) => {
        if (!response.ok) throw new Error("save failed");
        setSaveState("saved");
      }).catch(() => { setSaveState("error"); setToast("Account save failed"); });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [heroes, selectedId, diceAnimation, diceSound, homebrew, snapshots, accessibility, ready, account]);
  useEffect(() => {
    if (ready)
      window.localStorage.setItem(
        "kingdom-forge-dice-animation",
        String(diceAnimation),
      );
  }, [diceAnimation, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((value) => !value); }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function updateHero(patch: Partial<Hero>) {
    setHeroes((items) =>
      items.map((item) => (item.id === hero.id ? { ...item, ...patch } : item)),
    );
  }
  function createHero() {
    const next = makeHero();
    setHeroes((items) => [...items, next]);
    setSelectedId(next.id);
    setActiveTab("core");
    setShowEditor(true);
  }
  function duplicateHero() {
    const copy = {
      ...hero,
      id: Date.now(),
      name: `${hero.name} Copy`,
      initials: initials(`${hero.name} Copy`),
      inventory: hero.inventory.map((item) => ({
        ...item,
        id: Date.now() + item.id,
      })),
      spells: hero.spells.map((spell) => ({
        ...spell,
        id: Date.now() + spell.id,
      })),
    };
    setHeroes((items) => [...items, copy]);
    setSelectedId(copy.id);
    setShowMenu(false);
    setToast("Character duplicated");
  }
  function deleteHero() {
    if (
      heroes.length === 1 ||
      !window.confirm(`Delete ${hero.name}? This cannot be undone.`)
    )
      return;
    const remaining = heroes.filter((item) => item.id !== hero.id);
    setHeroes(remaining);
    setSelectedId(remaining[0].id);
    setShowMenu(false);
    setToast("Character deleted");
  }
  function applyHp(amount: number) {
    const next = Math.max(0, Math.min(hero.maxHp, hero.hp + amount));
    updateHero({
      hp: next,
      deathSuccess: next > 0 ? 0 : hero.deathSuccess,
      deathFail: next > 0 ? 0 : hero.deathFail,
    });
  }
  function shortRest() {
    updateHero({
      hp: Math.min(
        hero.maxHp,
        hero.hp + Math.max(1, Math.floor(hero.maxHp / 4)),
      ),
      hitDice: Math.max(0, hero.hitDice - 1),
      resources: (hero.resources ?? []).map((resource) =>
        resource.resetsOn === "short"
          ? { ...resource, current: resource.max }
          : resource,
      ),
      shortRestsSinceLong: (hero.shortRestsSinceLong ?? 0) + 1,
    });
    setToast("Short rest complete");
  }
  function longRest() {
    updateHero({
      hp: hero.maxHp,
      tempHp: 0,
      hitDice: Math.min(
        hero.maxHitDice,
        hero.hitDice + Math.max(1, Math.floor(hero.maxHitDice / 2)),
      ),
      deathSuccess: 0,
      deathFail: 0,
      spellSlots: Object.fromEntries(
        Object.entries(hero.spellSlots).map(([level, slot]) => [
          level,
          { ...slot, used: 0 },
        ]),
      ),
      resources: (hero.resources ?? []).map((resource) => ({
        ...resource,
        current: resource.max,
      })),
      shortRestsSinceLong: 0,
      inspiration: hero.ancestry === "Human" ? true : hero.inspiration,
    });
    setToast("Long rest complete");
  }

  function saveRestorePoint() {
    setSnapshots((items) =>
      [
        { id: Date.now(), heroId: hero.id, savedAt: new Date().toISOString(), hero: structuredClone(hero) },
        ...items,
      ].slice(0, 30),
    );
    setShowMenu(false);
    setToast("Restore point saved");
  }

  function restoreLatest() {
    const snapshot = snapshots.find((item) => item.heroId === hero.id);
    if (!snapshot) return setToast("No restore point exists for this character");
    if (!window.confirm(`Restore ${hero.name} to ${new Date(snapshot.savedAt).toLocaleString()}?`)) return;
    updateHero({ ...structuredClone(snapshot.hero), id: hero.id });
    setShowMenu(false);
    setToast("Character restored");
  }

  function parseAndRoll(
    input: string,
    label = "Custom Roll",
    mode = rollMode,
    criticalDamage = false,
  ) {
    const clean = input.replace(/\s+/g, "").toLowerCase();
    const terms = clean.match(/[+-]?[^+-]+/g);
    if (!terms?.length) {
      setToast("Try a formula like 2d6+3");
      return;
    }
    let total = 0;
    const parts: string[] = [];
    const animatedDice: AnimatedRoll["dice"] = [];
    let firstD20: number | undefined;
    for (const raw of terms) {
      const sign = raw.startsWith("-") ? -1 : 1;
      const term = raw.replace(/^[+-]/, "");
      const die = term.match(/^(\d*)d(\d+)$/);
      if (die) {
        const baseCount = Number(die[1] || 1);
        const count = Math.min(criticalDamage ? baseCount * 2 : baseCount, 50);
        const sides = Math.min(Number(die[2]), 1000);
        if (!sides) {
          setToast("That dice formula is not valid");
          return;
        }
        let values = Array.from(
          { length: count },
          () => Math.floor(Math.random() * sides) + 1,
        );
        animatedDice.push(...values.map((value) => ({ sides, value })));
        if (sides === 20 && count === 1 && mode !== "normal") {
          const extra = Math.floor(Math.random() * 20) + 1;
          values = [values[0], extra];
          const kept =
            mode === "advantage" ? Math.max(...values) : Math.min(...values);
          firstD20 = kept;
          total += sign * kept;
          parts.push(
            `${mode === "advantage" ? "max" : "min"}(${values.join(", ")})`,
          );
        } else {
          if (sides === 20 && count === 1) firstD20 = values[0];
          total += sign * values.reduce((sum, value) => sum + value, 0);
          parts.push(`${sign < 0 ? "− " : ""}${values.join(" + ")}`);
        }
      } else if (/^\d+$/.test(term)) {
        total += sign * Number(term);
        parts.push(`${sign > 0 ? "+" : "−"} ${term}`);
      } else {
        setToast("Try a formula like 2d6+3");
        return;
      }
    }
    setRolls((items) =>
      [
        {
          id: Date.now(),
          label: criticalDamage ? `${label} · CRITICAL` : label,
          formula: criticalDamage ? `${input} (damage dice ×2)` : input,
          total,
          detail: parts.join(" "),
          critical: criticalDamage || firstD20 === 20,
          fumble: firstD20 === 1,
        },
        ...items,
      ].slice(0, 12),
    );
    if (diceSound) playDiceSound();
    if (diceAnimation) {
      setAnimatedRoll({ total, dice: animatedDice.slice(0, 24) });
      window.setTimeout(() => setAnimatedRoll(null), 2450);
    }
  }

  function exportHero() {
    const blob = new Blob([JSON.stringify(hero, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${hero.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
    setToast("Character exported");
  }
  function exportVault() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            heroes,
            selectedId,
            homebrew,
            diceAnimation,
            diceSound,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kingdom-forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Account backup exported");
  }
  function importHero(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const value = JSON.parse(String(reader.result)) as Hero;
        const imported = {
          ...makeHero(),
          ...value,
          id: Date.now(),
          name: value.name ? `${value.name} (Imported)` : "Imported Adventurer",
        };
        setHeroes((items) => [...items, imported]);
        setSelectedId(imported.id);
        setToast("Character imported");
      } catch {
        setToast("That file is not a valid Kingdom Forge character");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function skillBonus(skill: { name: string; ability: AbilityKey }) {
    return (
      mod(hero.abilities[skill.ability]) +
      (hero.skillProficiency.includes(skill.name) ? proficiencyBonus : 0)
    );
  }

  function playDiceSound() {
    try {
      const AudioContextType =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const context = new AudioContextType();
      [0, 0.055, 0.11, 0.18].forEach((delay, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = 150 + index * 75;
        gain.gain.setValueAtTime(0.08, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + delay + 0.055,
        );
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.06);
      });
      window.setTimeout(() => context.close(), 450);
    } catch {
      /* sound is optional */
    }
  }

  if (!sessionReady)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="brand-mark">K</div>
          <h1>Opening the vault…</h1>
        </div>
      </main>
    );
  if (!account) return <AuthGate onAuthenticated={setAccount} />;

  return (
    <main className={`app-shell ${tableMode ? "table-mode" : ""} ${accessibility.reducedMotion ? "reduced-motion" : ""} ${accessibility.highContrast ? "high-contrast" : ""} ${accessibility.largeText ? "large-text" : ""}`}>
      {toast && (
        <div className="toast" role="status">
          ✦ {toast}
        </div>
      )}
      {animatedRoll !== null && (
        <Suspense fallback={<div className="dice-animation-stage" />}>
          <ThreeDice total={animatedRoll.total} dice={animatedRoll.dice} />
        </Suspense>
      )}
      {tableMode && <button className="exit-table-mode" onClick={() => setTableMode(false)}>× Exit Table Mode</button>}
      {commandOpen && <div className="command-backdrop" onClick={() => setCommandOpen(false)}><section className="command-palette" onClick={(event) => event.stopPropagation()}><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder="Search characters and tools…" />{[
        ...(["characters", "campaigns", "compendium", "homebrew", "settings"] as AppView[]).map((target) => ({ label: `Open ${target}`, run: () => setView(target) })),
        ...heroes.map((item) => ({ label: `Character · ${item.name}`, run: () => { setView("characters"); setSelectedId(item.id); } })),
      ].filter((item) => item.label.toLowerCase().includes(commandQuery.toLowerCase())).map((item) => <button key={item.label} onClick={() => { item.run(); setCommandOpen(false); setCommandQuery(""); }}>{item.label}<span>↵</span></button>)}</section></div>}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">K</div>
          <div>
            <strong>KINGDOM</strong>
            <span>FORGE</span>
          </div>
        </div>
        <nav aria-label="Main navigation">
          <button className="nav-item" onClick={() => setCommandOpen(true)}><span>⌕</span> Quick Find <small>⌘K</small></button>
          <button
            className={`nav-item ${view === "characters" ? "active" : ""}`}
            onClick={() => setView("characters")}
          >
            <span>◆</span> Characters
          </button>
          <button
            className={`nav-item ${view === "campaigns" ? "active" : ""}`}
            onClick={() => setView("campaigns")}
          >
            <span>⚔</span> Campaigns
          </button>
          <button
            className={`nav-item ${view === "compendium" ? "active" : ""}`}
            onClick={() => setView("compendium")}
          >
            <span>✦</span> Compendium
          </button>
          <button
            className={`nav-item ${view === "homebrew" ? "active" : ""}`}
            onClick={() => setView("homebrew")}
          >
            <span>◈</span> Homebrew
          </button>
          <button className={`nav-item ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}><span>⚙</span> Settings</button>
          {account.role === "admin" && (
            <button
              className={`nav-item ${view === "admin" ? "active" : ""}`}
              onClick={() => setView("admin")}
            >
              <span>♛</span> Admin
            </button>
          )}
        </nav>
        <div className="sidebar-callout">
          <span>✦</span>
          <strong>Local Vault</strong>
          <p>{saveState === "saving" ? "Saving changes…" : saveState === "error" ? "Save failed — check connection" : "All changes saved"}</p>
        </div>
        <div className="sidebar-footer">
          <div className="avatar small">{initials(account.displayName)}</div>
          <div>
            <strong>{account.displayName}</strong>
            <span>{account.role === "admin" ? "Administrator" : "Player"}</span>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              setAccount(null);
            }}
          >
            ↪
          </button>
        </div>
      </aside>

      <section className="workspace">
        {view === "characters" ? (
          <>
            <header className="topbar">
              <div>
                <p>THE GREAT HALL</p>
                <h1>Your Characters</h1>
              </div>
              <div className="top-actions">
                <button
                  className="secondary"
                  onClick={() => importRef.current?.click()}
                >
                  Import
                </button>
                <button className="secondary" onClick={exportVault}>
                  Backup All
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={importHero}
                />
                <button className="primary" onClick={createHero}>
                  ＋ Create Character
                </button>
              </div>
            </header>
            <div className="character-strip" aria-label="Character list">
              {heroes.map((item) => (
                <button
                  key={item.id}
                  className={`hero-chip ${hero.id === item.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedId(item.id);
                    setActiveTab("core");
                  }}
                >
                  <div className="avatar">{item.initials}</div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      Level {item.level} {item.className}
                    </span>
                  </div>
                  <i
                    style={{
                      width: `${Math.max(0, (item.hp / item.maxHp) * 100)}%`,
                    }}
                  />
                </button>
              ))}
              <button className="new-chip" onClick={createHero}>
                ＋<span>New hero</span>
              </button>
            </div>

            <div className="content-grid">
              <section className="sheet-card">
                <div className="sheet-hero">
                  <button
                    className={`inspiration ${hero.inspiration ? "lit" : ""}`}
                    onClick={() =>
                      updateHero({ inspiration: !hero.inspiration })
                    }
                    title="Toggle inspiration"
                  >
                    ✦
                  </button>
                  <div
                    className={`portrait ${hero.portrait ? "has-image" : ""}`}
                  >
                    {hero.portrait ? (
                      <img src={hero.portrait} alt={`${hero.name} portrait`} />
                    ) : (
                      hero.initials
                    )}
                  </div>
                  <div className="identity">
                    <p>
                      LEVEL {hero.level} · {hero.ancestry} · {hero.background}
                    </p>
                    <h2>{hero.name}</h2>
                    <span>
                      {hero.classes && hero.classes.length > 1
                        ? hero.classes.map((entry) => `${entry.name} ${entry.level}`).join(" · ")
                        : <>{hero.subclass || hero.className}{" "}{hero.subclass && `· ${hero.className}`}</>}
                    </span>
                  </div>
                  <div className="sheet-tools">
                    <button
                      className="ghost"
                      onClick={() => setShowLevelUp(true)}
                    >
                      Level Up
                    </button>
                    <button
                      className="ghost"
                      onClick={() => setShowEditor(true)}
                    >
                      Edit Sheet
                    </button>
                    <button className="ghost table-toggle" onClick={() => { const next = !tableMode; setTableMode(next); if (next) setActiveTab("actions"); }}>
                      {tableMode ? "Full Sheet" : "Table Mode"}
                    </button>
                    <div className="more-wrap">
                      <button
                        className="more"
                        onClick={() => setShowMenu(!showMenu)}
                        aria-label="Character options"
                      >
                        •••
                      </button>
                      {showMenu && (
                        <div className="dropdown">
                          <button onClick={duplicateHero}>Duplicate</button>
                          <button onClick={exportHero}>Export JSON</button>
                          <button onClick={() => { setShowMenu(false); window.print(); }}>Print / Save PDF</button>
                          <button onClick={saveRestorePoint}>Save Restore Point</button>
                          <button onClick={restoreLatest}>Restore Previous</button>
                          <button className="danger" onClick={deleteHero}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="xp-bar">
                  <span>XP {hero.xp.toLocaleString()}</span>
                  <i>
                    <b
                      style={{
                        width: `${Math.min(100, (hero.xp / Math.max(300, hero.level * hero.level * 1000)) * 100)}%`,
                      }}
                    />
                  </i>
                  <span>LEVEL {hero.level + 1}</span>
                  <label className="xp-award"><input type="number" min="0" value={xpAward} onChange={(event) => setXpAward(Math.max(0, Number(event.target.value)))} placeholder="XP earned" /><button onClick={() => { updateHero({ xp: hero.xp + xpAward }); setXpAward(0); setToast(`Added ${xpAward.toLocaleString()} XP`); }}>Add XP</button></label>
                </div>
                <div className="combat-row">
                  <div>
                    <span>ARMOR CLASS</span>
                    <strong>{calculatedAc(hero)}</strong>
                    <small>equipped gear</small>
                  </div>
                  <div>
                    <span>INITIATIVE</span>
                    <button
                      onClick={() =>
                        parseAndRoll(
                          `1d20${signed(mod(hero.abilities.dex))}`,
                          "Initiative",
                        )
                      }
                    >
                      {signed(mod(hero.abilities.dex))}
                    </button>
                  </div>
                  <div>
                    <span>SPEED</span>
                    <strong>
                      {hero.speed}
                      <small> ft</small>
                    </strong>
                  </div>
                  <div className="hp">
                    <span>HIT POINTS</span>
                    <div className="hp-number">
                      <button onClick={() => applyHp(-1)}>−</button>
                      <strong>
                        {hero.hp} <small>/ {hero.maxHp}</small>
                      </strong>
                      <button onClick={() => applyHp(1)}>＋</button>
                    </div>
                    <div className="hp-track">
                      <i
                        style={{
                          width: `${Math.max(0, (hero.hp / hero.maxHp) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <details className="rules-inspector">
                  <summary>Rules Inspector · explain my numbers</summary>
                  <div>
                    <article><b>Armor Class {calculatedAc(hero)}</b><span>Base/armor + Dexterity allowance + shield and equipment bonuses</span></article>
                    <article><b>Initiative {signed(mod(hero.abilities.dex))}</b><span>Dexterity modifier from score {hero.abilities.dex}</span></article>
                    <article><b>Proficiency +{proficiencyBonus}</b><span>Calculated from total character level {hero.level}</span></article>
                    <article><b>Spell save DC {8 + proficiencyBonus + mod(hero.abilities[castingAbility(hero)])}</b><span>8 + proficiency + {castingAbility(hero).toUpperCase()} modifier</span></article>
                    <article><b>{hero.size ?? "Medium"} · {hero.speed} ft</b><span>{hero.darkvision ? `Darkvision ${hero.darkvision} ft` : "No species darkvision"}{(hero.carryingMultiplier ?? 1) > 1 ? ` · Carrying ×${hero.carryingMultiplier}` : ""}</span></article>
                  </div>
                </details>
                <div className="resource-row">
                  <button
                    onClick={() =>
                      updateHero({ tempHp: Math.max(0, hero.tempHp - 1) })
                    }
                  >
                    <span>TEMP HP</span>
                    <strong>{hero.tempHp}</strong>
                  </button>
                  <button onClick={shortRest}>
                    <span>HIT DICE</span>
                    <strong>
                      {hero.hitDice}/{hero.maxHitDice}
                    </strong>
                    <small>Short Rest</small>
                  </button>
                  <button onClick={longRest}>
                    <span>REST</span>
                    <strong>☾</strong>
                    <small>Long Rest</small>
                  </button>
                  <div className="rest-count"><span>SHORT RESTS</span><strong>{hero.shortRestsSinceLong ?? 0}</strong><small>since last long rest</small></div>
                  <div className="death-saves">
                    <span>DEATH SAVES</span>
                    <label>
                      Success{" "}
                      {[0, 1, 2].map((index) => (
                        <button
                          key={index}
                          className={hero.deathSuccess > index ? "success" : ""}
                          onClick={() =>
                            updateHero({
                              deathSuccess:
                                hero.deathSuccess === index + 1
                                  ? index
                                  : index + 1,
                            })
                          }
                        />
                      ))}
                    </label>
                    <label>
                      Failure{" "}
                      {[0, 1, 2].map((index) => (
                        <button
                          key={index}
                          className={hero.deathFail > index ? "failure" : ""}
                          onClick={() =>
                            updateHero({
                              deathFail:
                                hero.deathFail === index + 1
                                  ? index
                                  : index + 1,
                            })
                          }
                        />
                      ))}
                    </label>
                  </div>
                  {(hero.resources ?? []).map((resource) => (
                    <div className="tracked-resource" key={resource.id}>
                      <span>{resource.name.toUpperCase()}</span>
                      <div>
                        <button onClick={() => updateHero({ resources: hero.resources?.map((item) => item.id === resource.id ? { ...item, current: Math.max(0, item.current - 1) } : item) })}>−</button>
                        <strong>{resource.current}/{resource.max}</strong>
                        <button onClick={() => updateHero({ resources: hero.resources?.map((item) => item.id === resource.id ? { ...item, current: Math.min(item.max, item.current + 1) } : item) })}>＋</button>
                      </div>
                      <small>{resource.resetsOn} rest</small>
                    </div>
                  ))}
                </div>
                <div className="tabs" role="tablist">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      className={activeTab === tab.key ? "active" : ""}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="tab-content">
                  {activeTab === "core" && (
                    <CoreTab
                      hero={hero}
                      proficiencyBonus={proficiencyBonus}
                      skillBonus={skillBonus}
                      onRoll={parseAndRoll}
                    />
                  )}
                  {activeTab === "actions" && (
                    <><ActionsTab hero={hero} proficiencyBonus={proficiencyBonus} updateHero={updateHero} onRoll={parseAndRoll} /><ResourceManager hero={hero} updateHero={updateHero} /></>
                  )}
                  {activeTab === "spells" && (
                    <SpellsTab
                      hero={hero}
                      updateHero={updateHero}
                      onRoll={parseAndRoll}
                    />
                  )}
                  {activeTab === "inventory" && (
                    <InventoryTab hero={hero} updateHero={updateHero} />
                  )}
                  {activeTab === "features" && (
                    <FeaturesTab hero={hero} updateHero={updateHero} />
                  )}
                  {activeTab === "notes" && (
                    <NotesTab hero={hero} updateHero={updateHero} />
                  )}
                </div>
              </section>

              <DicePanel
                formula={formula}
                setFormula={setFormula}
                mode={rollMode}
                setMode={setRollMode}
                rolls={rolls}
                setRolls={setRolls}
                onRoll={parseAndRoll}
                animation={diceAnimation}
                setAnimation={setDiceAnimation}
                sound={diceSound}
                setSound={setDiceSound}
              />
            </div>
            <ConditionTracker hero={hero} updateHero={updateHero} />
          </>
        ) : view === "campaigns" ? (
          <CampaignHub hero={hero} toast={setToast} />
        ) : view === "compendium" ? (
          <CompendiumHub />
        ) : view === "homebrew" ? (
          <HomebrewHub entries={homebrew} setEntries={setHomebrew} />
        ) : view === "settings" ? (
          <AccountSettings accessibility={accessibility} setAccessibility={setAccessibility} toast={setToast} />
        ) : (
          <AdminHub />
        )}
      </section>
      {showEditor && (
        <GuidedEditor
          hero={hero}
          onClose={() => setShowEditor(false)}
          onSave={(patch) => {
            updateHero({
              ...patch,
              initials: initials(patch.name ?? hero.name),
              maxHitDice: patch.level ?? hero.level,
              hitDice: Math.min(hero.hitDice, patch.level ?? hero.level),
            });
            setShowEditor(false);
            setToast("Character saved");
          }}
        />
      )}
      {showLevelUp && (
        <LevelUpWizard
          hero={hero}
          onClose={() => setShowLevelUp(false)}
          onApply={(patch) => {
            updateHero(patch);
            setShowLevelUp(false);
            setToast(`Advanced to level ${patch.level}`);
          }}
        />
      )}
    </main>
  );
}

function ResourceManager({
  hero,
  updateHero,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
}) {
  const [name, setName] = useState("");
  const [max, setMax] = useState(1);
  const [resetsOn, setResetsOn] = useState<"short" | "long">("long");
  function add() {
    if (!name.trim()) return;
    updateHero({
      resources: [
        ...(hero.resources ?? []),
        { id: Date.now(), name: name.trim(), current: max, max, resetsOn },
      ],
    });
    setName("");
    setMax(1);
  }
  return (
    <section className="resource-manager">
      <div>
        <p>CLASS & HOMEBREW RESOURCES</p>
        <h3>Resource Counters</h3>
        <span>These counters appear directly above in the combat resource row. Press − when you spend a use and + to restore one. A Short or Long Rest automatically refills counters matching that reset type. Class features acquired during level-up create counters here when they have limited uses.</span>
      </div>
      <input value={name} placeholder="Resource name" onChange={(event) => setName(event.target.value)} />
      <input type="number" min={1} max={99} value={max} onChange={(event) => setMax(Math.max(1, Number(event.target.value)))} />
      <select value={resetsOn} onChange={(event) => setResetsOn(event.target.value as "short" | "long")}>
        <option value="short">Short rest</option>
        <option value="long">Long rest</option>
      </select>
      <button className="primary" onClick={add}>Create Counter</button>
      {!!hero.resources?.length && (
        <div className="resource-list">
          {hero.resources.map((resource) => (
            <button key={resource.id} onClick={() => updateHero({ resources: hero.resources?.filter((item) => item.id !== resource.id) })}>
              {resource.name} · {resource.max} uses · {resource.resetsOn} rest <b>×</b>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AccountSettings({ accessibility, setAccessibility, toast }: {
  accessibility: { reducedMotion: boolean; highContrast: boolean; largeText: boolean };
  setAccessibility: (value: { reducedMotion: boolean; highContrast: boolean; largeText: boolean }) => void;
  toast: (message: string) => void;
}) {
  const [sessions, setSessions] = useState<{ id: string; expiresAt: number; current: boolean }[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  useEffect(() => { fetch("/api/account/sessions").then((r) => r.json()).then((data) => setSessions(data.sessions ?? [])); }, []);
  return <section className="tool-page settings-page">
    <div className="tool-title"><div><p>YOUR EXPERIENCE</p><h1>Settings & Accessibility</h1><span>Personal preferences are stored with your account.</span></div></div>
    <div className="settings-grid">
      <section><h2>Accessibility</h2>{([
        ["reducedMotion", "Reduced motion", "Disable decorative movement and dice-stage transitions."],
        ["highContrast", "High contrast", "Increase text and border contrast."],
        ["largeText", "Larger text", "Increase the interface scale for easier reading."],
      ] as const).map(([key, label, description]) => <label className="setting-row" key={key}><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={accessibility[key]} onChange={(event) => setAccessibility({ ...accessibility, [key]: event.target.checked })} /></label>)}</section>
      <section><h2>Security</h2><label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input type="password" minLength={10} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><button className="primary" onClick={async () => { const response = await fetch("/api/account/password", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await response.json(); toast(response.ok ? "Password updated" : data.error); if (response.ok) { setCurrentPassword(""); setNewPassword(""); } }}>Change Password</button><button onClick={async () => { await fetch("/api/account/sessions", { method: "DELETE" }); toast("Other sessions signed out"); }}>Sign Out Other Devices</button></section>
    </div>
    <section className="session-panel"><h2>Account sessions</h2>{sessions.map((session) => <article key={session.id}><b>{session.current ? "Current session" : "Signed-in session"}</b><span>Expires {new Date(session.expiresAt).toLocaleString()}</span><code>{session.id}</code></article>)}</section>
  </section>;
}

function AuthGate({
  onAuthenticated,
}: {
  onAuthenticated: (account: Account) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Account request failed");
      onAuthenticated(data.user);
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Account request failed",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">K</div>
          <div>
            <strong>KINGDOM</strong>
            <span>FORGE</span>
          </div>
        </div>
        <p>THE PRIVATE VAULT</p>
        <h1>
          {mode === "login"
            ? "Welcome back, adventurer"
            : "Create your account"}
        </h1>
        <small>
          The first account created becomes the administrator. Every later
          account is a private player vault.
        </small>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              <span>Display name</span>
              <input
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          <label>
            <span>Username</span>
            <input
              required
              minLength={3}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary" disabled={busy}>
            {busy
              ? "Opening vault…"
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}

function ConditionTracker({
  hero,
  updateHero,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
}) {
  const [condition, setCondition] = useState("");
  const common = [
    "Blinded",
    "Charmed",
    "Deafened",
    "Frightened",
    "Grappled",
    "Incapacitated",
    "Invisible",
    "Paralyzed",
    "Poisoned",
    "Prone",
    "Restrained",
    "Stunned",
    "Unconscious",
  ];
  function add(value: string) {
    if (value && !hero.conditions?.includes(value))
      updateHero({ conditions: [...(hero.conditions ?? []), value] });
    setCondition("");
  }
  return (
    <div className="condition-tracker">
      <div>
        <span>ACTIVE EFFECTS</span>
        {(hero.conditions ?? []).map((value) => (
          <button
            key={value}
            onClick={() =>
              updateHero({
                conditions: hero.conditions?.filter((item) => item !== value),
              })
            }
          >
            {value} ×
          </button>
        ))}
        {!(hero.conditions ?? []).length && <small>No conditions</small>}
      </div>
      <label>
        <select
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value);
            add(e.target.value);
          }}
        >
          <option value="">Add condition…</option>
          {common.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <button
        className={hero.concentration ? "active" : ""}
        onClick={() => updateHero({ concentration: !hero.concentration })}
      >
        ◉ Concentration
      </button>
      <label className="exhaustion-control">
        Exhaustion{" "}
        <button
          onClick={() =>
            updateHero({ exhaustion: Math.max(0, (hero.exhaustion ?? 0) - 1) })
          }
        >
          −
        </button>
        <b>{hero.exhaustion ?? 0}</b>
        <button
          onClick={() =>
            updateHero({ exhaustion: Math.min(6, (hero.exhaustion ?? 0) + 1) })
          }
        >
          ＋
        </button>
      </label>
    </div>
  );
}

function CoreTab({
  hero,
  proficiencyBonus,
  skillBonus,
  onRoll,
}: {
  hero: Hero;
  proficiencyBonus: number;
  skillBonus: (skill: { name: string; ability: AbilityKey }) => number;
  onRoll: (formula: string, label?: string) => void;
}) {
  return (
    <>
      <div className="abilities">
        {abilities.map(({ key, label }) => (
          <button
            key={key}
            onClick={() =>
              onRoll(
                `1d20${signed(mod(hero.abilities[key]))}`,
                `${label} Check`,
              )
            }
          >
            <span>{label}</span>
            <strong>{signed(mod(hero.abilities[key]))}</strong>
            <small>{hero.abilities[key]}</small>
          </button>
        ))}
      </div>
      <div className="core-columns">
        <section>
          <div className="section-title">
            <h3>Saving Throws</h3>
            <span>PROF {signed(proficiencyBonus)}</span>
          </div>
          {abilities.map(({ key, label }) => {
            const value =
              mod(hero.abilities[key]) +
              (hero.proficiency.includes(key) ? proficiencyBonus : 0);
            return (
              <button
                className="stat-line"
                key={key}
                onClick={() => onRoll(`1d20${signed(value)}`, `${label} Save`)}
              >
                <i
                  className={hero.proficiency.includes(key) ? "trained" : ""}
                />
                <span>{label}</span>
                <strong>{signed(value)}</strong>
              </button>
            );
          })}
        </section>
        <section className="skills">
          <div className="section-title">
            <h3>Skills</h3>
            <span>
              PASSIVE {10 + skillBonus({ name: "Perception", ability: "wis" })}
            </span>
          </div>
          {skills.map((skill) => {
            const value = skillBonus(skill);
            return (
              <button
                className="stat-line"
                key={skill.name}
                onClick={() => onRoll(`1d20${signed(value)}`, skill.name)}
              >
                <i
                  className={
                    hero.skillProficiency.includes(skill.name) ? "trained" : ""
                  }
                />
                <span>
                  {skill.name}
                  <small>{skill.ability.toUpperCase()}</small>
                </span>
                <strong>{signed(value)}</strong>
              </button>
            );
          })}
        </section>
      </div>
    </>
  );
}

function ActionsTab({
  hero,
  proficiencyBonus,
  updateHero,
  onRoll,
}: {
  hero: Hero;
  proficiencyBonus: number;
  updateHero: (patch: Partial<Hero>) => void;
  onRoll: (
    formula: string,
    label?: string,
    mode?: RollMode,
    criticalDamage?: boolean,
  ) => void;
}) {
  const attack = mod(hero.abilities.str) + proficiencyBonus;
  const learned = (CLASS_RULES[hero.className]?.features ?? [])
    .filter((feature) => feature.level <= hero.level)
    .sort((a, b) => a.level - b.level);
  const attacks = attacksPerAction(hero.className, hero.level);
  const equippedWeapons = hero.inventory.filter(
    (item) => item.equipped && item.category === "weapon",
  );
  function toggleFeature(name: string) {
    updateHero({
      usedFeatures: { ...hero.usedFeatures, [name]: !hero.usedFeatures[name] },
    });
  }
  return (
    <div className="actions-layout">
      <section>
        <div className="section-title">
          <h3>Attacks & Actions</h3>
          <span>
            {attacks} ATTACK{attacks === 1 ? "" : "S"} / ACTION
          </span>
        </div>
        <button
          className="big-action"
          onClick={() => onRoll(`1d20${signed(attack)}`, "Longsword Attack")}
        >
          <span className="action-icon">⚔</span>
          <span>
            <b>Longsword</b>
            <small>Melee weapon · 5 ft</small>
          </span>
          <strong>{signed(attack)}</strong>
          <em
            onClick={(event) => {
              event.stopPropagation();
              onRoll(
                `1d8${signed(mod(hero.abilities.str))}`,
                "Longsword Damage",
              );
            }}
          >
            1d8{signed(mod(hero.abilities.str))}
          </em>
        </button>
        <div className="critical-row">
          <span>Critical hit?</span>
          <button
            onClick={() =>
              onRoll(
                `1d8${signed(mod(hero.abilities.str))}`,
                "Longsword Damage",
                "normal",
                true,
              )
            }
          >
            Roll 2d8 {signed(mod(hero.abilities.str))}
          </button>
          <small>All damage dice are doubled; modifiers are added once.</small>
        </div>
        {equippedWeapons.map((weapon) => {
          const damage = `${weapon.damage || "1d4"}${signed(mod(hero.abilities.str))}${weapon.elementDamage ? `+${weapon.elementDamage}` : ""}`;
          return (
            <div className="custom-weapon-action" key={weapon.id}>
              <button
                className="big-action"
                onClick={() =>
                  onRoll(`1d20${signed(attack)}`, `${weapon.name} Attack`)
                }
              >
                <span className="action-icon">⚔</span>
                <span>
                  <b>{weapon.name}</b>
                  <small>
                    {weapon.damageType || "weapon"}
                    {weapon.elementDamage
                      ? ` · ${weapon.elementDamage} ${weapon.elementType}`
                      : ""}
                  </small>
                </span>
                <strong>{signed(attack)}</strong>
                <em
                  onClick={(event) => {
                    event.stopPropagation();
                    onRoll(damage, `${weapon.name} Damage`);
                  }}
                >
                  {damage}
                </em>
              </button>
              <button
                className="crit-mini"
                onClick={() =>
                  onRoll(damage, `${weapon.name} Damage`, "normal", true)
                }
              >
                Critical damage
              </button>
            </div>
          );
        })}
        {hero.className === "Paladin" && (
          <>
            <button
              className="big-action"
              onClick={() =>
                onRoll(
                  `1d20${signed(proficiencyBonus + mod(hero.abilities.cha))}`,
                  "Spell Attack",
                )
              }
            >
              <span className="action-icon gold">✦</span>
              <span>
                <b>Divine Smite</b>
                <small>Radiant · expend spell slot</small>
              </span>
              <strong>
                {signed(proficiencyBonus + mod(hero.abilities.cha))}
              </strong>
              <em
                onClick={(event) => {
                  event.stopPropagation();
                  onRoll("2d8", "Divine Smite Damage");
                }}
              >
                2d8
              </em>
            </button>
            <button
              className="crit-mini"
              onClick={() =>
                onRoll("2d8", "Divine Smite Damage", "normal", true)
              }
            >
              Critical Smite · 4d8
            </button>
          </>
        )}
      </section>
      <section>
        <div className="section-title">
          <h3>Acquired Class Features</h3>
          <span>LEVEL {hero.level}</span>
        </div>
        <div className="feature-checklist">
          {learned.map((feature) => (
            <article
              key={`${feature.level}-${feature.name}`}
              className={hero.usedFeatures[feature.name] ? "used" : ""}
            >
              <span>
                <small>LEVEL {feature.level}</small>
                <b>{feature.name}</b>
                <p>{featureDescription(feature.name, Boolean(feature.track))}</p>
              </span>
              {feature.track ? (
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(hero.usedFeatures[feature.name])}
                    onChange={() => toggleFeature(feature.name)}
                  />
                  <i />
                  {hero.usedFeatures[feature.name] ? "Used" : "Ready"}
                </label>
              ) : (
                <em>Passive</em>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SpellsTab({
  hero,
  updateHero,
  onRoll,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
  onRoll: (formula: string, label?: string) => void;
}) {
  const castingKey = castingAbility(hero);
  const casting = mod(hero.abilities[castingKey]);
  const prof = Math.ceil(hero.level / 4) + 1;
  const preparationLimit = preparedSpellLimit(hero.className, hero.level, casting);
  const speciesSpells = new Set(hero.speciesGrantedSpells ?? []);
  const preparedLeveled = hero.spells.filter((spell) => spell.prepared && spell.level > 0 && !speciesSpells.has(spell.name)).length;
  const cantripLimit = cantripKnownLimit(hero.className, hero.level);
  const knownCantrips = hero.spells.filter((spell) => spell.level === 0 && !speciesSpells.has(spell.name)).length;
  function useSlot(level: number) {
    const slot = hero.spellSlots[level];
    if (!slot?.max) return;
    updateHero({
      spellSlots: {
        ...hero.spellSlots,
        [level]: { ...slot, used: slot.used >= slot.max ? 0 : slot.used + 1 },
      },
    });
  }
  return (
    <div>
      <div className="spell-summary">
        <article>
          <span>SPELLCASTING</span>
          <strong>{castingKey.toUpperCase()}</strong>
        </article>
        <article>
          <span>SAVE DC</span>
          <strong>{8 + prof + casting}</strong>
        </article>
        <article>
          <span>ATTACK</span>
          <button
            onClick={() =>
              onRoll(`1d20${signed(prof + casting)}`, "Spell Attack")
            }
          >
            {signed(prof + casting)}
          </button>
        </article>
        <article>
          <span>LEVELED PREPARED</span>
          <strong>
            {preparedLeveled} / {preparationLimit}
          </strong>
        </article>
        <article><span>CANTRIPS KNOWN</span><strong>{knownCantrips} / {cantripLimit}</strong></article>
      </div>
      <div className="slot-row">
        {Object.entries(hero.spellSlots).map(([level, slot]) => (
          <button key={level} onClick={() => useSlot(Number(level))}>
            <span>LEVEL {level}</span>
            <div>
              {Array.from({ length: slot.max || 1 }, (_, index) => (
                <i
                  key={index}
                  className={
                    slot.used > index ? "used" : slot.max ? "" : "locked"
                  }
                />
              ))}
            </div>
          </button>
        ))}
      </div>
      <div className="section-title">
        <h3>Spellbook</h3>
        <span>{hero.spells.length} SPELLS</span>
      </div>
      <div className="spell-list">
        {hero.spells.length ? (
          hero.spells.map((spell) => (
            <article key={spell.id}>
              <button
                className={`prepare ${spell.prepared ? "active" : ""}`}
                onClick={() => {
                  if (!spell.prepared && spell.level > 0 && preparedLeveled >= preparationLimit) return window.alert(`You can prepare ${preparationLimit} leveled spells. Unprepare one first.`);
                  updateHero({
                    spells: hero.spells.map((item) =>
                      item.id === spell.id
                        ? { ...item, prepared: !item.prepared }
                        : item,
                    ),
                  });
                }}
              >
                ✦
              </button>
              <span>
                <b>{spell.name}</b>
                <small>
                  Level {spell.level} · {spell.school}
                </small>
                <small>{spellInfo(spell.name).castingTime} · {spellInfo(spell.name).range} · {spellInfo(spell.name).duration}{spellInfo(spell.name).concentration ? " · Concentration" : ""}</small>
                <p>{spell.description}</p>
              </span>
              <button
                onClick={() =>
                  onRoll(`1d20${signed(prof + casting)}`, spell.name)
                }
              >
                Cast
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No spells yet</strong>
            <span>Add spell management in the next update.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryTab({
  hero,
  updateHero,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
}) {
  const blank: Omit<Item, "id" | "equipped"> = {
    name: "",
    quantity: 1,
    weight: 0,
    category: "weapon",
    damage: "1d8",
    damageType: "slashing",
    elementDamage: "",
    elementType: "",
    armorBase: 10,
    armorType: "light",
    dexCap: 99,
    acBonus: 0,
    rarity: "Common",
  };
  const [custom, setCustom] = useState(blank);
  const [catalogName, setCatalogName] = useState(ITEM_CATALOG[0].name);
  const total = hero.inventory.reduce(
    (sum, item) => sum + item.weight * item.quantity,
    0,
  );
  function add() {
    if (!custom.name.trim()) return;
    updateHero({
      inventory: [
        ...hero.inventory,
        {
          ...custom,
          id: Date.now(),
          name: custom.name.trim(),
          equipped: false,
          rarity: "Common",
        },
      ],
    });
    setCustom(blank);
  }
  function addKnown() {
    const item = ITEM_CATALOG.find((entry) => entry.name === catalogName);
    if (!item) return;
    const armor: Record<string, Partial<Item>> = {
      "Leather Armor": {
        category: "armor",
        armorType: "light",
        armorBase: 11,
        dexCap: 99,
      },
      "Studded Leather Armor": {
        category: "armor",
        armorType: "light",
        armorBase: 12,
        dexCap: 99,
      },
      "Chain Shirt": {
        category: "armor",
        armorType: "medium",
        armorBase: 13,
        dexCap: 2,
      },
      "Scale Mail": {
        category: "armor",
        armorType: "medium",
        armorBase: 14,
        dexCap: 2,
      },
      Breastplate: {
        category: "armor",
        armorType: "medium",
        armorBase: 14,
        dexCap: 2,
      },
      "Half Plate Armor": {
        category: "armor",
        armorType: "medium",
        armorBase: 15,
        dexCap: 2,
      },
      "Chain Mail": {
        category: "armor",
        armorType: "heavy",
        armorBase: 16,
        dexCap: 0,
      },
      "Plate Armor": {
        category: "armor",
        armorType: "heavy",
        armorBase: 18,
        dexCap: 0,
      },
      Shield: { category: "armor", armorType: "shield", acBonus: 2, dexCap: 0 },
    };
    const catalogGear: Partial<Item> =
      armor[item.name] ??
      (ITEM_CATALOG.findIndex((entry) => entry.name === item.name) < 39
        ? { category: "weapon", damage: "1d6", damageType: "physical" }
        : { category: "gear" });
    updateHero({
      inventory: [
        ...hero.inventory,
        {
          id: Date.now(),
          name: item.name,
          quantity: 1,
          weight: item.weight,
          cost: item.cost,
          equipped: false,
          ...catalogGear,
        },
      ],
    });
  }
  return (
    <div>
      <div className="inventory-summary">
        <span>
          CARRYING <b>{total} lb</b>
        </span>
        <span>
          CAPACITY <b>{hero.abilities.str * 15} lb</b>
        </span>
        <div>
          <i
            style={{
              width: `${Math.min(100, (total / (hero.abilities.str * 15)) * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="catalog-row">
        <div>
          <span>2024 EQUIPMENT CATALOG</span>
          <select
            value={catalogName}
            onChange={(event) => setCatalogName(event.target.value)}
          >
            {ITEM_CATALOG.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} · {item.cost} · {item.weight} lb
              </option>
            ))}
          </select>
        </div>
        <button onClick={addKnown}>＋ Add Known Item</button>
      </div>
      <section className="equipment-importer">
        <div className="section-title">
          <h3>Custom Equipment</h3>
          <span>WEAPON · ARMOR · GEAR</span>
        </div>
        <div className="equipment-grid">
          <label>
            <span>Type</span>
            <select
              value={custom.category}
              onChange={(event) =>
                setCustom({
                  ...custom,
                  category: event.target.value as Item["category"],
                })
              }
            >
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="gear">Gear</option>
            </select>
          </label>
          <label>
            <span>Name</span>
            <input
              value={custom.name}
              onChange={(event) =>
                setCustom({ ...custom, name: event.target.value })
              }
              placeholder="Flame-touched blade"
            />
          </label>
          <label>
            <span>Weight (lb)</span>
            <input
              type="number"
              min="0"
              value={custom.weight}
              onChange={(event) =>
                setCustom({ ...custom, weight: Number(event.target.value) })
              }
            />
          </label>
          <label><span>Rarity</span><select value={custom.rarity} onChange={(event) => setCustom({ ...custom, rarity: event.target.value as Item["rarity"] })}>{["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"].map((rarity) => <option key={rarity}>{rarity}</option>)}</select></label>
          {custom.category === "weapon" && (
            <>
              <label>
                <span>Weapon damage</span>
                <input
                  value={custom.damage}
                  onChange={(event) =>
                    setCustom({ ...custom, damage: event.target.value })
                  }
                  placeholder="1d8"
                />
              </label>
              <label>
                <span>Damage type</span>
                <input
                  value={custom.damageType}
                  onChange={(event) =>
                    setCustom({ ...custom, damageType: event.target.value })
                  }
                  placeholder="Slashing"
                />
              </label>
              <label>
                <span>Element damage</span>
                <input
                  value={custom.elementDamage}
                  onChange={(event) =>
                    setCustom({ ...custom, elementDamage: event.target.value })
                  }
                  placeholder="1d6"
                />
              </label>
              <label>
                <span>Element type</span>
                <input
                  value={custom.elementType}
                  onChange={(event) =>
                    setCustom({ ...custom, elementType: event.target.value })
                  }
                  placeholder="Fire"
                />
              </label>
            </>
          )}
          {custom.category === "armor" && (
            <>
              <label>
                <span>Armor type</span>
                <select
                  value={custom.armorType}
                  onChange={(event) =>
                    setCustom({
                      ...custom,
                      armorType: event.target.value as Item["armorType"],
                      dexCap:
                        event.target.value === "medium"
                          ? 2
                          : event.target.value === "heavy" ||
                              event.target.value === "shield"
                            ? 0
                            : 99,
                    })
                  }
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                  <option value="shield">Shield</option>
                </select>
              </label>
              {custom.armorType === "shield" ? (
                <label>
                  <span>AC bonus</span>
                  <input
                    type="number"
                    value={custom.acBonus}
                    onChange={(event) =>
                      setCustom({
                        ...custom,
                        acBonus: Number(event.target.value),
                      })
                    }
                  />
                </label>
              ) : (
                <>
                  <label>
                    <span>Base AC</span>
                    <input
                      type="number"
                      value={custom.armorBase}
                      onChange={(event) =>
                        setCustom({
                          ...custom,
                          armorBase: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    <span>Max DEX bonus</span>
                    <input
                      type="number"
                      value={custom.dexCap}
                      onChange={(event) =>
                        setCustom({
                          ...custom,
                          dexCap: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
        <button className="primary" onClick={add}>
          ＋ Add Custom Equipment
        </button>
      </section>
      <div className="inventory-list">
        <div className="inventory-head">
          <span>ITEM</span>
          <span>QTY</span>
          <span>WEIGHT</span>
          <span />
        </div>
        {hero.inventory.map((item) => (
          <div key={item.id}>
            <button
              className={`equip ${item.equipped ? "active" : ""}`}
              onClick={() => {
                const inventory = hero.inventory.map((entry) =>
                  entry.id === item.id
                    ? { ...entry, equipped: !entry.equipped }
                    : entry,
                );
                updateHero({
                  inventory,
                  ac: calculatedAc({ ...hero, inventory }),
                });
              }}
            >
              ◆
            </button>
            <span>
              <b>{item.name}</b>
              <small>
                {item.equipped ? "Equipped" : "Stowed"}
                {` · ${item.rarity ?? "Common"}`}
                {item.cost ? ` · ${item.cost}` : ""}
                {item.category === "weapon" && item.damage
                  ? ` · ${item.damage} ${item.damageType ?? ""}${item.elementDamage ? ` + ${item.elementDamage} ${item.elementType ?? ""}` : ""}`
                  : ""}
                {item.category === "armor"
                  ? ` · AC ${item.armorType === "shield" ? `+${item.acBonus ?? 0}` : item.armorBase}`
                  : ""}
              </small>
            </span>
            <input
              type="number"
              min="0"
              value={item.quantity}
              onChange={(event) =>
                updateHero({
                  inventory: hero.inventory.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, quantity: Number(event.target.value) }
                      : entry,
                  ),
                })
              }
            />
            <input
              type="number"
              min="0"
              value={item.weight}
              onChange={(event) =>
                updateHero({
                  inventory: hero.inventory.map((entry) =>
                    entry.id === item.id
                      ? { ...entry, weight: Number(event.target.value) }
                      : entry,
                  ),
                })
              }
            />
            <button
              className="remove"
              onClick={() =>
                updateHero({
                  inventory: hero.inventory.filter(
                    (entry) => entry.id !== item.id,
                  ),
                })
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesTab({
  hero,
  updateHero,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
}) {
  const classFeatures = (CLASS_RULES[hero.className]?.features ?? []).filter((feature) => feature.level <= hero.level).sort((a, b) => a.level - b.level);
  const species = SPECIES[hero.ancestry as keyof typeof SPECIES];
  const background = BACKGROUNDS[hero.background as keyof typeof BACKGROUNDS];
  return (
    <div className="feature-layout">
      <section>
        <div className="section-title">
          <h3>Character Details</h3>
        </div>
        {(
          [
            ["Personality", "personality"],
            ["Ideals", "ideals"],
            ["Bonds", "bonds"],
            ["Flaws", "flaws"],
          ] as const
        ).map(([label, key]) => (
          <label className="text-card" key={key}>
            <span>{label}</span>
            <textarea
              value={hero[key]}
              onChange={(event) => updateHero({ [key]: event.target.value })}
            />
          </label>
        ))}
      </section>
      <section>
        <div className="section-title">
          <h3>Class, Species & Background Features</h3>
        </div>
        {classFeatures.map((feature) => <article className="feature-card" key={`${feature.level}-${feature.name}`}><span>{hero.className.toUpperCase()} · LEVEL {feature.level}{feature.track ? " · LIMITED USE" : " · PASSIVE/AVAILABLE"}</span><h4>{feature.name}</h4><p>{featureDescription(feature.name, Boolean(feature.track))}</p></article>)}
        {species?.traits.map((trait) => <article className="feature-card species" key={trait.name}><span>{hero.ancestry.toUpperCase()} TRAIT</span><h4>{trait.name}</h4><p>{trait.summary}</p></article>)}
        {species && <article className="feature-card species species-mechanics"><span>{hero.ancestry.toUpperCase()} · APPLIED MECHANICS</span><h4>Your species benefits</h4><p>Size {hero.size ?? species.sizeOptions[0]} · Speed {hero.speed} ft{hero.darkvision ? ` · Darkvision ${hero.darkvision} ft` : ""}{(hero.carryingMultiplier ?? 1) > 1 ? ` · Carrying capacity ×${hero.carryingMultiplier}` : ""}{hero.longRestHours && hero.longRestHours < 8 ? ` · Long Rest ${hero.longRestHours} hours` : ""}.</p>{hero.speciesChoices?.lineage && <p><b>Lineage:</b> {hero.speciesChoices.lineage}</p>}{hero.speciesChoices?.skill && <p><b>Granted proficiency:</b> {hero.speciesChoices.skill} (+{Math.ceil(hero.level / 4) + 1} proficiency).</p>}{(hero.speciesResistances ?? []).length > 0 && <p><b>Resistances:</b> {hero.speciesResistances?.join(", ")}.</p>}{(hero.conditionAdvantages ?? []).length > 0 && <p><b>Advantage:</b> {hero.conditionAdvantages?.join("; ")}.</p>}{(hero.speciesGrantedSpells ?? []).length > 0 && <p><b>Innate spells:</b> {hero.speciesGrantedSpells?.join(", ")}. These do not count against class spell choices.</p>}</article>}
        {background && <article className="feature-card background"><span>{hero.background.toUpperCase()} BACKGROUND</span><h4>{background.feat}</h4><p>Granted skills: {background.skills}. Each proficient skill adds your proficiency bonus (+{Math.ceil(hero.level / 4) + 1}) to its ability check. Tool: {background.tool}. Eligible abilities: {background.abilities}.</p></article>}
        {(hero.feats ?? []).map((feat) => <article className="feature-card feat" key={feat.id}><span>FEAT</span><h4>{feat.name}</h4><p>{feat.description}</p></article>)}
      </section>
    </div>
  );
}
function NotesTab({
  hero,
  updateHero,
}: {
  hero: Hero;
  updateHero: (patch: Partial<Hero>) => void;
}) {
  return (
    <div className="notes-tab">
      <div>
        <span>ADVENTURE JOURNAL</span>
        <strong>Session Notes</strong>
      </div>
      <textarea
        value={hero.notes}
        onChange={(event) => updateHero({ notes: event.target.value })}
        placeholder="Track clues, promises, NPCs, treasure, and everything your hero learns…"
      />
      <small>Autosaved on this device</small>
    </div>
  );
}

function DicePanel({
  formula,
  setFormula,
  mode,
  setMode,
  rolls,
  setRolls,
  onRoll,
  animation,
  setAnimation,
  sound,
  setSound,
}: {
  formula: string;
  setFormula: (value: string) => void;
  mode: RollMode;
  setMode: (value: RollMode) => void;
  rolls: Roll[];
  setRolls: (rolls: Roll[]) => void;
  onRoll: (
    formula: string,
    label?: string,
    mode?: RollMode,
    criticalDamage?: boolean,
  ) => void;
  animation: boolean;
  setAnimation: (value: boolean) => void;
  sound: boolean;
  setSound: (value: boolean) => void;
}) {
  const [dicePool, setDicePool] = useState<Record<number, number>>({});
  function updatePool(sides: number, amount: number) {
    setDicePool((current) => {
      const next = {
        ...current,
        [sides]: Math.max(0, Math.min(50, (current[sides] ?? 0) + amount)),
      };
      if (!next[sides]) delete next[sides];
      const expression = Object.entries(next)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([die, count]) => `${count}d${die}`)
        .join("+");
      setFormula(expression || "1d20");
      return next;
    });
  }
  function clearPool() {
    setDicePool({});
    setFormula("1d20");
  }
  return (
    <aside className="dice-panel">
      <div className="dice-heading">
        <div>
          <p>DICE TRAY</p>
          <h2>Roll destiny</h2>
        </div>
        <span className="d20">20</span>
      </div>
      <label className="animation-toggle">
        <span>
          <b>Animated dice</b>
          <small>Show the roll animation</small>
        </span>
        <input
          type="checkbox"
          checked={animation}
          onChange={(event) => setAnimation(event.target.checked)}
        />
        <i />
      </label>
      <label className="animation-toggle">
        <span>
          <b>Dice sounds</b>
          <small>Play a short dice-clatter sound</small>
        </span>
        <input
          type="checkbox"
          checked={sound}
          onChange={(event) => setSound(event.target.checked)}
        />
        <i />
      </label>
      <div className="quick-dice">
        {[4, 6, 8, 10, 12, 20, 100].map((die) => (
          <div
            className={`dice-pick ${dicePool[die] ? "selected" : ""}`}
            key={die}
          >
            <button className="dice-add-zone" onClick={() => updatePool(die, 1)}>
              <strong>d{die}</strong>
              <span>{dicePool[die] ? `${dicePool[die]} selected · tap to add` : "Tap to add"}</span>
            </button>
            <div className="dice-stepper">
              <button
                className="dice-minus"
                aria-label={`Remove one d${die}`}
                disabled={!dicePool[die]}
                onClick={() => updatePool(die, -1)}
              >
                − Remove
              </button>
              <b>{dicePool[die] ?? 0}</b>
              <button aria-label={`Add one d${die}`} onClick={() => updatePool(die, 1)}>＋ Add</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pool-summary">
        <span>Click a die repeatedly to add it to the pool.</span>
        <button onClick={clearPool}>Clear pool</button>
      </div>
      <div className="roll-mode">
        {(["disadvantage", "normal", "advantage"] as RollMode[]).map(
          (value) => (
            <button
              key={value}
              className={mode === value ? "active" : ""}
              onClick={() => setMode(value)}
            >
              {value === "normal" ? "Straight" : value}
            </button>
          ),
        )}
      </div>
      <div className="formula">
        <input
          value={formula}
          onChange={(event) => setFormula(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onRoll(formula)}
          aria-label="Dice formula"
        />
        <button onClick={() => onRoll(formula)}>ROLL</button>
      </div>
      <button
        className="critical-damage"
        onClick={() => onRoll(formula, "Critical Damage", "normal", true)}
      >
        ⚔ Roll as Critical Damage
      </button>
      <p className="formula-help">
        Critical damage doubles every dice term and adds modifiers once.
      </p>
      <div className="history-head">
        <h3>Recent Rolls</h3>
        <button onClick={() => setRolls([])}>Clear</button>
      </div>
      <div className="roll-list">
        {rolls.length ? (
          rolls.map((roll) => (
            <div
              className={`roll ${roll.critical ? "critical" : ""} ${roll.fumble ? "fumble" : ""}`}
              key={roll.id}
            >
              <div>
                <strong>{roll.label}</strong>
                <span>
                  {roll.formula} · {roll.detail}
                </span>
              </div>
              <b>{roll.total}</b>
            </div>
          ))
        ) : (
          <div className="empty-state compact">
            <strong>The dice await</strong>
            <span>Click any check or choose a die above.</span>
          </div>
        )}
      </div>
      <div className="dice-tip">
        <span>✦</span>
        <p>
          <strong>Table ready</strong>Every ability, skill, save, and attack can
          roll directly into this tray.
        </p>
      </div>
    </aside>
  );
}

function Editor({
  hero,
  onClose,
  onSave,
}: {
  hero: Hero;
  onClose: () => void;
  onSave: (patch: Partial<Hero>) => void;
}) {
  const [draft, setDraft] = useState(hero);
  const [rolled, setRolled] = useState<number[]>([]);
  const set = (key: keyof Hero, value: string | number) =>
    setDraft((item) => ({ ...item, [key]: value }));
  const rule = CLASS_RULES[draft.className] ?? CLASS_RULES.Fighter;
  const learned = rule.features
    .filter((feature) => feature.level <= draft.level)
    .sort((a, b) => a.level - b.level);
  const nextFeatures = rule.features
    .filter((feature) => feature.level > draft.level)
    .sort((a, b) => a.level - b.level)
    .slice(0, 3);
  function chooseClass(className: string) {
    const nextRule = CLASS_RULES[className];
    setDraft((item) => ({
      ...item,
      className,
      subclass: item.level >= 3 ? nextRule.subclasses[0] : "",
      maxHitDice: item.level,
    }));
  }
  function assignScores(values: number[]) {
    const keys: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
    setDraft((item) => ({
      ...item,
      abilities: Object.fromEntries(
        keys.map((key, index) => [key, values[index]]),
      ) as Record<AbilityKey, number>,
    }));
  }
  function rollStats() {
    const values = rollAbilitySet();
    setRolled(values);
    assignScores(values);
  }
  function uploadPortrait(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) {
      window.alert("Choose an image under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setDraft((item) => ({ ...item, portrait: String(reader.result) }));
    reader.readAsDataURL(file);
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="editor wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <header>
          <div>
            <p>2024 CHARACTER BUILDER</p>
            <h2 id="editor-title">Edit {hero.name}</h2>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <div className="builder-columns">
          <div>
            <div className="portrait-uploader">
              <div className={`portrait ${draft.portrait ? "has-image" : ""}`}>
                {draft.portrait ? (
                  <img src={draft.portrait} alt="Character preview" />
                ) : (
                  initials(draft.name)
                )}
              </div>
              <label>
                <span>Character portrait</span>
                <strong>Upload JPG, PNG, GIF, or WebP</strong>
                <small>
                  Maximum 2 MB. The image is kept inside this user&apos;s
                  private vault.
                </small>
                <input type="file" accept="image/*" onChange={uploadPortrait} />
              </label>
              {draft.portrait && (
                <button
                  onClick={() =>
                    setDraft((item) => ({ ...item, portrait: "" }))
                  }
                >
                  Remove
                </button>
              )}
            </div>
            <div className="editor-grid">
              <label>
                <span>Character Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => set("name", event.target.value)}
                />
              </label>
              <label>
                <span>Class</span>
                <select
                  value={draft.className}
                  onChange={(event) => chooseClass(event.target.value)}
                >
                  {Object.keys(CLASS_RULES).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  Subclass {draft.level < 3 && "(unlocks at level 3)"}
                </span>
                <select
                  value={draft.subclass}
                  disabled={draft.level < 3}
                  onChange={(event) => set("subclass", event.target.value)}
                >
                  <option value="">Not selected</option>
                  {rule.subclasses.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Level</span>
                <select
                  value={draft.level}
                  onChange={(event) => {
                    const level = Number(event.target.value);
                    setDraft((item) => ({
                      ...item,
                      level,
                      subclass:
                        level < 3 ? "" : item.subclass || rule.subclasses[0],
                    }));
                  }}
                >
                  {Array.from({ length: 20 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Level {index + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Ancestry</span>
                <input
                  value={draft.ancestry}
                  onChange={(event) => set("ancestry", event.target.value)}
                />
              </label>
              <label>
                <span>Background</span>
                <input
                  value={draft.background}
                  onChange={(event) => set("background", event.target.value)}
                />
              </label>
              <label>
                <span>Maximum HP</span>
                <input
                  type="number"
                  min="1"
                  value={draft.maxHp}
                  onChange={(event) => set("maxHp", Number(event.target.value))}
                />
              </label>
              <label>
                <span>Armor Class</span>
                <input
                  type="number"
                  min="0"
                  value={draft.ac}
                  onChange={(event) => set("ac", Number(event.target.value))}
                />
              </label>
            </div>
            <div className="stat-methods">
              <div>
                <span>ABILITY SCORE METHOD</span>
                <strong>Generate like D&D Beyond</strong>
                <small>
                  Roll four d6, discard the lowest die, and total the highest
                  three—six times.
                </small>
              </div>
              <button onClick={rollStats}>⚄ Roll 4d6</button>
              <button
                onClick={() => {
                  setRolled(STANDARD_ARRAY);
                  assignScores(STANDARD_ARRAY);
                }}
              >
                Use Standard Array
              </button>
            </div>
            {rolled.length > 0 && (
              <div className="rolled-set">
                <span>Generated set</span>
                {rolled.map((score, index) => (
                  <b key={index}>{score}</b>
                ))}
                <small>
                  Scores were assigned STR → CHA. Rearrange them below as you
                  like.
                </small>
              </div>
            )}
            <div className="editor-abilities">
              <span>ABILITY SCORES</span>
              <div>
                {abilities.map(({ key, label }) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={draft.abilities[key]}
                      onChange={(event) =>
                        setDraft((item) => ({
                          ...item,
                          abilities: {
                            ...item.abilities,
                            [key]: Number(event.target.value),
                          },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <aside className="progression-preview">
            <div>
              <span>{draft.className.toUpperCase()} PROGRESSION</span>
              <strong>Level {draft.level}</strong>
              <small>
                Primary: {rule.primary} · Hit Die: d{rule.hitDie}
              </small>
            </div>
            <section>
              <h3>Features acquired</h3>
              {learned.map((feature) => (
                <article key={`${feature.level}-${feature.name}`}>
                  <b>{feature.level}</b>
                  <span>{feature.name}</span>
                  {feature.track && <em>Trackable</em>}
                </article>
              ))}
            </section>
            <section>
              <h3>Coming next</h3>
              {nextFeatures.map((feature) => (
                <article key={`${feature.level}-${feature.name}`}>
                  <b>{feature.level}</b>
                  <span>{feature.name}</span>
                </article>
              ))}
            </section>
          </aside>
        </div>
        <footer>
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={() => onSave(draft)}>
            Save Character
          </button>
        </footer>
      </section>
    </div>
  );
}
