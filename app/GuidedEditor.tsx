"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  BACKGROUNDS,
  POINT_BUY_COST,
  SPECIES,
  STARTER_SPELLS,
} from "../lib/builder2024";
import {
  CLASS_RULES,
  ITEM_CATALOG,
  rollAbilitySet,
  STANDARD_ARRAY,
} from "../lib/rules2024";
import type { AbilityKey, Hero, Item, Spell } from "./page";

type Step = "class" | "background" | "species" | "abilities" | "equipment";
const STEPS: { key: Step; label: string }[] = [
  { key: "class", label: "Class" },
  { key: "background", label: "Background" },
  { key: "species", label: "Species" },
  { key: "abilities", label: "Abilities" },
  { key: "equipment", label: "Equipment" },
];
const abilityKeys: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "Strength" },
  { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" },
  { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" },
  { key: "cha", label: "Charisma" },
];

export default function GuidedEditor({
  hero,
  onClose,
  onSave,
}: {
  hero: Hero;
  onClose: () => void;
  onSave: (patch: Partial<Hero>) => void;
}) {
  const [draft, setDraft] = useState(hero);
  const [step, setStep] = useState<Step>("class");
  const [open, setOpen] = useState("");
  const [scoreMethod, setScoreMethod] = useState<"standard" | "roll" | "point">(
    "standard",
  );
  const [selectedGear, setSelectedGear] = useState(
    () => new Set(hero.inventory.map((item) => item.name)),
  );
  const rule = CLASS_RULES[draft.className] ?? CLASS_RULES.Fighter;
  const stepIndex = STEPS.findIndex((item) => item.key === step);
  const learned = useMemo(
    () =>
      rule.features
        .filter((feature) => feature.level <= draft.level)
        .sort((a, b) => a.level - b.level),
    [rule, draft.level],
  );
  const future = useMemo(
    () =>
      rule.features
        .filter((feature) => feature.level > draft.level)
        .sort((a, b) => a.level - b.level),
    [rule, draft.level],
  );
  const spellNames =
    STARTER_SPELLS[draft.className as keyof typeof STARTER_SPELLS] ?? [];
  const pointSpent = abilityKeys.reduce(
    (sum, ability) =>
      sum + (POINT_BUY_COST[draft.abilities[ability.key]] ?? 99),
    0,
  );
  const warnings = [
    !draft.name.trim() && "Character name is required.",
    !draft.className && "Choose a class.",
    draft.level >= 3 && !draft.subclass && "Choose a subclass for this level.",
    scoreMethod === "point" && pointSpent > 27 && `Point buy is ${pointSpent - 27} points over budget.`,
    draft.skillProficiency.length < 2 && "Choose at least two skill proficiencies.",
  ].filter(Boolean) as string[];
  function set<K extends keyof Hero>(key: K, value: Hero[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function go(direction: number) {
    const next =
      STEPS[Math.max(0, Math.min(STEPS.length - 1, stepIndex + direction))];
    setStep(next.key);
  }
  function toggleOpen(name: string) {
    setOpen(open === name ? "" : name);
  }
  function chooseClass(className: string) {
    const next = CLASS_RULES[className];
    setDraft((current) => ({
      ...current,
      className,
      subclass: current.level >= 3 ? next.subclasses[0] : "",
      spells: [],
    }));
    setOpen("");
  }
  function assign(values: number[]) {
    setDraft((current) => ({
      ...current,
      abilities: Object.fromEntries(
        abilityKeys.map((ability, index) => [ability.key, values[index]]),
      ) as Hero["abilities"],
    }));
  }
  function toggleSpell(name: string) {
    const found = draft.spells.find((spell) => spell.name === name);
    const spells = found
      ? draft.spells.filter((spell) => spell.name !== name)
      : [
          ...draft.spells,
          {
            id: Date.now() + draft.spells.length,
            name,
            level: [
              "Light",
              "Mage Hand",
              "Ray of Frost",
              "Shocking Grasp",
              "Fire Bolt",
              "Guidance",
              "Sacred Flame",
              "Thaumaturgy",
              "Druidcraft",
              "Produce Flame",
              "Shillelagh",
              "Vicious Mockery",
              "Dancing Lights",
              "Eldritch Blast",
              "Chill Touch",
            ].includes(name)
              ? 0
              : 1,
            school: "Class spell",
            prepared: true,
            description: "Prepared during character creation.",
          },
        ];
    set("spells", spells);
  }
  function uploadPortrait(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000)
      return window.alert("Choose an image under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => set("portrait", String(reader.result));
    reader.readAsDataURL(file);
  }
  function save() {
    const existingCustom = draft.inventory.filter(
      (item) => !ITEM_CATALOG.some((entry) => entry.name === item.name),
    );
    const known: Item[] = ITEM_CATALOG.filter((item) =>
      selectedGear.has(item.name),
    ).map((item, index) => ({
      id: Date.now() + index,
      name: item.name,
      quantity: 1,
      weight: item.weight,
      cost: item.cost,
      equipped: false,
      category: "gear",
    }));
    onSave({ ...draft, inventory: [...existingCustom, ...known] });
  }
  return (
    <div className="builder-backdrop">
      <section className="guided-builder" role="dialog" aria-modal="true">
        <header>
          <div className="builder-person">
            <label
              className={`builder-avatar ${draft.portrait ? "has-image" : ""}`}
            >
              {draft.portrait ? (
                <img src={draft.portrait} alt="Character portrait" />
              ) : (
                <span>{draft.name.slice(0, 2).toUpperCase()}</span>
              )}
              <input type="file" accept="image/*" onChange={uploadPortrait} />
            </label>
            <label>
              <span>Ruleset</span>
              <select value={draft.ruleset ?? "2024 SRD"} onChange={(event) => set("ruleset", event.target.value as Hero["ruleset"])}>
                <option>2024 SRD</option><option>SRD 5.1</option><option>Wall Gloria</option><option>Homebrew</option>
              </select>
            </label>
            <label>
              <span>Character name</span>
              <input
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
              <small>Click the portrait to upload an image</small>
            </label>
          </div>
          <button className="builder-close" onClick={onClose}>
            ×
          </button>
        </header>
        <nav className="builder-steps">
          {STEPS.map((item, index) => (
            <button
              key={item.key}
              className={`${step === item.key ? "active" : ""} ${index < stepIndex ? "complete" : ""}`}
              onClick={() => setStep(item.key)}
            >
              <i>{index < stepIndex ? "✓" : index + 1}</i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <main className="builder-stage">
          {step === "class" && (
            <>
              <div className="builder-title">
                <div>
                  <p>STEP 1</p>
                  <h2>Choose your class</h2>
                  <span>
                    Select a class, level, subclass, features, and prepared
                    spells.
                  </span>
                </div>
                <label>
                  Character level
                  <select
                    value={draft.level}
                    onChange={(event) =>
                      set("level", Number(event.target.value))
                    }
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Level {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="class-picker">
                {Object.keys(CLASS_RULES).map((name) => (
                  <button
                    className={draft.className === name ? "selected" : ""}
                    key={name}
                    onClick={() => chooseClass(name)}
                  >
                    <b>{name.slice(0, 1)}</b>
                    <span>
                      {name}
                      <small>
                        d{CLASS_RULES[name].hitDie} ·{" "}
                        {CLASS_RULES[name].primary}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
              <div className="builder-split">
                <section>
                  <div className="builder-section-tabs">
                    <button className="active">Class Features</button>
                    <button
                      onClick={() =>
                        document
                          .getElementById("builder-spells")
                          ?.scrollIntoView()
                      }
                    >
                      Spells
                    </button>
                  </div>
                  {draft.level >= 3 && (
                    <label className="builder-select">
                      <span>Subclass</span>
                      <select
                        value={draft.subclass}
                        onChange={(event) =>
                          set("subclass", event.target.value)
                        }
                      >
                        {rule.subclasses.map((name) => (
                          <option key={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="builder-accordions">
                    {learned.map((feature) => (
                      <FeatureCard
                        key={`${feature.level}-${feature.name}`}
                        name={feature.name}
                        meta={`${feature.level}${ordinal(feature.level)} level${feature.track ? " · Trackable use" : ""}`}
                        open={open === feature.name}
                        onClick={() => toggleOpen(feature.name)}
                        summary={featureSummary(feature.name)}
                      />
                    ))}
                  </div>
                  {future.length > 0 && (
                    <details className="future-features">
                      <summary>
                        Available at Higher Levels ({future.length})
                      </summary>
                      {future.map((feature) => (
                        <div key={`${feature.level}-${feature.name}`}>
                          <b>Level {feature.level}</b>
                          <span>{feature.name}</span>
                        </div>
                      ))}
                    </details>
                  )}
                </section>
                <section id="builder-spells">
                  <div className="builder-section-tabs">
                    <button>Features</button>
                    <button className="active">Spells</button>
                  </div>
                  {spellNames.length ? (
                    <>
                      <div className="prepared-heading">
                        <strong>
                          Prepared Spells (
                          {
                            draft.spells.filter((spell) =>
                              spellNames.includes(spell.name as never),
                            ).length
                          }
                          )
                        </strong>
                        <span>
                          Choose the spells this character knows or prepares.
                        </span>
                      </div>
                      <div className="spell-picker">
                        {spellNames.map((name) => {
                          const selected = draft.spells.some(
                            (spell) => spell.name === name,
                          );
                          return (
                            <button
                              key={name}
                              className={selected ? "selected" : ""}
                              onClick={() => toggleSpell(name)}
                            >
                              <i>{selected ? "✓" : "+"}</i>
                              <span>
                                <b>{name}</b>
                                <small>
                                  {[
                                    "Light",
                                    "Mage Hand",
                                    "Ray of Frost",
                                    "Shocking Grasp",
                                    "Fire Bolt",
                                    "Guidance",
                                    "Sacred Flame",
                                    "Thaumaturgy",
                                    "Druidcraft",
                                    "Produce Flame",
                                    "Shillelagh",
                                    "Vicious Mockery",
                                    "Dancing Lights",
                                    "Eldritch Blast",
                                    "Chill Touch",
                                  ].includes(name)
                                    ? "Cantrip"
                                    : "1st Level"}
                                </small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="builder-empty">
                      This class does not prepare starter spells at level 1.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
          {step === "background" && (
            <>
              <div className="builder-title">
                <div>
                  <p>STEP 2</p>
                  <h2>Choose a background</h2>
                  <span>
                    Your background represents the life your character led
                    before adventuring.
                  </span>
                </div>
              </div>
              <div className="choice-grid">
                {Object.entries(BACKGROUNDS).map(([name, data]) => (
                  <button
                    key={name}
                    className={draft.background === name ? "selected" : ""}
                    onClick={() => set("background", name)}
                  >
                    <strong>{name}</strong>
                    <span>{data.feat}</span>
                    <small>{data.skills}</small>
                  </button>
                ))}
              </div>
              {BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS] && (
                <div className="selection-detail">
                  <h3>{draft.background}</h3>
                  {Object.entries(
                    BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS],
                  ).map(([key, value]) => (
                    <FeatureCard
                      key={key}
                      name={title(key)}
                      meta="Background choice"
                      open={open === key}
                      onClick={() => toggleOpen(key)}
                      summary={value}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {step === "species" && (
            <>
              <div className="builder-title">
                <div>
                  <p>STEP 3</p>
                  <h2>Choose a species</h2>
                  <span>
                    Species provides innate traits such as speed, size, senses,
                    and magical ancestry.
                  </span>
                </div>
              </div>
              <div className="choice-grid species-grid">
                {Object.entries(SPECIES).map(([name, data]) => (
                  <button
                    key={name}
                    className={draft.ancestry === name ? "selected" : ""}
                    onClick={() => set("ancestry", name)}
                  >
                    <b>{name.slice(0, 1)}</b>
                    <strong>{name}</strong>
                    <small>{data.summary}</small>
                  </button>
                ))}
              </div>
              {SPECIES[draft.ancestry as keyof typeof SPECIES] && (
                <div className="selection-detail">
                  <h3>{draft.ancestry} Traits</h3>
                  <p>
                    {SPECIES[draft.ancestry as keyof typeof SPECIES].summary}
                  </p>
                  {SPECIES[draft.ancestry as keyof typeof SPECIES].traits.map(
                    (trait) => (
                      <FeatureCard
                        key={trait.name}
                        name={trait.name}
                        meta={`${draft.ancestry} trait`}
                        open={open === trait.name}
                        onClick={() => toggleOpen(trait.name)}
                        summary={trait.summary}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )}
          {step === "abilities" && (
            <>
              <div className="builder-title">
                <div>
                  <p>STEP 4</p>
                  <h2>Assign ability scores</h2>
                  <span>
                    Use the standard array, roll 4d6 and drop the lowest, or
                    spend 27 points.
                  </span>
                </div>
              </div>
              <div className="score-methods">
                {(["standard", "roll", "point"] as const).map((method) => (
                  <button
                    className={scoreMethod === method ? "active" : ""}
                    key={method}
                    onClick={() => {
                      setScoreMethod(method);
                      if (method === "standard") assign(STANDARD_ARRAY);
                      if (method === "roll") assign(rollAbilitySet());
                      if (method === "point") assign([8, 8, 8, 8, 8, 8]);
                    }}
                  >
                    {method === "standard"
                      ? "Standard Array"
                      : method === "roll"
                        ? "Roll 4d6"
                        : "Point Buy"}
                  </button>
                ))}
              </div>
              {scoreMethod === "point" && (
                <div
                  className={`point-budget ${pointSpent > 27 ? "over" : ""}`}
                >
                  <span>Points spent</span>
                  <strong>{pointSpent} / 27</strong>
                </div>
              )}
              <div className="ability-assignment">
                {abilityKeys.map((ability) => (
                  <label key={ability.key}>
                    <span>{ability.label}</span>
                    {scoreMethod === "point" ? (
                      <select
                        value={draft.abilities[ability.key]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            abilities: {
                              ...current.abilities,
                              [ability.key]: Number(event.target.value),
                            },
                          }))
                        }
                      >
                        {Object.keys(POINT_BUY_COST).map((value) => (
                          <option key={value} value={value}>
                            {value} ({POINT_BUY_COST[Number(value)]} pts)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={draft.abilities[ability.key]}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            abilities: {
                              ...current.abilities,
                              [ability.key]: Number(event.target.value),
                            },
                          }))
                        }
                      />
                    )}
                    <b>{draft.abilities[ability.key]}</b>
                    <small>
                      Modifier{" "}
                      {signed(
                        Math.floor((draft.abilities[ability.key] - 10) / 2),
                      )}
                    </small>
                  </label>
                ))}
              </div>
            </>
          )}
          {step === "equipment" && (
            <>
              <div className="builder-title">
                <div>
                  <p>STEP 5</p>
                  <h2>Choose starting equipment</h2>
                  <span>
                    Select known gear now. Custom weapons and armor can still be
                    created from Inventory.
                  </span>
                </div>
                <strong>{selectedGear.size} selected</strong>
              </div>
              <div className="equipment-choices">
                {ITEM_CATALOG.map((item) => (
                  <button
                    className={selectedGear.has(item.name) ? "selected" : ""}
                    key={item.name}
                    onClick={() =>
                      setSelectedGear((current) => {
                        const next = new Set(current);
                        next.has(item.name)
                          ? next.delete(item.name)
                          : next.add(item.name);
                        return next;
                      })
                    }
                  >
                    <i>{selectedGear.has(item.name) ? "✓" : "+"}</i>
                    <span>
                      <b>{item.name}</b>
                      <small>
                        {item.cost} · {item.weight} lb
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
        {!!warnings.length && <aside className="builder-validation"><b>Character check</b>{warnings.map((warning) => <span key={warning}>⚠ {warning}</span>)}</aside>}
        <footer>
          <button
            className="secondary"
            disabled={stepIndex === 0}
            onClick={() => go(-1)}
          >
            ← Previous
          </button>
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          {stepIndex < STEPS.length - 1 ? (
            <button className="primary" onClick={() => go(1)}>
              Next →
            </button>
          ) : (
            <button
              className="primary"
              disabled={warnings.length > 0}
              onClick={save}
            >
              Finish Character
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function FeatureCard({
  name,
  meta,
  summary,
  open,
  onClick,
}: {
  name: string;
  meta: string;
  summary: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`builder-accordion ${open ? "open" : ""}`}
      onClick={onClick}
    >
      <span>
        <strong>{name}</strong>
        <small>{meta}</small>
        {open && <p>{summary}</p>}
      </span>
      <i>⌄</i>
    </button>
  );
}
function ordinal(value: number) {
  const mod10 = value % 10,
    mod100 = value % 100;
  return mod10 === 1 && mod100 !== 11
    ? "st"
    : mod10 === 2 && mod100 !== 12
      ? "nd"
      : mod10 === 3 && mod100 !== 13
        ? "rd"
        : "th";
}
function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}
function title(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
function featureSummary(name: string) {
  const summaries: Record<string, string> = {
    Spellcasting:
      "Prepare and cast spells using your class's spellcasting ability.",
    "Weapon Mastery":
      "Use the mastery properties of weapons selected for your class.",
    "Arcane Recovery": "Recover expended magical power during a Short Rest.",
    "Ritual Adept":
      "Cast eligible prepared spells as rituals without expending a spell slot.",
    "Fighting Style":
      "Choose specialized martial training that shapes how you fight.",
    "Second Wind": "Call on stamina to recover Hit Points during battle.",
    "Sneak Attack":
      "Deal extra damage when you strike with precision under the right conditions.",
    Rage: "Enter a battle fury that improves your martial power and resilience.",
  };
  return (
    summaries[name] ??
    `${name} is gained at this class level. Track its choices and uses on the finished character sheet.`
  );
}
