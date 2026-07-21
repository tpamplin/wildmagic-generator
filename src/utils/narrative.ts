import type { Effect } from "../types/effect";
import type { PowerLevel } from "../components/PowerLevelSelector";
import { getEffectTags, getPowerLabel } from "./effectTags";

/** Pick a random element from an array. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Tier = "flicker" | "surge" | "cataclysm";

// ---- Power comparison (spell result vs requested tier) ----

const POWER_HIGHER: Record<Tier, string[]> = {
  flicker: [
    "The spell flares brighter than you intended — energy surges from your horns, refusing to stay restrained.",
    "More force than you bargained for. What should have been a flicker erupts with unexpected teeth.",
  ],
  surge: [
    "The magic roars through your horns louder than expected — a surge that borders on cataclysmic.",
    "You meant to keep it controlled, but the spell swelled. This is barely a surge anymore.",
  ],
  cataclysm: [],
};

const POWER_MUCH_HIGHER: Record<Tier, string[]> = {
  flicker: [
    "A cataclysm where you wanted a spark. Magic erupts from your horns with terrifying, world-shaking force.",
    "You asked for a flicker and summoned a storm. The power is overwhelming — impossible to ignore.",
  ],
  surge: [
    "Cataclysmic. You wanted a surge — the magic pouring from your horns carries annihilation-level force.",
    "The spell shatters every expectation. This is not a surge — it is a full-blown cataclysm.",
  ],
  cataclysm: ["The spell is already cataclysmic — impossibly, the power still swells beyond even that."],
};

const POWER_LOWER: Record<Tier, string[]> = {
  flicker: ["The spell barely registers — a whisper of power where even a flicker would be more."],
  surge: [
    "The energy falters as it leaves your horns — a flicker where you asked for a surge.",
    "Restrained. The magic settled at a gentler intensity than you called for.",
  ],
  cataclysm: [
    "Tamed. The cataclysm you demanded arrived as a mere surge — still potent, but held back.",
    "The spell resisted your call for devastation, flowing out as a safer surge instead.",
  ],
};

const POWER_MUCH_LOWER: Record<Tier, string[]> = {
  flicker: ["The spell barely exists — even a flicker would be an overstatement for this faint whisper."],
  surge: [
    "The magic collapsed on its way out — a pitiful flicker where you demanded a surge.",
    "Your surge guttered and died in your horns. Only the faintest spark escaped.",
  ],
  cataclysm: [
    "You called for annihilation, but the magic barely flickers. The weave outright refused you.",
    "A whisper where you screamed for thunder. Your horns went silent — only a faint shimmer remains.",
  ],
};

const POWER_EXACT: Record<Tier, string[]> = {
  flicker: [
    "A gentle shimmer dances across your horns — a soft flicker of magic, delicate and controlled.",
    "Tiny sparks drift from your horns like fireflies. The flicker of power is subtle, but it's exactly what you called.",
    "A faint, humming glow settles in your horns. The magic at your command is a whisper, not a shout.",
  ],
  surge: [
    "Raw energy pours from your horns in a steady, powerful stream — a true surge of wild magic.",
    "Your horns blaze with force as the surge takes hold, flooding the air around you with power.",
    "A torrent of magic erupts from your horns, crashing outward in a controlled, relentless wave.",
  ],
  cataclysm: [
    "The air around you cracks and splits as cataclysmic power erupts from every horn — devastating and absolute.",
    "Your horns become conduits of annihilation. The cataclysm tears through reality itself, unrelenting.",
    "A blinding roar of energy — your horns unleash a cataclysm that shakes the very weave of magic.",
  ],
};

// ---- Intent match (how well the character's rapid thoughts shaped the spell) ----

const INTENT_ALL_MATCH: string[] = [
  "Your mind was razor-sharp — every thought found its way into the spell, perfectly aligned.",
  "Clarity cut through the chaos. The magic formed exactly around the shape of your thoughts.",
];

const INTENT_MOST_MATCH: string[] = [
  "Most of your focus held — the spell leans heavily toward what you were picturing.",
  "Your concentration wavered only slightly. The magic caught the broad strokes of your intent.",
];

const INTENT_SOME_MATCH: string[] = [
  "A single thought survived the storm — enough to steer the spell, but only barely.",
  "Your mind scattered in the chaos. One fragment of intent clung on — the rest was lost.",
];

const INTENT_NONE_MATCH: string[] = [
  "The chaos swallowed your thoughts whole. Nothing about this spell reflects what you were willing into being.",
  "Your focus shattered completely. The magic seized on something else entirely.",
  "A total misfire. Whatever crossed your mind never reached the weave — the spell is its own thing.",
];

const INTENT_NONE_SELECTED: string[] = [
  "Your mind was blank — no direction, no anchor. The chaos filled the silence with whatever it pleased.",
  "With no clear thought to guide it, the storm of wild magic chose freely. Pure, undirected chaos.",
  "Open mind, open outcome. With nothing to anchor the casting, the weave answered to no one but itself.",
];

// ---- Combine ----

/**
 * Generates narrative flavour text by comparing the resulting spell to
 * what the player asked for. Describes whether the power level landed
 * higher/lower/exact, and how many keywords survived the chaos.
 */
export function getNarrative(effect: Effect, keywords: (string | null)[], powerLevel: PowerLevel): string {
  const parts: string[] = [];

  // --- Intent match (how well the character's rapid thoughts shaped the result) ---
  const activeKeywords = keywords.filter((k): k is string => k !== null);
  if (activeKeywords.length === 0) {
    parts.push(pick(INTENT_NONE_SELECTED));
  } else {
    const effectTags = getEffectTags(effect);
    const matched = activeKeywords.filter((k) => effectTags.keywords.includes(k)).length;

    if (matched === activeKeywords.length) {
      parts.push(pick(INTENT_ALL_MATCH));
    } else if (matched >= activeKeywords.length * 0.5) {
      parts.push(pick(INTENT_MOST_MATCH));
    } else if (matched > 0) {
      parts.push(pick(INTENT_SOME_MATCH));
    } else {
      parts.push(pick(INTENT_NONE_MATCH));
    }
  }

  // --- Power comparison (compare tier labels, not raw numbers) ---
  const Tiers: Tier[] = ["flicker", "surge", "cataclysm"];
  const actualLabel = getPowerLabel(effect.powerTier) as Tier;
  const delta = Tiers.indexOf(actualLabel) - Tiers.indexOf(powerLevel);

  if (delta === 0) {
    parts.push(pick(POWER_EXACT[powerLevel]));
  } else if (delta === 1) {
    const pool = POWER_HIGHER[powerLevel];
    parts.push(pick(pool ?? ["The spell came through stronger than you intended."]));
  } else if (delta >= 2) {
    const pool = POWER_MUCH_HIGHER[powerLevel];
    parts.push(pick(pool ?? ["The spell landed far above the power you requested."]));
  } else if (delta === -1) {
    const pool = POWER_LOWER[powerLevel];
    parts.push(pick(pool ?? ["The spell came through weaker than you intended."]));
  } else {
    const pool = POWER_MUCH_LOWER[powerLevel];
    parts.push(pick(pool ?? ["The spell landed far below the power you requested."]));
  }

  // --- Adversity token gain from failed rolls ---
  // NOTE: The "+X adversity tokens" message is now rendered as a separate
  // UI element below the narrative — do not inline it here.

  return parts.join(" ");
}
