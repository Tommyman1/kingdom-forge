"use client";

import { useMemo, useState } from "react";
import { CLASS_RULES } from "../lib/rules2024";
import { featureDescription } from "../lib/rulesContent";
import type { AbilityKey, Hero } from "./page";

const abilities: { key: AbilityKey; label: string }[] = [
  { key: "str", label: "Strength" },
  { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" },
  { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" },
  { key: "cha", label: "Charisma" },
];
const XP = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];
const FEATS = [
  ["Alert", "Improve initiative and remain ready for hidden threats."],
  ["Athlete", "Improve physical movement, climbing, and recovery."],
  ["Durable", "Become more resilient when spending Hit Dice."],
  ["Healer", "Restore allies with a healer's kit."],
  ["Lucky", "Gain luck points that can alter important rolls."],
  ["Magic Initiate", "Learn a small selection of spells from another tradition."],
  ["Sentinel", "Control enemies that try to move past you."],
  ["Skilled", "Gain additional skill or tool proficiencies."],
  ["Tough", "Increase your maximum hit points as you level."],
] as const;

export default function LevelUpWizard({
  hero,
  onClose,
  onApply,
}: {
  hero: Hero;
  onClose: () => void;
  onApply: (patch: Partial<Hero>) => void;
}) {
  const nextLevel = Math.min(20, hero.level + 1);
  const [advancementClass, setAdvancementClass] = useState(hero.className);
  const currentClasses = hero.classes?.length ? hero.classes : [{ name: hero.className, level: hero.level, subclass: hero.subclass }];
  const advancementClassLevel = (currentClasses.find((entry) => entry.name === advancementClass)?.level ?? 0) + 1;
  const rule = CLASS_RULES[advancementClass] ?? CLASS_RULES.Fighter;
  const unlocked = useMemo(
    () => rule.features.filter((feature) => feature.level === advancementClassLevel),
    [rule, advancementClassLevel],
  );
  const hasAsi = unlocked.some(
    (feature) => feature.name === "Ability Score Improvement",
  );
  const [method, setMethod] = useState<"milestone" | "xp">(
    hero.advancementMethod ?? "milestone",
  );
  const [hpMethod, setHpMethod] = useState<"average" | "roll">("average");
  const [first, setFirst] = useState<AbilityKey>("str");
  const [second, setSecond] = useState<AbilityKey>("con");
  const [asiMode, setAsiMode] = useState<"two" | "split" | "feat">("split");
  const [feat, setFeat] = useState<string>(FEATS[0][0]);
  const averageHp =
    Math.floor(rule.hitDie / 2) + 1 + Math.floor((hero.abilities.con - 10) / 2);
  function apply() {
    const hpGain = Math.max(
      1,
      hpMethod === "roll"
        ? Math.floor(Math.random() * rule.hitDie) +
            1 +
            Math.floor((hero.abilities.con - 10) / 2)
        : averageHp,
    );
    const nextAbilities = { ...hero.abilities };
    const newTrackedResources = unlocked.filter((feature) => feature.track && !(hero.resources ?? []).some((resource) => resource.name === feature.name)).map((feature, index) => ({ id: Date.now() + index, name: feature.name, current: 1, max: 1, resetsOn: "long" as const }));
    if (hasAsi && asiMode !== "feat") {
      if (asiMode === "two")
        nextAbilities[first] = Math.min(20, nextAbilities[first] + 2);
      else {
        nextAbilities[first] = Math.min(20, nextAbilities[first] + 1);
        nextAbilities[second] = Math.min(20, nextAbilities[second] + 1);
      }
    }
    onApply({
      level: nextLevel,
      advancementMethod: method,
      abilities: nextAbilities,
      maxHp: hero.maxHp + hpGain,
      hp: hero.hp + hpGain,
      maxHitDice: nextLevel,
      hitDice: hero.hitDice + 1,
      xp: method === "xp" ? Math.max(hero.xp, XP[nextLevel - 1]) : hero.xp,
      levelHistory: [
        ...(hero.levelHistory ?? []),
        {
          level: nextLevel,
          date: new Date().toISOString(),
          method,
          hpGain,
          abilityChanges: hasAsi
            ? asiMode === "feat"
              ? `Feat: ${feat}`
              : asiMode === "two"
              ? `${first.toUpperCase()} +2`
              : `${first.toUpperCase()} +1, ${second.toUpperCase()} +1`
            : "None",
        },
      ],
      feats:
        hasAsi && asiMode === "feat"
          ? [
              ...(hero.feats ?? []),
              {
                id: Date.now(),
                name: feat,
                description: FEATS.find((item) => item[0] === feat)?.[1] ?? "",
              },
            ]
          : hero.feats,
      resources: [...(hero.resources ?? []), ...newTrackedResources],
      classes: currentClasses.some((entry) => entry.name === advancementClass)
        ? currentClasses.map((entry) => entry.name === advancementClass ? { ...entry, level: entry.level + 1 } : entry)
        : [...currentClasses, { name: advancementClass, level: 1, subclass: "" }],
    });
  }
  if (hero.level >= 20)
    return (
      <div className="modal-backdrop">
        <section className="level-wizard">
          <header>
            <div>
              <p>LEVEL ADVANCEMENT</p>
              <h2>Maximum level reached</h2>
            </div>
            <button onClick={onClose}>×</button>
          </header>
          <p>This character is already level 20.</p>
        </section>
      </div>
    );
  return (
    <div className="modal-backdrop">
      <section className="level-wizard" role="dialog" aria-modal="true">
        <header>
          <div>
            <p>LEVEL ADVANCEMENT</p>
            <h2>
              Level {hero.level} → {nextLevel}
            </h2>
          </div>
          <button onClick={onClose}>×</button>
        </header>
        <div className="advancement-method">
          <button
            className={method === "milestone" ? "active" : ""}
            onClick={() => setMethod("milestone")}
          >
            <b>◆ Milestone</b>
            <span>Advance when the DM declares a story milestone.</span>
          </button>
          <button
            className={method === "xp" ? "active" : ""}
            onClick={() => setMethod("xp")}
          >
            <b>✦ Experience Points</b>
            <span>
              Advance at {XP[nextLevel - 1].toLocaleString()} total XP.
            </span>
          </button>
        </div>
        <section className="multiclass-picker">
          <h3>Class advancement</h3>
          <p>Continue your current class or add a multiclass level. Total character level remains capped at 20.</p>
          <select value={advancementClass} onChange={(event) => setAdvancementClass(event.target.value)}>
            {Object.keys(CLASS_RULES).map((name) => <option key={name} value={name}>{name} · class level {(currentClasses.find((entry) => entry.name === name)?.level ?? 0) + 1}</option>)}
          </select>
          <small>Kingdom Forge combines total proficiency by character level while tracking each class level separately.</small>
        </section>
        <section>
          <h3>New class features</h3>
          {unlocked.length ? (
            unlocked.map((feature) => (
              <article className="level-feature" key={feature.name}>
                <b>{feature.name}</b>
                <span>
                  {featureDescription(feature.name, feature.track)}
                </span>
              </article>
            ))
          ) : (
            <p className="muted">No new base-class feature at this level.</p>
          )}
        </section>
        <section>
          <h3>Hit Point increase</h3>
          <div className="hp-method">
            <button
              className={hpMethod === "average" ? "active" : ""}
              onClick={() => setHpMethod("average")}
            >
              Take average <b>+{Math.max(1, averageHp)} HP</b>
            </button>
            <button
              className={hpMethod === "roll" ? "active" : ""}
              onClick={() => setHpMethod("roll")}
            >
              Roll 1d{rule.hitDie} <b>+ CON</b>
            </button>
          </div>
        </section>
        {hasAsi && (
          <section className="asi-builder">
            <h3>Ability Score Improvement</h3>
            <p>
              Choose one score to increase by 2, or two scores to increase by 1.
              Scores cannot exceed 20 here.
            </p>
            <div className="asi-modes">
              <button
                className={asiMode === "two" ? "active" : ""}
                onClick={() => setAsiMode("two")}
              >
                +2 to one
              </button>
              <button
                className={asiMode === "split" ? "active" : ""}
                onClick={() => setAsiMode("split")}
              >
                +1 to two
              </button>
              <button
                className={asiMode === "feat" ? "active" : ""}
                onClick={() => setAsiMode("feat")}
              >
                Choose a feat
              </button>
            </div>
            {asiMode === "feat" ? (
              <div className="asi-selects">
                <label>
                  <span>Feat</span>
                  <select value={feat} onChange={(event) => setFeat(event.target.value)}>
                    {FEATS.map(([name, description]) => <option key={name} value={name}>{name} · {description}</option>)}
                  </select>
                </label>
              </div>
            ) : <div className="asi-selects">
              <label>
                <span>
                  {asiMode === "two" ? "Ability +2" : "First ability +1"}
                </span>
                <select
                  value={first}
                  onChange={(event) =>
                    setFirst(event.target.value as AbilityKey)
                  }
                >
                  {abilities.map((ability) => (
                    <option key={ability.key} value={ability.key}>
                      {ability.label} · {hero.abilities[ability.key]} →{" "}
                      {Math.min(
                        20,
                        hero.abilities[ability.key] +
                          (asiMode === "two" ? 2 : 1),
                      )}
                    </option>
                  ))}
                </select>
              </label>
              {asiMode === "split" && (
                <label>
                  <span>Second ability +1</span>
                  <select
                    value={second}
                    onChange={(event) =>
                      setSecond(event.target.value as AbilityKey)
                    }
                  >
                    {abilities.map((ability) => (
                      <option
                        disabled={ability.key === first}
                        key={ability.key}
                        value={ability.key}
                      >
                        {ability.label} · {hero.abilities[ability.key]} →{" "}
                        {Math.min(20, hero.abilities[ability.key] + 1)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>}
          </section>
        )}
        {!hasAsi && <p className="asi-notice">This class level does not grant an Ability Score Improvement. When one is unlocked, this screen shows the +2, +1/+1, and feat controls before you confirm.</p>}
        <footer>
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={apply}>
            Confirm Level {nextLevel}
          </button>
        </footer>
      </section>
    </div>
  );
}
