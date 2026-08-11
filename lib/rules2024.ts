export type ClassFeature = { level: number; name: string; track?: boolean };
export type ClassRule = {
  hitDie: number;
  primary: string;
  subclasses: string[];
  features: ClassFeature[];
};

const commonAsi = [4, 8, 12, 16].map((level) => ({ level, name: "Ability Score Improvement" }));

export const CLASS_RULES: Record<string, ClassRule> = {
  Barbarian: { hitDie: 12, primary: "Strength", subclasses: ["Path of the Berserker", "Path of the Wild Heart", "Path of the World Tree", "Path of the Zealot"], features: [
    { level: 1, name: "Rage", track: true }, { level: 1, name: "Unarmored Defense" }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Danger Sense" }, { level: 2, name: "Reckless Attack" }, { level: 3, name: "Primal Knowledge" }, { level: 3, name: "Barbarian Subclass" }, { level: 5, name: "Extra Attack" }, { level: 5, name: "Fast Movement" }, { level: 7, name: "Feral Instinct" }, { level: 7, name: "Instinctive Pounce" }, { level: 9, name: "Brutal Strike" }, { level: 11, name: "Relentless Rage" }, { level: 13, name: "Improved Brutal Strike" }, { level: 15, name: "Persistent Rage" }, { level: 18, name: "Indomitable Might" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Primal Champion" }, ...commonAsi,
  ]},
  Bard: { hitDie: 8, primary: "Charisma", subclasses: ["College of Dance", "College of Glamour", "College of Lore", "College of Valor"], features: [
    { level: 1, name: "Bardic Inspiration", track: true }, { level: 1, name: "Spellcasting" }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Expertise" }, { level: 2, name: "Jack of All Trades" }, { level: 3, name: "Bard Subclass" }, { level: 5, name: "Font of Inspiration" }, { level: 7, name: "Countercharm" }, { level: 10, name: "Magical Secrets" }, { level: 18, name: "Superior Inspiration" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Words of Creation" }, ...commonAsi,
  ]},
  Cleric: { hitDie: 8, primary: "Wisdom", subclasses: ["Life Domain", "Light Domain", "Trickery Domain", "War Domain"], features: [
    { level: 1, name: "Divine Order" }, { level: 1, name: "Spellcasting" }, { level: 2, name: "Channel Divinity", track: true }, { level: 3, name: "Cleric Subclass" }, { level: 5, name: "Sear Undead" }, { level: 7, name: "Blessed Strikes" }, { level: 10, name: "Divine Intervention", track: true }, { level: 14, name: "Improved Blessed Strikes" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Greater Divine Intervention", track: true }, ...commonAsi,
  ]},
  Druid: { hitDie: 8, primary: "Wisdom", subclasses: ["Circle of the Land", "Circle of the Moon", "Circle of the Sea", "Circle of the Stars"], features: [
    { level: 1, name: "Druidic" }, { level: 1, name: "Primal Order" }, { level: 1, name: "Spellcasting" }, { level: 2, name: "Wild Shape", track: true }, { level: 2, name: "Wild Companion" }, { level: 3, name: "Druid Subclass" }, { level: 5, name: "Wild Resurgence" }, { level: 7, name: "Elemental Fury" }, { level: 15, name: "Improved Elemental Fury" }, { level: 18, name: "Beast Spells" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Archdruid" }, ...commonAsi,
  ]},
  Fighter: { hitDie: 10, primary: "Strength or Dexterity", subclasses: ["Battle Master", "Champion", "Eldritch Knight", "Psi Warrior"], features: [
    { level: 1, name: "Fighting Style" }, { level: 1, name: "Second Wind", track: true }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Action Surge", track: true }, { level: 2, name: "Tactical Mind" }, { level: 3, name: "Fighter Subclass" }, { level: 5, name: "Extra Attack" }, { level: 5, name: "Tactical Shift" }, { level: 9, name: "Indomitable", track: true }, { level: 9, name: "Tactical Master" }, { level: 11, name: "Two Extra Attacks" }, { level: 13, name: "Studied Attacks" }, { level: 17, name: "Second Action Surge" }, { level: 20, name: "Three Extra Attacks" }, { level: 19, name: "Epic Boon" }, ...commonAsi, { level: 6, name: "Ability Score Improvement" }, { level: 14, name: "Ability Score Improvement" },
  ]},
  Monk: { hitDie: 8, primary: "Dexterity and Wisdom", subclasses: ["Warrior of Mercy", "Warrior of the Elements", "Warrior of the Open Hand", "Warrior of Shadow"], features: [
    { level: 1, name: "Martial Arts" }, { level: 1, name: "Unarmored Defense" }, { level: 2, name: "Monk's Focus", track: true }, { level: 2, name: "Unarmored Movement" }, { level: 2, name: "Uncanny Metabolism", track: true }, { level: 3, name: "Deflect Attacks" }, { level: 3, name: "Monk Subclass" }, { level: 4, name: "Slow Fall" }, { level: 5, name: "Extra Attack" }, { level: 5, name: "Stunning Strike", track: true }, { level: 6, name: "Empowered Strikes" }, { level: 7, name: "Evasion" }, { level: 9, name: "Acrobatic Movement" }, { level: 10, name: "Heightened Focus" }, { level: 13, name: "Deflect Energy" }, { level: 14, name: "Disciplined Survivor" }, { level: 15, name: "Perfect Focus" }, { level: 18, name: "Superior Defense", track: true }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Body and Mind" }, ...commonAsi,
  ]},
  Paladin: { hitDie: 10, primary: "Strength and Charisma", subclasses: ["Oath of the Ancients", "Oath of Devotion", "Oath of Glory", "Oath of Vengeance"], features: [
    { level: 1, name: "Lay on Hands", track: true }, { level: 1, name: "Spellcasting" }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Fighting Style" }, { level: 2, name: "Paladin's Smite" }, { level: 3, name: "Channel Divinity", track: true }, { level: 3, name: "Paladin Subclass" }, { level: 5, name: "Extra Attack" }, { level: 5, name: "Faithful Steed", track: true }, { level: 6, name: "Aura of Protection" }, { level: 9, name: "Abjure Foes" }, { level: 10, name: "Aura of Courage" }, { level: 11, name: "Radiant Strikes" }, { level: 14, name: "Restoring Touch" }, { level: 18, name: "Aura Expansion" }, { level: 19, name: "Epic Boon" }, ...commonAsi,
  ]},
  Ranger: { hitDie: 10, primary: "Dexterity and Wisdom", subclasses: ["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"], features: [
    { level: 1, name: "Favored Enemy" }, { level: 1, name: "Spellcasting" }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Deft Explorer" }, { level: 2, name: "Fighting Style" }, { level: 3, name: "Ranger Subclass" }, { level: 5, name: "Extra Attack" }, { level: 6, name: "Roving" }, { level: 9, name: "Expertise" }, { level: 10, name: "Tireless", track: true }, { level: 13, name: "Relentless Hunter" }, { level: 14, name: "Nature's Veil", track: true }, { level: 17, name: "Precise Hunter" }, { level: 18, name: "Feral Senses" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Foe Slayer" }, ...commonAsi,
  ]},
  Rogue: { hitDie: 8, primary: "Dexterity", subclasses: ["Arcane Trickster", "Assassin", "Soulknife", "Thief"], features: [
    { level: 1, name: "Expertise" }, { level: 1, name: "Sneak Attack" }, { level: 1, name: "Thieves' Cant" }, { level: 1, name: "Weapon Mastery" }, { level: 2, name: "Cunning Action" }, { level: 3, name: "Rogue Subclass" }, { level: 3, name: "Steady Aim" }, { level: 5, name: "Cunning Strike" }, { level: 5, name: "Uncanny Dodge" }, { level: 7, name: "Evasion" }, { level: 7, name: "Reliable Talent" }, { level: 11, name: "Improved Cunning Strike" }, { level: 14, name: "Devious Strikes" }, { level: 15, name: "Slippery Mind" }, { level: 18, name: "Elusive" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Stroke of Luck", track: true }, ...commonAsi, { level: 10, name: "Ability Score Improvement" },
  ]},
  Sorcerer: { hitDie: 6, primary: "Charisma", subclasses: ["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"], features: [
    { level: 1, name: "Innate Sorcery", track: true }, { level: 1, name: "Spellcasting" }, { level: 2, name: "Font of Magic", track: true }, { level: 2, name: "Metamagic" }, { level: 3, name: "Sorcerer Subclass" }, { level: 5, name: "Sorcerous Restoration" }, { level: 7, name: "Sorcery Incarnate" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Arcane Apotheosis" }, ...commonAsi,
  ]},
  Warlock: { hitDie: 8, primary: "Charisma", subclasses: ["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"], features: [
    { level: 1, name: "Eldritch Invocations" }, { level: 1, name: "Pact Magic" }, { level: 2, name: "Magical Cunning", track: true }, { level: 3, name: "Warlock Subclass" }, { level: 9, name: "Contact Patron", track: true }, { level: 11, name: "Mystic Arcanum (Level 6)", track: true }, { level: 13, name: "Mystic Arcanum (Level 7)", track: true }, { level: 15, name: "Mystic Arcanum (Level 8)", track: true }, { level: 17, name: "Mystic Arcanum (Level 9)", track: true }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Eldritch Master", track: true }, ...commonAsi,
  ]},
  Wizard: { hitDie: 6, primary: "Intelligence", subclasses: ["Abjurer", "Diviner", "Evoker", "Illusionist"], features: [
    { level: 1, name: "Arcane Recovery", track: true }, { level: 1, name: "Ritual Adept" }, { level: 1, name: "Spellcasting" }, { level: 2, name: "Scholar" }, { level: 3, name: "Wizard Subclass" }, { level: 5, name: "Memorize Spell", track: true }, { level: 18, name: "Spell Mastery" }, { level: 19, name: "Epic Boon" }, { level: 20, name: "Signature Spells", track: true }, ...commonAsi,
  ]},
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function attacksPerAction(className: string, level: number) {
  if (className === "Fighter") return level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  return ["Barbarian", "Monk", "Paladin", "Ranger"].includes(className) && level >= 5 ? 2 : 1;
}

export function rollAbilitySet() {
  return Array.from({ length: 6 }, () => {
    const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
    return dice.slice(0, 3).reduce((sum, die) => sum + die, 0);
  });
}

export const ITEM_CATALOG = [
  ["Club", 2, "1 SP"], ["Dagger", 1, "2 GP"], ["Greatclub", 10, "2 SP"], ["Handaxe", 2, "5 GP"], ["Javelin", 2, "5 SP"], ["Light Hammer", 2, "2 GP"], ["Mace", 4, "5 GP"], ["Quarterstaff", 4, "2 SP"], ["Sickle", 2, "1 GP"], ["Spear", 3, "1 GP"],
  ["Battleaxe", 4, "10 GP"], ["Flail", 2, "10 GP"], ["Glaive", 6, "20 GP"], ["Greataxe", 7, "30 GP"], ["Greatsword", 6, "50 GP"], ["Halberd", 6, "20 GP"], ["Lance", 6, "10 GP"], ["Longsword", 3, "15 GP"], ["Maul", 10, "10 GP"], ["Morningstar", 4, "15 GP"], ["Pike", 18, "5 GP"], ["Rapier", 2, "25 GP"], ["Scimitar", 3, "25 GP"], ["Shortsword", 2, "10 GP"], ["Trident", 4, "5 GP"], ["War Pick", 2, "5 GP"], ["Warhammer", 5, "15 GP"], ["Whip", 3, "2 GP"],
  ["Light Crossbow", 5, "25 GP"], ["Dart", 0.25, "5 CP"], ["Shortbow", 2, "25 GP"], ["Sling", 0, "1 SP"], ["Blowgun", 1, "10 GP"], ["Hand Crossbow", 3, "75 GP"], ["Heavy Crossbow", 18, "50 GP"], ["Longbow", 2, "50 GP"], ["Musket", 10, "500 GP"], ["Pistol", 3, "250 GP"],
  ["Leather Armor", 10, "10 GP"], ["Studded Leather Armor", 13, "45 GP"], ["Chain Shirt", 20, "50 GP"], ["Scale Mail", 45, "50 GP"], ["Breastplate", 20, "400 GP"], ["Half Plate Armor", 40, "750 GP"], ["Chain Mail", 55, "75 GP"], ["Plate Armor", 65, "1,500 GP"], ["Shield", 6, "10 GP"],
  ["Backpack", 5, "2 GP"], ["Bedroll", 7, "1 GP"], ["Blanket", 3, "5 SP"], ["Crowbar", 5, "2 GP"], ["Grappling Hook", 4, "2 GP"], ["Healer's Kit", 3, "5 GP"], ["Lantern", 2, "5 GP"], ["Rations (1 day)", 2, "5 SP"], ["Rope (50 feet)", 5, "1 GP"], ["Tinderbox", 1, "5 SP"], ["Torch", 1, "1 CP"], ["Waterskin", 5, "2 SP"],
].map(([name, weight, cost]) => ({ name: String(name), weight: Number(weight), cost: String(cost) }));
