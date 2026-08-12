export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  Rage: "Enter a battle fury as a Bonus Action. While raging, your martial attacks and resilience improve; mark its use and restore it according to your class table.",
  "Unarmored Defense": "When you are not wearing armor, calculate AC using the ability scores specified by your class.",
  "Weapon Mastery": "Choose weapons whose mastery properties you can use when attacking with them.",
  "Danger Sense": "Your instincts help you avoid sudden hazards and certain Dexterity-save effects.",
  "Reckless Attack": "Trade defense for aggression: gain an offensive advantage while making yourself easier to hit until your next turn.",
  Spellcasting: "Prepare or learn spells, expend spell slots to cast leveled spells, and use your class spellcasting ability for attacks and save DCs.",
  "Bardic Inspiration": "Give an ally an inspiration die that can improve an important d20 test. Uses are tracked as a class resource.",
  Expertise: "Double your proficiency bonus for selected proficient skills.",
  "Jack of All Trades": "Add part of your proficiency bonus to eligible ability checks that do not already include it.",
  "Channel Divinity": "Spend a tracked divine resource to activate one of your class or subclass divine options.",
  "Wild Shape": "Spend a tracked use to assume an alternate form defined by your druid options.",
  "Fighting Style": "Choose a martial specialty that changes how you use weapons, armor, or protection.",
  "Second Wind": "Use a Bonus Action to recover hit points. Its uses appear in Resource Counters.",
  "Action Surge": "Take an additional action on your turn, subject to the feature's restrictions.",
  "Extra Attack": "Attack more than once when you take the Attack action. The Actions tab calculates your attacks per action.",
  Indomitable: "Reroll a failed saving throw by spending a tracked use.",
  "Martial Arts": "Use your martial-arts die and Dexterity with eligible unarmed strikes and monk weapons.",
  "Monk's Focus": "Spend Focus Points on monk techniques. The counter restores according to the feature's rest rules.",
  "Unarmored Movement": "Your speed increases while you meet the class's armor and shield requirements.",
  "Deflect Attacks": "Use your Reaction to reduce eligible incoming attack damage and potentially redirect it.",
  "Lay on Hands": "Spend points from a healing pool to restore hit points or apply its other listed benefits.",
  "Paladin's Smite": "Prepare the class's smite option and expend the required resource after a qualifying hit.",
  "Aura of Protection": "You and nearby allies add your Charisma modifier to eligible saving throws while conscious.",
  "Favored Enemy": "Gain the class's hunter-focused spell or benefits without consuming your normal preparation allowance where specified.",
  "Sneak Attack": "Once per turn, deal extra damage when an eligible finesse or ranged attack meets the feature's conditions.",
  "Cunning Action": "Take Dash, Disengage, or Hide as a Bonus Action.",
  "Uncanny Dodge": "Use your Reaction to reduce damage from a qualifying attack you can see.",
  Evasion: "Improve the result of certain Dexterity saves, often taking no damage on a success and reduced damage on a failure.",
  "Innate Sorcery": "Spend a tracked use to intensify your sorcerous magic for a limited duration.",
  "Font of Magic": "Use Sorcery Points to create spell slots or fuel other sorcerer features.",
  Metamagic: "Choose ways to modify spells by spending Sorcery Points.",
  "Eldritch Invocations": "Choose modular warlock benefits; some grant spells while others alter attacks or pact features.",
  "Pact Magic": "Cast warlock spells using pact slots, which normally recover on a Short or Long Rest.",
  "Arcane Recovery": "After a Short Rest, recover a limited amount of expended spell-slot power.",
  "Ritual Adept": "Cast eligible ritual spells as rituals without expending a spell slot.",
  "Ability Score Improvement": "Choose either +2 to one ability, +1 to two different abilities, or an eligible feat during level-up.",
};

export function featureDescription(name: string, track = false) {
  return FEATURE_DESCRIPTIONS[name] ?? `${name} is a ${track ? "limited-use" : "passive or situational"} class feature. Open your class progression to record its choices and consult the rules source selected for this character.`;
}

export type SpellInfo = { level: number; school: string; castingTime: string; range: string; duration: string; concentration?: boolean; summary: string };
export const SPELL_DETAILS: Record<string, SpellInfo> = {
  "Dancing Lights": { level: 0, school: "Illusion", castingTime: "Action", range: "120 ft", duration: "1 minute", concentration: true, summary: "Create movable magical lights that illuminate nearby areas." },
  "Vicious Mockery": { level: 0, school: "Enchantment", castingTime: "Action", range: "60 ft", duration: "Instant", summary: "A target makes a Wisdom save or takes psychic damage and suffers a brief offensive penalty." },
  "Charm Person": { level: 1, school: "Enchantment", castingTime: "Action", range: "30 ft", duration: "1 hour", summary: "Attempt to charm a humanoid that fails its saving throw." },
  "Cure Wounds": { level: 1, school: "Abjuration", castingTime: "Action", range: "Touch", duration: "Instant", summary: "Restore hit points to a creature you touch; higher slots increase healing." },
  "Dissonant Whispers": { level: 1, school: "Enchantment", castingTime: "Action", range: "60 ft", duration: "Instant", summary: "Inflict psychic damage and potentially force movement after a failed Wisdom save." },
  "Healing Word": { level: 1, school: "Abjuration", castingTime: "Bonus Action", range: "60 ft", duration: "Instant", summary: "Quickly restore a smaller amount of hit points at range." },
  Guidance: { level: 0, school: "Divination", castingTime: "Action", range: "Touch", duration: "1 minute", concentration: true, summary: "Help a creature improve an eligible ability check." },
  "Sacred Flame": { level: 0, school: "Evocation", castingTime: "Action", range: "60 ft", duration: "Instant", summary: "Radiant fire targets a creature's Dexterity save." },
  Thaumaturgy: { level: 0, school: "Transmutation", castingTime: "Action", range: "30 ft", duration: "Up to 1 minute", summary: "Produce a minor supernatural sign such as an altered voice or harmless tremor." },
  Prestidigitation: { level: 0, school: "Transmutation", castingTime: "Action", range: "10 ft", duration: "Up to 1 hour", summary: "Create one of several harmless minor magical effects." },
  "Minor Illusion": { level: 0, school: "Illusion", castingTime: "Action", range: "30 ft", duration: "1 minute", summary: "Create a brief sound or image that creatures can investigate." },
  "Poison Spray": { level: 0, school: "Necromancy", castingTime: "Action", range: "30 ft", duration: "Instant", summary: "Project poisonous magic at a creature that fails its Constitution save." },
  Darkness: { level: 2, school: "Evocation", castingTime: "Action", range: "60 ft", duration: "10 minutes", concentration: true, summary: "Create an area of magical darkness that blocks ordinary darkvision." },
  "Detect Magic": { level: 1, school: "Divination", castingTime: "Action", range: "Self", duration: "10 minutes", concentration: true, summary: "Sense nearby magic and learn its school when visible." },
  "Misty Step": { level: 2, school: "Conjuration", castingTime: "Bonus Action", range: "Self", duration: "Instant", summary: "Teleport to an unoccupied space you can see." },
  Longstrider: { level: 1, school: "Transmutation", castingTime: "Action", range: "Touch", duration: "1 hour", summary: "Increase a creature's Speed for the duration." },
  "Pass without Trace": { level: 2, school: "Abjuration", castingTime: "Action", range: "Self", duration: "1 hour", concentration: true, summary: "Veil nearby companions to greatly improve their Stealth checks." },
  "Ray of Sickness": { level: 1, school: "Necromancy", castingTime: "Action", range: "60 ft", duration: "Instant", summary: "Make a poisonous spell attack that can Poison its target." },
  "Hold Person": { level: 2, school: "Enchantment", castingTime: "Action", range: "60 ft", duration: "1 minute", concentration: true, summary: "Attempt to Paralyze a humanoid that fails its Wisdom save." },
  "False Life": { level: 1, school: "Necromancy", castingTime: "Action", range: "Self", duration: "Instant", summary: "Fortify yourself with temporary hit points." },
  "Ray of Enfeeblement": { level: 2, school: "Necromancy", castingTime: "Action", range: "60 ft", duration: "1 minute", concentration: true, summary: "Weaken a creature's Strength-based weapon damage." },
  "Hellish Rebuke": { level: 1, school: "Evocation", castingTime: "Reaction", range: "60 ft", duration: "Instant", summary: "Answer damage with supernatural fire against the attacker." },
  Bless: { level: 1, school: "Enchantment", castingTime: "Action", range: "30 ft", duration: "1 minute", concentration: true, summary: "Bolster several creatures' attacks and saving throws." },
  "Guiding Bolt": { level: 1, school: "Evocation", castingTime: "Action", range: "120 ft", duration: "1 round", summary: "Make a radiant spell attack that can help the next attacker." },
  Druidcraft: { level: 0, school: "Transmutation", castingTime: "Action", range: "30 ft", duration: "Instant", summary: "Create a small natural or weather-related magical effect." },
  "Produce Flame": { level: 0, school: "Conjuration", castingTime: "Bonus Action", range: "Self", duration: "10 minutes", summary: "Create a harmless flame that provides light and can be hurled as an attack." },
  Shillelagh: { level: 0, school: "Transmutation", castingTime: "Bonus Action", range: "Self", duration: "1 minute", summary: "Empower a club or quarterstaff using your spellcasting ability." },
  Entangle: { level: 1, school: "Conjuration", castingTime: "Action", range: "90 ft", duration: "1 minute", concentration: true, summary: "Create grasping plants that hinder and may restrain creatures in an area." },
  "Faerie Fire": { level: 1, school: "Evocation", castingTime: "Action", range: "60 ft", duration: "1 minute", concentration: true, summary: "Outline creatures in light, preventing invisibility benefits and aiding attackers." },
  Thunderwave: { level: 1, school: "Evocation", castingTime: "Action", range: "Self", duration: "Instant", summary: "Release a close-range thunderous wave that damages and pushes creatures." },
  "Divine Favor": { level: 1, school: "Transmutation", castingTime: "Bonus Action", range: "Self", duration: "1 minute", summary: "Empower weapon attacks with additional radiant damage." },
  Heroism: { level: 1, school: "Enchantment", castingTime: "Action", range: "Touch", duration: "1 minute", concentration: true, summary: "Protect a willing creature from fear and grant recurring temporary hit points." },
  "Shield of Faith": { level: 1, school: "Abjuration", castingTime: "Bonus Action", range: "60 ft", duration: "10 minutes", concentration: true, summary: "Grant a creature a temporary AC bonus." },
  "Ensnaring Strike": { level: 1, school: "Conjuration", castingTime: "Bonus Action", range: "Self", duration: "1 minute", concentration: true, summary: "Empower a weapon hit to restrain a target with magical vines." },
  "Fog Cloud": { level: 1, school: "Conjuration", castingTime: "Action", range: "120 ft", duration: "1 hour", concentration: true, summary: "Create a heavily obscured sphere of fog." },
  "Hunter's Mark": { level: 1, school: "Divination", castingTime: "Bonus Action", range: "90 ft", duration: "1 hour", concentration: true, summary: "Mark a creature to improve tracking and add damage to qualifying attacks." },
  "Speak with Animals": { level: 1, school: "Divination", castingTime: "Action", range: "Self", duration: "10 minutes", summary: "Understand and verbally communicate with beasts." },
  "Fire Bolt": { level: 0, school: "Evocation", castingTime: "Action", range: "120 ft", duration: "Instant", summary: "Make a ranged spell attack that deals fire damage." },
  Light: { level: 0, school: "Evocation", castingTime: "Action", range: "Touch", duration: "1 hour", summary: "Cause an object to emit bright and dim light." },
  "Mage Hand": { level: 0, school: "Conjuration", castingTime: "Action", range: "30 ft", duration: "1 minute", summary: "Create a spectral hand that manipulates light objects at range." },
  "Ray of Frost": { level: 0, school: "Evocation", castingTime: "Action", range: "60 ft", duration: "Instant", summary: "Make a cold spell attack that damages and briefly slows its target." },
  "Burning Hands": { level: 1, school: "Evocation", castingTime: "Action", range: "Self", duration: "Instant", summary: "Project a cone of flame; targets make Dexterity saves." },
  "Magic Missile": { level: 1, school: "Evocation", castingTime: "Action", range: "120 ft", duration: "Instant", summary: "Create force darts that automatically strike visible targets." },
  Shield: { level: 1, school: "Abjuration", castingTime: "Reaction", range: "Self", duration: "1 round", summary: "React to an attack with a temporary AC increase and protection from force darts." },
  "Eldritch Blast": { level: 0, school: "Evocation", castingTime: "Action", range: "120 ft", duration: "Instant", summary: "Make a ranged spell attack that deals force damage and gains beams at higher levels." },
  "Chill Touch": { level: 0, school: "Necromancy", castingTime: "Action", range: "Touch", duration: "Instant", summary: "A necrotic touch attack that interferes with healing for a short time." },
  "Armor of Agathys": { level: 1, school: "Abjuration", castingTime: "Bonus Action", range: "Self", duration: "1 hour", summary: "Gain temporary hit points that retaliate against close attackers." },
  Hex: { level: 1, school: "Enchantment", castingTime: "Bonus Action", range: "90 ft", duration: "1 hour", concentration: true, summary: "Curse a target to add necrotic damage and hinder one chosen ability." },
  "Shocking Grasp": { level: 0, school: "Evocation", castingTime: "Action", range: "Touch", duration: "Instant", summary: "Make a lightning spell attack that can prevent reactions." },
  "Mage Armor": { level: 1, school: "Abjuration", castingTime: "Action", range: "Touch", duration: "8 hours", summary: "Set an unarmored creature's base Armor Class." },
  Sleep: { level: 1, school: "Enchantment", castingTime: "Action", range: "60 ft", duration: "1 minute", concentration: true, summary: "Attempt to incapacitate creatures in an area with magical sleep." },
};

export function spellInfo(name: string): SpellInfo {
  return SPELL_DETAILS[name] ?? { level: 1, school: "Unknown", castingTime: "Action", range: "See description", duration: "See description", summary: "Custom or imported spell. Add its full rules summary before preparing it." };
}

export function preparedSpellLimit(className: string, level: number, abilityModifier: number) {
  if (!["Bard", "Cleric", "Druid", "Paladin", "Ranger", "Sorcerer", "Warlock", "Wizard"].includes(className)) return 0;
  if (["Paladin", "Ranger"].includes(className)) return Math.max(1, Math.floor(level / 2) + abilityModifier);
  if (["Bard", "Sorcerer", "Warlock"].includes(className)) return Math.max(2, Math.min(15, level + 1));
  return Math.max(1, level + abilityModifier);
}

export function cantripKnownLimit(className: string, level: number) {
  const base: Record<string, number> = { Bard: 2, Cleric: 3, Druid: 2, Sorcerer: 4, Warlock: 2, Wizard: 3 };
  const starting = base[className] ?? 0;
  if (!starting) return 0;
  if (className === "Sorcerer") return starting + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0);
  if (className === "Warlock") return starting + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0);
  return starting + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0);
}
