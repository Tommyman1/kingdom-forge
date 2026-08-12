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
  CLASS_SAVES,
  CLASS_SKILLS,
  ITEM_CATALOG,
  rollAbilitySet,
  STANDARD_ARRAY,
} from "../lib/rules2024";
import type { AbilityKey, Hero, Item, Spell } from "./page";
import { cantripKnownLimit, featureDescription, preparedSpellLimit, spellInfo } from "../lib/rulesContent";

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
const abilityNameToKey: Record<string, AbilityKey> = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };

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
  const [scoreMethod, setScoreMethod] = useState<"standard" | "roll" | "d20" | "point">(
    "standard",
  );
  const [speciesSkill, setSpeciesSkill] = useState(hero.speciesChoices?.skill ?? "Perception");
  const [speciesSize, setSpeciesSize] = useState(hero.speciesChoices?.size ?? "Medium");
  const [speciesLineage, setSpeciesLineage] = useState(hero.speciesChoices?.lineage ?? "");
  const [speciesFeat, setSpeciesFeat] = useState(hero.speciesChoices?.originFeat ?? "Alert");
  const [classSkills, setClassSkills] = useState(() => new Set((hero.classSkillProficiencies ?? []).filter((skill) => CLASS_SKILLS[hero.className]?.choices.includes(skill)).slice(0, CLASS_SKILLS[hero.className]?.count ?? 2)));
  const backgroundData = BACKGROUNDS[hero.background as keyof typeof BACKGROUNDS] ?? BACKGROUNDS.Soldier;
  const initialBackgroundAbilities = backgroundData?.abilities.split(", ") ?? ["Strength", "Dexterity", "Constitution"];
  const [backgroundPrimary, setBackgroundPrimary] = useState(initialBackgroundAbilities[0]);
  const [backgroundSecondary, setBackgroundSecondary] = useState(initialBackgroundAbilities[1]);
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
  const castingKey: AbilityKey = rule.primary.includes("Intelligence") ? "int" : rule.primary.includes("Wisdom") ? "wis" : "cha";
  const preparedLimit = preparedSpellLimit(draft.className, draft.level, Math.floor((draft.abilities[castingKey] - 10) / 2));
  const preparedCount = draft.spells.filter((spell) => spell.prepared && spell.level > 0).length;
  const cantripLimit = cantripKnownLimit(draft.className, draft.level);
  const cantripCount = draft.spells.filter((spell) => spell.level === 0 && !(draft.speciesGrantedSpells ?? []).includes(spell.name)).length;
  const selectedSpecies = SPECIES[draft.ancestry];
  const classSkillRule = CLASS_SKILLS[draft.className] ?? { count: 2, choices: [] };
  const warnings = [
    !draft.name.trim() && "Character name is required.",
    !draft.className && "Choose a class.",
    !BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS] && "Choose a supported background.",
    draft.level >= 3 && !draft.subclass && "Choose a subclass for this level.",
    scoreMethod === "point" && pointSpent > 27 && `Point buy is ${pointSpent - 27} points over budget.`,
    draft.skillProficiency.length < 2 && "Choose at least two skill proficiencies.",
    Boolean(selectedSpecies?.lineages?.length) && !speciesLineage && "Choose a species lineage or ancestry.",
    classSkills.size !== classSkillRule.count && `Choose exactly ${classSkillRule.count} ${draft.className} skill proficiencies (${classSkills.size}/${classSkillRule.count}).`,
    backgroundPrimary === backgroundSecondary && "Background ability increases must use two different abilities.",
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
      proficiency: (CLASS_SAVES[className] ?? ["str", "con"]) as AbilityKey[],
    }));
    setClassSkills(new Set());
    setOpen("");
  }
  function chooseBackground(background: string) {
    const everyBackgroundSkill = new Set(Object.values(BACKGROUNDS).flatMap((item) => item.skills.split(", ")));
    const granted = BACKGROUNDS[background as keyof typeof BACKGROUNDS].skills.split(", ");
    setDraft((current) => ({ ...current, background, skillProficiency: [...new Set([...current.skillProficiency.filter((skill) => !everyBackgroundSkill.has(skill)), ...granted])] }));
    const eligible = BACKGROUNDS[background as keyof typeof BACKGROUNDS].abilities.split(", ");
    setBackgroundPrimary(eligible[0]);
    setBackgroundSecondary(eligible[1]);
  }
  function toggleClassSkill(skill: string) {
    setClassSkills((current) => {
      const next = new Set(current);
      if (next.has(skill)) next.delete(skill);
      else if (next.size < classSkillRule.count) next.add(skill);
      else window.alert(`You can choose exactly ${classSkillRule.count} ${draft.className} skills. Remove one before selecting another.`);
      return next;
    });
  }
  function chooseSpecies(ancestry: string) {
    const species = SPECIES[ancestry];
    setSpeciesSize(species.sizeOptions[0]);
    setSpeciesSkill(species.skillChoices?.[0] ?? "Perception");
    setSpeciesLineage(species.lineages?.[0]?.name ?? "");
    setSpeciesFeat(species.originFeatChoices?.[0] ?? "Alert");
    setDraft((current) => ({ ...current, ancestry, speed: species.speed }));
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
    const info = spellInfo(name);
    if (!found && info.level > 0 && preparedCount >= preparedLimit) return window.alert(`Preparation limit reached (${preparedCount}/${preparedLimit}). Unprepare another leveled spell first.`);
    if (!found && info.level === 0 && cantripCount >= cantripLimit) return window.alert(`Cantrip limit reached (${cantripCount}/${cantripLimit}). Remove a cantrip before choosing another.`);
    const spells = found
      ? draft.spells.filter((spell) => spell.name !== name)
      : [
          ...draft.spells,
          {
            id: Date.now() + draft.spells.length,
            name,
            level: info.level,
            school: info.school,
            prepared: true,
            description: info.summary,
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
    const species = SPECIES[draft.ancestry];
    const lineage = species.lineages?.find((item) => item.name === speciesLineage);
    const oldSkill = draft.speciesChoices?.skill;
    const background = BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS] ?? BACKGROUNDS.Soldier;
    const backgroundSkills = background.skills.split(", ");
    const oldSourcedSkills = new Set([...(draft.classSkillProficiencies ?? []), ...(draft.backgroundGrantedSkills ?? []), ...(oldSkill ? [oldSkill] : [])]);
    const skillProficiency = [...new Set([...draft.skillProficiency.filter((skill) => !oldSourcedSkills.has(skill)), ...classSkills, ...backgroundSkills, ...(species.skillChoices ? [speciesSkill] : [])])];
    const oldSpeciesSpells = new Set(draft.speciesGrantedSpells ?? []);
    const grantedSpellNames = [...new Set([...(species.fixedSpells ?? []), ...(lineage?.spells ?? [])].filter((spell) => spell.requiredLevel <= draft.level).map((spell) => spell.name))];
    const spellsWithoutOldSpecies = draft.spells.filter((spell) => !oldSpeciesSpells.has(spell.name));
    const grantedSpells: Spell[] = grantedSpellNames.map((name, index) => { const info = spellInfo(name); return { id: Date.now() + 500 + index, name, level: info.level, school: info.school, prepared: true, description: info.summary }; });
    const speciesResourceNames = new Set(Object.values(SPECIES).flatMap((item) => item.resource ? [item.resource.name] : []));
    const resources = (draft.resources ?? []).filter((resource) => !speciesResourceNames.has(resource.name));
    if (species.resource) resources.push({ id: Date.now() + 900, name: species.resource.name, current: species.resource.max === "proficiency" ? Math.ceil(draft.level / 4) + 1 : species.resource.max, max: species.resource.max === "proficiency" ? Math.ceil(draft.level / 4) + 1 : species.resource.max, resetsOn: species.resource.resetsOn });
    const oldSpeciesResistances = new Set(draft.speciesResistances ?? []);
    const speciesResistances = [...new Set([...(species.resistances ?? []), ...(lineage?.resistance ? [lineage.resistance] : [])])];
    const resistances = [...new Set([...(draft.resistances ?? []).filter((entry) => !oldSpeciesResistances.has(entry)), ...speciesResistances])];
    const feats = (draft.feats ?? []).filter((feat) => feat.name !== draft.speciesGrantedFeat && feat.name !== draft.backgroundGrantedFeat);
    feats.push({ id: Date.now() + 940, name: background.feat, description: `${background.feat} is granted by the ${draft.background} background.` });
    if (species.originFeatChoices) feats.push({ id: Date.now() + 950, name: speciesFeat, description: `${speciesFeat} is granted by Human Versatile. Its benefits are shown under Features and Traits.` });
    const abilities = { ...draft.abilities };
    Object.entries(draft.backgroundAbilityBonuses ?? {}).forEach(([key, bonus]) => { abilities[key as AbilityKey] -= bonus ?? 0; });
    const primaryKey = abilityNameToKey[backgroundPrimary];
    const secondaryKey = abilityNameToKey[backgroundSecondary];
    const backgroundAbilityBonuses: Partial<Record<AbilityKey, number>> = { [primaryKey]: 2, [secondaryKey]: 1 };
    abilities[primaryKey] = Math.min(20, abilities[primaryKey] + 2);
    abilities[secondaryKey] = Math.min(20, abilities[secondaryKey] + 1);
    onSave({ ...draft, abilities, backgroundAbilityBonuses, backgroundGrantedSkills: backgroundSkills, backgroundGrantedFeat: background.feat, backgroundTool: background.tool, classSkillProficiencies: [...classSkills], size: speciesSize, speed: lineage?.speed ?? species.speed, darkvision: species.darkvision ?? 0, conditionAdvantages: species.conditionAdvantages ?? [], carryingMultiplier: species.carryingMultiplier ?? 1, longRestHours: species.longRestHours ?? 8, speciesChoices: { size: speciesSize, skill: species.skillChoices ? speciesSkill : undefined, lineage: speciesLineage || undefined, originFeat: species.originFeatChoices ? speciesFeat : undefined }, speciesResistances, speciesGrantedSpells: grantedSpellNames, speciesGrantedFeat: species.originFeatChoices ? speciesFeat : undefined, skillProficiency, spells: [...spellsWithoutOldSpecies, ...grantedSpells], resources, resistances, feats, inventory: [...existingCustom, ...known] });
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
              <section className="required-choice-panel">
                <header><div><p>REQUIRED CLASS CHOICE</p><h3>Skill proficiencies</h3></div><strong className={classSkills.size === classSkillRule.count ? "complete" : ""}>{classSkills.size} / {classSkillRule.count}</strong></header>
                <span>Choose exactly {classSkillRule.count}. The counter updates immediately and further choices lock at the limit.</span>
                <div className="limited-choice-grid">{classSkillRule.choices.map((skill) => { const selected = classSkills.has(skill); const locked = !selected && classSkills.size >= classSkillRule.count; return <button type="button" key={skill} className={selected ? "selected" : ""} disabled={locked} onClick={() => toggleClassSkill(skill)}><i>{selected ? "✓" : "+"}</i>{skill}</button>; })}</div>
                <small>Saving throws applied by {draft.className}: {(CLASS_SAVES[draft.className] ?? []).map((key) => key.toUpperCase()).join(" and ")}.</small>
              </section>
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
                        summary={featureDescription(feature.name, Boolean(feature.track))}
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
                        <strong>Spell choices</strong>
                        <div className="spell-choice-counters"><b className={preparedCount >= preparedLimit ? "full" : ""}>Leveled prepared {preparedCount} / {preparedLimit}</b>{cantripLimit > 0 && <b className={cantripCount >= cantripLimit ? "full" : ""}>Cantrips known {cantripCount} / {cantripLimit}</b>}</div>
                        <span>
                          Each selection immediately increases its counter. At the limit, unselected choices lock until you remove one.
                        </span>
                      </div>
                      <div className="spell-picker">
                        {spellNames.map((name) => {
                          const selected = draft.spells.some(
                            (spell) => spell.name === name,
                          );
                          const info = spellInfo(name);
                          const atLimit = !selected && (info.level === 0 ? cantripCount >= cantripLimit : preparedCount >= preparedLimit);
                          return (
                            <button
                              key={name}
                              className={`${selected ? "selected" : ""} ${atLimit ? "choice-locked" : ""}`}
                              disabled={atLimit}
                              onClick={() => toggleSpell(name)}
                            >
                              <i>{selected ? "✓" : "+"}</i>
                              <span>
                                <b>{name}</b>
                                <small>
                                  {info.level === 0 ? "Cantrip" : `${info.level}${ordinal(info.level)} Level`} · {info.school}
                                </small>
                                <small>{info.castingTime} · {info.range} · {info.duration}{info.concentration ? " · Concentration" : ""}</small>
                                <p>{info.summary}</p>
                                {atLimit && <em>Limit reached—remove another {info.level === 0 ? "cantrip" : "prepared spell"} first.</em>}
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
                    onClick={() => chooseBackground(name)}
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
                  <section className="required-choice-panel background-boosts"><header><div><p>REQUIRED BACKGROUND CHOICE</p><h3>Ability increases</h3></div><strong>+3 total</strong></header><span>The background adds +2 to one eligible ability and +1 to a different eligible ability. These are applied when you save.</span><div className="background-ability-selects"><label><span>Increase by +2</span><select value={backgroundPrimary} onChange={(event) => setBackgroundPrimary(event.target.value)}>{BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS].abilities.split(", ").map((ability) => <option key={ability} disabled={ability === backgroundSecondary}>{ability}</option>)}</select></label><label><span>Increase by +1</span><select value={backgroundSecondary} onChange={(event) => setBackgroundSecondary(event.target.value)}>{BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS].abilities.split(", ").map((ability) => <option key={ability} disabled={ability === backgroundPrimary}>{ability}</option>)}</select></label></div><div className="benefit-preview"><b>Applied benefits</b><span>{backgroundPrimary} +2 · {backgroundSecondary} +1</span><span>Skills: {BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS].skills} (each gains +{Math.ceil(draft.level / 4) + 1} proficiency)</span><span>Feat: {BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS].feat}</span><span>Tool: {BACKGROUNDS[draft.background as keyof typeof BACKGROUNDS].tool}</span></div></section>
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
                    onClick={() => chooseSpecies(name)}
                  >
                    <b>{name.slice(0, 1)}</b>
                    <strong>{name}</strong>
                    <small>{data.summary}</small>
                  </button>
                ))}
              </div>
              {selectedSpecies && (
                <div className="selection-detail">
                  <h3>{draft.ancestry} Traits</h3>
                  <p>
                    {selectedSpecies.summary}
                  </p>
                  {selectedSpecies.traits.map(
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
                  <div className="species-required-choices">
                    <h4>Required species choices</h4>
                    {selectedSpecies.sizeOptions.length > 1 && <label className="builder-select"><span>Size</span><select value={speciesSize} onChange={(event) => setSpeciesSize(event.target.value)}>{selectedSpecies.sizeOptions.map((size) => <option key={size}>{size}</option>)}</select></label>}
                    {selectedSpecies.lineages?.length && <label className="builder-select"><span>Lineage / ancestry</span><select value={speciesLineage} onChange={(event) => setSpeciesLineage(event.target.value)}>{selectedSpecies.lineages.map((lineage) => <option key={lineage.name} value={lineage.name}>{lineage.name} — {lineage.benefit}</option>)}</select></label>}
                    {selectedSpecies.skillChoices?.length && <label className="builder-select"><span>Species-granted skill proficiency</span><select value={speciesSkill} onChange={(event) => setSpeciesSkill(event.target.value)}>{selectedSpecies.skillChoices.map((skill) => <option key={skill}>{skill}</option>)}</select><small>{speciesSkill}: ability modifier + proficiency bonus (+{Math.ceil(draft.level / 4) + 1}). This is added to the finished sheet.</small></label>}
                    {selectedSpecies.originFeatChoices?.length && <label className="builder-select"><span>Human Versatile origin feat</span><select value={speciesFeat} onChange={(event) => setSpeciesFeat(event.target.value)}>{selectedSpecies.originFeatChoices.map((feat) => <option key={feat}>{feat}</option>)}</select><small>The selected feat is added under Features & Traits.</small></label>}
                  </div>
                  <div className="species-impact"><h4>Benefits applied to the character</h4><ul><li>Size: {speciesSize}</li><li>Walking speed: {selectedSpecies.lineages?.find((lineage) => lineage.name === speciesLineage)?.speed ?? selectedSpecies.speed} ft</li>{selectedSpecies.darkvision ? <li>Darkvision: {selectedSpecies.darkvision} ft</li> : null}{selectedSpecies.resistances?.map((value) => <li key={value}>Damage resistance: {value}</li>)}{selectedSpecies.lineages?.find((lineage) => lineage.name === speciesLineage)?.resistance && <li>Damage resistance: {selectedSpecies.lineages.find((lineage) => lineage.name === speciesLineage)?.resistance}</li>}{selectedSpecies.conditionAdvantages?.map((value) => <li key={value}>Advantage: {value}</li>)}{selectedSpecies.carryingMultiplier && selectedSpecies.carryingMultiplier > 1 ? <li>Carrying capacity multiplier: ×{selectedSpecies.carryingMultiplier}</li> : null}{selectedSpecies.longRestHours ? <li>Long Rest duration: {selectedSpecies.longRestHours} hours</li> : null}{selectedSpecies.resource && <li>{selectedSpecies.resource.name}: {selectedSpecies.resource.max === "proficiency" ? Math.ceil(draft.level / 4) + 1 : selectedSpecies.resource.max} uses, {selectedSpecies.resource.activation}, restores on {selectedSpecies.resource.resetsOn} rest</li>}{[...(selectedSpecies.fixedSpells ?? []), ...(selectedSpecies.lineages?.find((lineage) => lineage.name === speciesLineage)?.spells ?? [])].map((spell) => <li key={`${spell.name}-${spell.requiredLevel}`}>{spell.requiredLevel <= draft.level ? "Granted" : `Unlocks at level ${spell.requiredLevel}`}: {spell.name}</li>)}</ul><p>Saving the builder writes every listed benefit into Core statistics, Features, Spells, defenses, and Resource Counters where relevant.</p></div>
                  <p className="rules-note">In the 2024 rules, species traits normally do not add fixed ability-score bonuses. Your background supplies skills and eligible ability choices; species supplies speed, senses, resistances, and other traits shown above.</p>
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
                {(["standard", "roll", "d20", "point"] as const).map((method) => (
                  <button
                    className={scoreMethod === method ? "active" : ""}
                    key={method}
                    onClick={() => {
                      setScoreMethod(method);
                      if (method === "standard") assign(STANDARD_ARRAY);
                      if (method === "roll") assign(rollAbilitySet());
                      if (method === "d20") assign(Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 1));
                      if (method === "point") assign([8, 8, 8, 8, 8, 8]);
                    }}
                  >
                    {method === "standard"
                      ? "Standard Array"
                      : method === "roll"
                        ? "Roll 4d6"
                        : method === "d20"
                          ? "Roll 1d20 Each"
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
                      <div className="ability-roll-input"><input
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
                      />{scoreMethod === "d20" && <button type="button" onClick={() => setDraft((current) => ({ ...current, abilities: { ...current.abilities, [ability.key]: Math.floor(Math.random() * 20) + 1 } }))}>Roll d20</button>}</div>
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
