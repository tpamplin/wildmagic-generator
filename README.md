# 🔮 WildMagic Generator

A chaotic spell generator for tabletop role-playing games. Players choose keywords, an impulse, and a power level — the Chaos Engine rolls, scores, and selects a wild magic effect from a pool of 100 spells. Powerful spells resist discovery until you've encountered them before.

## ✨ Features

- **Chaos Engine** — Weighted proximity scoring across keywords, impulse, and intent axes with banded dice rolls (crit success, narrow, wide, crit fail)
- **Power Levels** — Three tiers: Flicker (cantrip), Surge (standard), and Cataclysm (world-altering)
- **Adversity Tokens** — Gain tokens on bad rolls to boost future rolls, adding a comeback mechanic
- **Spell Discovery** — Top-tier spells (95–100) have a 2/3 fizzle chance until discovered; discovering a spell permanently reveals it
- **Spell Browser** — Browse your collection of discovered spells, import/export your grimoire, and pick any known spell to cast
- **8 Impulses** — Help, harm, protect, reveal, transform, summon, control, escape
- **39 Keywords** — Fine-tune your intent with elemental, sensory, and metaphysical keywords
- **Animated Space Background** — Procedural starfield with parallax motion
- **GM Debug Console** — Every roll logged with colored console output for transparency

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript ~5.9 |
| Build | Vite 7 |
| Styling | CSS (custom properties, no framework) |
| Data | Static JSON (100 spell effects) |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v22+ (or v18+)
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/tpamplin/wildmagic-generator.git
cd wildmagic-generator

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run diagnostic` | Run engine diagnostics and coverage report |
| `npm run test-distribution` | Test the random distribution of the Chaos Engine |

## 📁 Project Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component, routing between cast/browse modes
├── App.css                     # All styles (CSS custom properties, animations)
├── components/
│   ├── KeywordSelector.tsx     # 3-slot keyword picker
│   ├── ImpulseSelector.tsx     # 8-impulse grid selector
│   ├── PowerLevelSelector.tsx  # Flicker / Surge / Cataclysm toggle
│   ├── SpaceBackground.tsx     # Animated starfield background
│   ├── DiscoveryOverlay.tsx    # First-discovery reveal animation
│   └── SpellBrowser.tsx        # Grimoire browser with import/export
├── data/
│   ├── effects.json            # 100 spell effect definitions
│   └── effects.ts              # Runtime validation & typed export
├── engine/
│   ├── chaosEngine.ts          # Core selection algorithm
│   ├── constants.ts            # Tunable weights & thresholds
│   ├── scorer.ts               # Proximity & power distance calculations
│   └── randomSelect.ts         # Weighted random selection utility
├── hooks/
│   └── useDiscoveredSpells.ts  # Discovery state, localStorage persistence
├── types/
│   └── effect.ts               # Effect interface definition
├── utils/
│   ├── effectTags.ts           # Keyword & impulse extraction from effects
│   └── narrative.ts            # Flavor text generation
scripts/
├── diagnostic.cjs              # Engine coverage & balance diagnostics
├── distribution-test.cjs       # Statistical distribution testing
├── self-review.cjs             # Effect data quality checks
├── tag-effects.cjs             # Effect tagging automation
└── generate-stars.cjs          # Starfield configuration generator
```

## 🎲 How the Chaos Engine Works

1. **Roll** — Two d100-style rolls are made: a *relevance roll* and a *power accuracy roll*. Adversity tokens add +0.1 each.
2. **Band** — Each roll falls into a band: crit success (top 10%), narrow (60–90%), wide (10–60%), or crit fail (bottom 10%).
3. **Score** — Every spell is scored on proximity (keyword match × 0.5 + impulse match × 0.35 + intent match × 0.15) and power distance.
4. **Filter** — Spells outside the power accuracy band are filtered out.
5. **Select** — Based on the relevance band, the engine picks the #1 match (crit success), a random top-30% spell (narrow), a random top-75% spell (wide), or a completely random spell (crit fail).

### Adversity Tokens

- Gain 1 token when relevance roll crit-fails
- Gain 1 token when power roll crit-fails
- Each token adds +0.1 to future rolls (caps at 10 tokens / +1.0)
- Cataclysm power level requires at least 2 tokens

### Spell Discovery

Spells #95–100 are "top-tier" and resist manifestation:
- **Undiscovered** → 2/3 chance of fizzling (spell fails to manifest)
- **Discovered** → Always casts successfully once revealed

## 📄 License

MIT
