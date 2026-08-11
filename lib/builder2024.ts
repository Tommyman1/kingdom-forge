export type BuilderTrait = { name: string; summary: string };

export const SPECIES = {
  Human: {
    summary: "Versatile and resourceful people found across many worlds.",
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
} as const;

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
