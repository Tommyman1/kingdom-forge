# Kingdom Forge

## Version 2.5.3

Kingdom Forge 2.5.3 is the cumulative, Portainer-ready campaign platform. The animated result now remains visible for an additional second after settling. Character groups have a persistent one-click group sort, and the character organizer no longer collapses across the top of Table Mode. Every animated die still settles with its actual rolled face aimed at the camera, with an enlarged gold-and-arcane glow on that result. It retains every earlier character, campaign, rules, account, backup, homebrew, and animated-dice feature.

Start with [PORTAINER.md](PORTAINER.md). No predetermined administrator password exists: the first account registered becomes the administrator.

## Licensing and rules content

Bundled rules data must remain limited to open-license SRD material and original Kingdom Forge/Wall Gloria content. Private imports and homebrew remain private user data. Do not redistribute paid D&D Beyond text or artwork.

## Previous 1.1 additions

This cumulative release includes everything from 1.0 plus:

- configurable class and homebrew resource counters with short/long-rest recovery
- focused table mode for quick play on phones, tablets, and a shared display
- per-character restore points with one-click rollback
- existing JSON character export/import and full account backup remain supported
- automated rest recovery now restores tracked resources as well as HP, hit dice, and spell slots

The campaign, character builder, milestone/XP advancement, ASI choices, inventory/armor AC, spell and feature tracking, accounts/admin tools, homebrew, encounters, Three.js multi-dice roller, critical damage, and PWA support from 1.0 are all retained.

Kingdom Forge is a self-hosted fantasy character-sheet dashboard and dice roller. This starter contains the finished visual foundation for the app and is ready to open in Visual Studio Code.

## Included

- Shared campaigns with DM/player roles, invite codes, and live character syncing
- Campaign command center with party inventory, encounters, initiative, journals, quests, NPCs, factions, and a lightweight map board
- Searchable compendium and account-scoped Homebrew Forge
- Administrator role management, registration controls, account backups, and SQLite database backups
- Installable mobile PWA with offline shell support
- Responsive purple-and-gold character dashboard
- Server-backed accounts with a first-user administrator and private player vaults
- Password hashing, secure session cookies, persistent SQLite storage, and unlimited characters per user
- Uploadable character portraits kept inside the owning user vault
- Full Core, Actions, Spells, Inventory, Features, and Notes tabs
- Character editor for identity, class, level, combat stats, XP, and abilities
- Guided five-step character builder for Class, Background, Species, Abilities, and Equipment
- Expandable current-level features plus higher-level progression previews
- Prepared starter-spell selection for spellcasting classes
- Species trait browser and 16 selectable 2024 backgrounds
- Standard array, 4d6-drop-lowest, individual d20 rolls, and validated 27-point-buy score methods
- All 12 core classes with level-aware subclass choices and 2024 rules progression
- 4d6-drop-lowest ability rolls plus the standard array during character creation
- HP controls, temporary HP, short/long rests, hit dice, and death saves
- Ability, skill, saving-throw, initiative, spell, attack, and damage rolls
- Optional Three.js WebGL d20 animation, tracked feature uses, attacks-per-action, and critical damage rolls
- Multi-click mixed dice pools with up to 24 simultaneous Three.js dice on screen
- Milestone or XP advancement with HP selection, feature unlocks, history, and real Ability Score Improvement choices
- Conditions, concentration, and exhaustion tracking
- Dice tray supporting compound formulas such as `4d8+1d6-2`
- Advantage, disadvantage, critical/fumble highlighting, and roll history
- Spell slots, prepared spells, spell attacks, and casting statistics
- Editable equipment with quantities, weight, equipped state, and capacity
- Built-in catalog of common weapons, armor, adventuring gear, and tools
- Custom weapon and armor importer with physical/elemental damage and automatic equipped AC
- Optional generated dice-clatter sound
- Session journal and editable personality, ideals, bonds, and flaws
- Duplicate, delete, JSON export, and JSON import tools
- Dockerfile and Portainer-compatible `compose.yaml`
- Homepage labels and the external `proxy` network

## Run in Visual Studio Code

Install Node.js 22, open the project folder, and run:

```bash
npm install
npm run dev
```

## Build check

```bash
npm run build
```

## Container deployment

The included Compose file expects an existing Docker network named `proxy` and uses:

`https://kingdom-forge-tail.kingdom.local`

Deploy the folder as a Git-backed Portainer stack or build it with Docker Compose:

```bash
docker compose up -d --build
```

## Saving and backups

This edition automatically saves characters to the signed-in user's private server vault. The first account registered is the administrator; later registrations are regular players. Use **Export JSON** from the character menu for portable backups and **Import** to restore or move a sheet.

Account data lives in the `kingdom-forge-data` Docker volume. Back up that volume before server migrations. Campaign sharing and a live DM party view remain future milestones.

## Rules note

The built-in progression follows the revised 2024 Free Rules/Player's Handbook structure used in 2025–2026 play. It includes concise feature names and mechanics rather than reproducing copyrighted book text. Always use the rules source selected by your campaign and DM.
