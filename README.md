# Kingdom Forge

Kingdom Forge is a self-hosted fantasy character-sheet dashboard and dice roller. This starter contains the finished visual foundation for the app and is ready to open in Visual Studio Code.

## Included

- Responsive purple-and-gold character dashboard
- Unlimited character creation with automatic local saving
- Full Core, Actions, Spells, Inventory, Features, and Notes tabs
- Character editor for identity, class, level, combat stats, XP, and abilities
- HP controls, temporary HP, short/long rests, hit dice, and death saves
- Ability, skill, saving-throw, initiative, spell, attack, and damage rolls
- Dice tray supporting compound formulas such as `4d8+1d6-2`
- Advantage, disadvantage, critical/fumble highlighting, and roll history
- Spell slots, prepared spells, spell attacks, and casting statistics
- Editable equipment with quantities, weight, equipped state, and capacity
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

This edition automatically saves characters in the browser attached to your Kingdom Forge address. Use **Export JSON** from the character menu for portable backups and **Import** to restore or move a sheet.

The next server milestone is optional multi-user PostgreSQL storage, accounts, campaign sharing, and a live DM party view. The current local-vault edition requires no database and is ideal for one owner or one device.
