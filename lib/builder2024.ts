export type BuilderTrait = { name: string; summary: string };
export type SpeciesSpell = { name: string; requiredLevel: number };
export type SpeciesLineage = { name: string; benefit: string; resistance?: string; speed?: number; spells?: SpeciesSpell[] };
export type SpeciesRule = {
  summary: string;
  sizeOptions: string[];
  speed: number;
  darkvision?: number;
  resistances?: string[];
  conditionAdvantages?: string[];
  skillChoices?: string[];
  originFeatChoices?: string[];
  lineages?: SpeciesLineage[];
  fixedSpells?: SpeciesSpell[];
  resource?: { name: string; max: number | "proficiency"; resetsOn: "short" | "long"; activation: string };
  carryingMultiplier?: number;
  longRestHours?: number;
  traits: BuilderTrait[];
};

export const SPECIES: Record<string, SpeciesRule> = {
  Aasimar: {
    summary: "Mortals carrying a spark of the Upper Planes and celestial power.",
    sizeOptions: ["Medium", "Small"], speed: 30, darkvision: 60,
    resistances: ["Necrotic", "Radiant"], fixedSpells: [{ name: "Light", requiredLevel: 1 }],
    resource: { name: "Healing Hands", max: 1, resetsOn: "long", activation: "Magic Action" },
    traits: [
      { name: "Creature Type", summary: "Humanoid" }, { name: "Size", summary: "Medium or Small" },
      { name: "Speed", summary: "30 feet" }, { name: "Darkvision", summary: "See in darkness out to 60 feet." },
      { name: "Celestial Resistance", summary: "Resistance to Necrotic and Radiant damage." },
      { name: "Healing Hands", summary: "Restore hit points with a limited-use Magic Action." },
      { name: "Light Bearer", summary: "Know the Light cantrip." },
      { name: "Celestial Revelation", summary: "From level 3, choose Heavenly Wings, Inner Radiance, or Necrotic Shroud each time you activate the trait; the choice is not permanently locked." },
    ],
  },
  Dragonborn: {
    summary: "Draconic humanoids whose ancestry shapes their breath and resistance.",
    sizeOptions: ["Medium"], speed: 30, darkvision: 60,
    lineages: [
      { name: "Black · Acid", benefit: "Acid breath weapon and Acid resistance.", resistance: "Acid" },
      { name: "Blue · Lightning", benefit: "Lightning breath weapon and Lightning resistance.", resistance: "Lightning" },
      { name: "Brass · Fire", benefit: "Fire breath weapon and Fire resistance.", resistance: "Fire" },
      { name: "Bronze · Lightning", benefit: "Lightning breath weapon and Lightning resistance.", resistance: "Lightning" },
      { name: "Copper · Acid", benefit: "Acid breath weapon and Acid resistance.", resistance: "Acid" },
      { name: "Gold · Fire", benefit: "Fire breath weapon and Fire resistance.", resistance: "Fire" },
      { name: "Green · Poison", benefit: "Poison breath weapon and Poison resistance.", resistance: "Poison" },
      { name: "Red · Fire", benefit: "Fire breath weapon and Fire resistance.", resistance: "Fire" },
      { name: "Silver · Cold", benefit: "Cold breath weapon and Cold resistance.", resistance: "Cold" },
      { name: "White · Cold", benefit: "Cold breath weapon and Cold resistance.", resistance: "Cold" },
    ],
    resource: { name: "Breath Weapon", max: "proficiency", resetsOn: "long", activation: "Replaces one attack" },
    traits: [
      { name: "Creature Type", summary: "Humanoid" }, { name: "Size", summary: "Medium" },
      { name: "Speed", summary: "30 feet" }, { name: "Darkvision", summary: "See in darkness out to 60 feet." },
      { name: "Draconic Ancestry", summary: "Choose a dragon type that determines breath damage and resistance." },
      { name: "Breath Weapon", summary: "Replace an attack with an exhalation whose shape and damage scale with level." },
      { name: "Damage Resistance", summary: "Resist the damage type selected by Draconic Ancestry." },
      { name: "Draconic Flight", summary: "At level 5, temporarily manifest spectral wings." },
    ],
  },
  Human: {
    summary: "Versatile and resourceful people found across many worlds.",
    sizeOptions: ["Medium", "Small"], speed: 30,
    skillChoices: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"],
    originFeatChoices: ["Alert", "Crafter", "Healer", "Lucky", "Magic Initiate", "Musician", "Savage Attacker", "Skilled", "Tavern Brawler", "Tough"],
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium or Small" },
      { name: "Speed", summary: "30 feet" },
      {
        name: "Resourceful",
        summary: "Gain Heroic Inspiration after a Long Rest.",
      },
      {
        name: "Skillful",
        summary: "Gain proficiency in one skill of your choice.",
      },
      { name: "Versatile", summary: "Gain an Origin feat of your choice." },
    ],
  },
  Dwarf: {
    summary: "Sturdy folk shaped by stone, craft, and deep traditions.",
    sizeOptions: ["Medium"], speed: 30, darkvision: 120,
    resistances: ["Poison"], conditionAdvantages: ["Saving throws to avoid or end Poisoned"],
    resource: { name: "Stonecunning", max: "proficiency", resetsOn: "long", activation: "Bonus Action" },
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium" },
      { name: "Speed", summary: "30 feet" },
      { name: "Darkvision", summary: "See in darkness out to 120 feet." },
      {
        name: "Dwarven Resilience",
        summary: "Resistance and resilience against poison.",
      },
      {
        name: "Stonecunning",
        summary: "Heightened awareness while touching stone.",
      },
    ],
  },
  Elf: {
    summary: "Long-lived people touched by magic and otherworldly realms.",
    sizeOptions: ["Medium"], speed: 30, darkvision: 60, longRestHours: 4,
    conditionAdvantages: ["Saving throws to avoid or end Charmed"],
    skillChoices: ["Insight", "Perception", "Survival"],
    lineages: [
      { name: "Drow", benefit: "Superior darkvision and drow magic.", spells: [{ name: "Dancing Lights", requiredLevel: 1 }, { name: "Faerie Fire", requiredLevel: 3 }, { name: "Darkness", requiredLevel: 5 }] },
      { name: "High Elf", benefit: "Arcane lineage magic and a flexible wizard cantrip.", spells: [{ name: "Prestidigitation", requiredLevel: 1 }, { name: "Detect Magic", requiredLevel: 3 }, { name: "Misty Step", requiredLevel: 5 }] },
      { name: "Wood Elf", benefit: "Fleet movement and woodland magic.", speed: 35, spells: [{ name: "Druidcraft", requiredLevel: 1 }, { name: "Longstrider", requiredLevel: 3 }, { name: "Pass without Trace", requiredLevel: 5 }] },
    ],
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium" },
      { name: "Speed", summary: "30 feet" },
      { name: "Darkvision", summary: "See in darkness out to 60 feet." },
      { name: "Elven Lineage", summary: "Choose a magical elven lineage." },
      { name: "Fey Ancestry", summary: "Advantage against being Charmed." },
      {
        name: "Keen Senses",
        summary: "Proficiency in Insight, Perception, or Survival.",
      },
      { name: "Trance", summary: "Complete a Long Rest in four hours." },
    ],
  },
  Gnome: {
    summary: "Clever magical folk with remarkable curiosity.",
    sizeOptions: ["Small"], speed: 30, darkvision: 60,
    conditionAdvantages: ["Intelligence, Wisdom, and Charisma saves against magic"],
    lineages: [
      { name: "Forest Gnome", benefit: "Natural illusion magic and communication with small beasts.", spells: [{ name: "Minor Illusion", requiredLevel: 1 }, { name: "Speak with Animals", requiredLevel: 1 }] },
      { name: "Rock Gnome", benefit: "Create small magical devices through Gnomish devices." },
    ],
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Small" },
      { name: "Speed", summary: "30 feet" },
      { name: "Darkvision", summary: "See in darkness out to 60 feet." },
      {
        name: "Gnomish Cunning",
        summary: "Advantage on certain mental saving throws.",
      },
      {
        name: "Gnomish Lineage",
        summary: "Choose Forest Gnome or Rock Gnome magic.",
      },
    ],
  },
  Goliath: {
    summary: "Powerful descendants of giants with supernatural gifts.",
    sizeOptions: ["Medium"], speed: 35, carryingMultiplier: 2,
    lineages: [
      { name: "Cloud's Jaunt", benefit: "Teleport a short distance as a Bonus Action." },
      { name: "Fire's Burn", benefit: "Deal additional fire damage after a hit." },
      { name: "Frost's Chill", benefit: "Deal additional cold damage and slow a target." },
      { name: "Hill's Tumble", benefit: "Knock a qualifying target Prone after a hit." },
      { name: "Stone's Endurance", benefit: "Use a Reaction to reduce incoming damage." },
      { name: "Storm's Thunder", benefit: "Use a Reaction to deal thunder damage to an attacker." },
    ],
    resource: { name: "Giant Ancestry", max: "proficiency", resetsOn: "long", activation: "Varies by ancestry" },
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium" },
      { name: "Speed", summary: "35 feet" },
      { name: "Giant Ancestry", summary: "Choose a supernatural giant gift." },
      { name: "Large Form", summary: "Temporarily grow at higher levels." },
      {
        name: "Powerful Build",
        summary: "Improved carrying capacity and grappling.",
      },
    ],
  },
  Halfling: {
    summary: "Small, brave, and remarkably fortunate adventurers.",
    sizeOptions: ["Small"], speed: 30,
    conditionAdvantages: ["Saving throws to avoid or end Frightened"],
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Small" },
      { name: "Speed", summary: "30 feet" },
      { name: "Brave", summary: "Advantage against the Frightened condition." },
      {
        name: "Halfling Nimbleness",
        summary: "Move through spaces occupied by larger creatures.",
      },
      { name: "Luck", summary: "Reroll a natural 1 on a d20 test." },
    ],
  },
  Orc: {
    summary: "Strong and relentless people gifted with enduring vitality.",
    sizeOptions: ["Medium"], speed: 30, darkvision: 120, carryingMultiplier: 2,
    resource: { name: "Adrenaline Rush", max: "proficiency", resetsOn: "short", activation: "Bonus Action" },
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium" },
      { name: "Speed", summary: "30 feet" },
      {
        name: "Adrenaline Rush",
        summary: "Dash as a Bonus Action and gain temporary HP.",
      },
      { name: "Darkvision", summary: "See in darkness out to 120 feet." },
      {
        name: "Relentless Endurance",
        summary: "Drop to 1 HP instead of 0 once per Long Rest.",
      },
    ],
  },
  Tiefling: {
    summary: "People bearing a supernatural legacy from the Lower Planes.",
    sizeOptions: ["Medium", "Small"], speed: 30, darkvision: 60,
    fixedSpells: [{ name: "Thaumaturgy", requiredLevel: 1 }],
    lineages: [
      { name: "Abyssal", benefit: "Resist poison and gain abyssal innate magic.", resistance: "Poison", spells: [{ name: "Poison Spray", requiredLevel: 1 }, { name: "Ray of Sickness", requiredLevel: 3 }, { name: "Hold Person", requiredLevel: 5 }] },
      { name: "Chthonic", benefit: "Resist necrotic damage and gain chthonic innate magic.", resistance: "Necrotic", spells: [{ name: "Chill Touch", requiredLevel: 1 }, { name: "False Life", requiredLevel: 3 }, { name: "Ray of Enfeeblement", requiredLevel: 5 }] },
      { name: "Infernal", benefit: "Resist fire damage and gain infernal innate magic.", resistance: "Fire", spells: [{ name: "Fire Bolt", requiredLevel: 1 }, { name: "Hellish Rebuke", requiredLevel: 3 }, { name: "Darkness", requiredLevel: 5 }] },
    ],
    traits: [
      { name: "Creature Type", summary: "Humanoid" },
      { name: "Size", summary: "Medium or Small" },
      { name: "Speed", summary: "30 feet" },
      { name: "Darkvision", summary: "See in darkness out to 60 feet." },
      {
        name: "Fiendish Legacy",
        summary: "Choose an Abyssal, Chthonic, or Infernal legacy.",
      },
      {
        name: "Otherworldly Presence",
        summary: "Know the Thaumaturgy cantrip.",
      },
    ],
  },
};

export const BACKGROUNDS = {
  Acolyte: {
    abilities: "Intelligence, Wisdom, Charisma",
    feat: "Magic Initiate (Cleric)",
    skills: "Insight, Religion",
    tool: "Calligrapher's Supplies",
  },
  Artisan: {
    abilities: "Strength, Dexterity, Intelligence",
    feat: "Crafter",
    skills: "Investigation, Persuasion",
    tool: "One Artisan's Tool",
  },
  Charlatan: {
    abilities: "Dexterity, Constitution, Charisma",
    feat: "Skilled",
    skills: "Deception, Sleight of Hand",
    tool: "Forgery Kit",
  },
  Criminal: {
    abilities: "Dexterity, Constitution, Intelligence",
    feat: "Alert",
    skills: "Sleight of Hand, Stealth",
    tool: "Thieves' Tools",
  },
  Entertainer: {
    abilities: "Strength, Dexterity, Charisma",
    feat: "Musician",
    skills: "Acrobatics, Performance",
    tool: "One Musical Instrument",
  },
  Farmer: {
    abilities: "Strength, Constitution, Wisdom",
    feat: "Tough",
    skills: "Animal Handling, Nature",
    tool: "Carpenter's Tools",
  },
  Guard: {
    abilities: "Strength, Intelligence, Wisdom",
    feat: "Alert",
    skills: "Athletics, Perception",
    tool: "One Gaming Set",
  },
  Guide: {
    abilities: "Dexterity, Constitution, Wisdom",
    feat: "Magic Initiate (Druid)",
    skills: "Stealth, Survival",
    tool: "Cartographer's Tools",
  },
  Hermit: {
    abilities: "Constitution, Wisdom, Charisma",
    feat: "Healer",
    skills: "Medicine, Religion",
    tool: "Herbalism Kit",
  },
  Merchant: {
    abilities: "Constitution, Intelligence, Charisma",
    feat: "Lucky",
    skills: "Animal Handling, Persuasion",
    tool: "Navigator's Tools",
  },
  Noble: {
    abilities: "Strength, Intelligence, Charisma",
    feat: "Skilled",
    skills: "History, Persuasion",
    tool: "One Gaming Set",
  },
  Sage: {
    abilities: "Constitution, Intelligence, Wisdom",
    feat: "Magic Initiate (Wizard)",
    skills: "Arcana, History",
    tool: "Calligrapher's Supplies",
  },
  Sailor: {
    abilities: "Strength, Dexterity, Wisdom",
    feat: "Tavern Brawler",
    skills: "Acrobatics, Perception",
    tool: "Navigator's Tools",
  },
  Scribe: {
    abilities: "Dexterity, Intelligence, Wisdom",
    feat: "Skilled",
    skills: "Investigation, Perception",
    tool: "Calligrapher's Supplies",
  },
  Soldier: {
    abilities: "Strength, Dexterity, Constitution",
    feat: "Savage Attacker",
    skills: "Athletics, Intimidation",
    tool: "One Gaming Set",
  },
  Wayfarer: {
    abilities: "Dexterity, Wisdom, Charisma",
    feat: "Lucky",
    skills: "Insight, Stealth",
    tool: "Thieves' Tools",
  },
} as const;

export const STARTER_SPELLS = {
  Bard: [
    "Dancing Lights",
    "Vicious Mockery",
    "Charm Person",
    "Cure Wounds",
    "Dissonant Whispers",
    "Healing Word",
  ],
  Cleric: [
    "Guidance",
    "Sacred Flame",
    "Thaumaturgy",
    "Bless",
    "Cure Wounds",
    "Guiding Bolt",
    "Healing Word",
  ],
  Druid: [
    "Druidcraft",
    "Produce Flame",
    "Shillelagh",
    "Cure Wounds",
    "Entangle",
    "Faerie Fire",
    "Thunderwave",
  ],
  Paladin: [
    "Bless",
    "Cure Wounds",
    "Divine Favor",
    "Heroism",
    "Shield of Faith",
  ],
  Ranger: [
    "Cure Wounds",
    "Ensnaring Strike",
    "Fog Cloud",
    "Hunter's Mark",
    "Speak with Animals",
  ],
  Sorcerer: [
    "Fire Bolt",
    "Light",
    "Mage Hand",
    "Ray of Frost",
    "Burning Hands",
    "Magic Missile",
    "Shield",
  ],
  Warlock: [
    "Eldritch Blast",
    "Mage Hand",
    "Chill Touch",
    "Armor of Agathys",
    "Charm Person",
    "Hex",
  ],
  Wizard: [
    "Light",
    "Mage Hand",
    "Ray of Frost",
    "Shocking Grasp",
    "Burning Hands",
    "Mage Armor",
    "Magic Missile",
    "Sleep",
  ],
} as const;

export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};
