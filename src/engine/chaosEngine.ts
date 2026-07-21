import type { Effect } from "../types/effect";
import type { Impulse } from "../components/ImpulseSelector";
import type { PowerLevel } from "../components/PowerLevelSelector";
import { calculateProximity, calculatePowerDistance } from "./scorer";
import {
  CRIT_SUCCESS_THRESHOLD,
  CRIT_FAIL_THRESHOLD,
  NARROW_BAND_THRESHOLD,
  NARROW_BAND_PERCENT,
  WIDE_BAND_PERCENT,
  EXACT_POWER_THRESHOLD,
  WILD_POWER_THRESHOLD,
  EXACT_POWER_DISTANCE,
  ADJACENT_POWER_DISTANCE,
} from "./constants";

// ---- Types ----

export type RelevanceBand = "critSuccess" | "narrow" | "wide" | "critFail";
export type PowerBand = "critSuccess" | "exact" | "adjacent" | "wild" | "critFail";

export interface ChaosResult {
  effect: Effect;
  debug: ChaosDebug;
}

export interface ChaosDebug {
  phase: string;
  inputs: {
    keywords: (string | null)[];
    impulse: Impulse;
    powerLevel: PowerLevel;
    adversityTokens: number;
  };
  relevanceRoll: number;
  powerRoll: number;
  relevanceBand: RelevanceBand;
  powerBand: PowerBand;
  /** The power level actually used for filtering (may differ on crit fail). */
  effectivePowerLevel: PowerLevel;
  candidateCount: number;
  poolSize: number;
  selectedIndex: number;
  selectedProximity: number;
  selectedPowerDistance: number;
  topMatches: Array<{ id: number; name: string; proximity: number }>;
}

// ---- Engine ----

export function selectEffectChaos(
  effects: Effect[],
  keywords: (string | null)[],
  impulse: Impulse,
  powerLevel: PowerLevel,
  adversityTokens: number = 0,
): ChaosResult {
  if (effects.length === 0) {
    throw new Error("selectEffectChaos: effects array is empty.");
  }

  // Clamp adversity tokens to 0–10 range
  const tokens = Math.max(0, Math.min(10, adversityTokens));

  // 1. Generate rolls — each adversity token adds +0.1 to both rolls
  const relevanceRoll = Math.min(1, Math.random() + tokens * 0.1);
  const powerRoll = Math.min(1, Math.random() + tokens * 0.1);

  // 2. Determine bands
  const relevanceBand = getRelevanceBand(relevanceRoll);
  const powerBand = getPowerBand(powerRoll);

  // 3. Resolve effective power level (may be inverted on crit fail)
  const effectivePowerLevel = getEffectivePowerLevel(powerBand, powerLevel);

  // 4. Score every effect against the effective power level
  const scored = effects.map((effect, index) => ({
    effect,
    originalIndex: index,
    proximity: calculateProximity(effect, keywords, impulse, tokens),
    powerDistance: calculatePowerDistance(effect, effectivePowerLevel),
  }));

  // 5. Filter by power band
  let candidates = scored;
  if (relevanceBand !== "critFail") {
    let maxDist: number;
    if (powerBand === "critSuccess" || powerBand === "critFail") {
      // Crit success/fail on power → forced exact match against (possibly inverted) level
      maxDist = EXACT_POWER_DISTANCE;
    } else if (powerBand === "exact") {
      maxDist = EXACT_POWER_DISTANCE;
    } else if (powerBand === "adjacent") {
      maxDist = ADJACENT_POWER_DISTANCE;
    } else {
      maxDist = 1.0; // wild — no power filter
    }
    if (maxDist < 1.0) {
      candidates = scored.filter((s) => s.powerDistance <= maxDist);
      if (candidates.length === 0) candidates = scored;
    }
  }

  // 6. Sort by proximity
  const sorted = [...candidates].sort((a, b) => b.proximity - a.proximity);
  const topMatches = sorted.slice(0, 5).map((s) => ({
    id: s.effect.id,
    name: s.effect.name,
    proximity: s.proximity,
  }));

  // 7. Select based on relevance band
  let selected: (typeof candidates)[number];

  if (relevanceBand === "critSuccess") {
    selected = sorted[0];
  } else if (relevanceBand === "critFail") {
    selected = scored[Math.floor(Math.random() * scored.length)];
  } else if (relevanceBand === "narrow") {
    const cutoff = Math.max(1, Math.ceil(sorted.length * NARROW_BAND_PERCENT));
    const pool = sorted.slice(0, cutoff);
    selected = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // wide
    const cutoff = Math.max(1, Math.ceil(sorted.length * WIDE_BAND_PERCENT));
    const pool = sorted.slice(0, cutoff);
    selected = pool[Math.floor(Math.random() * pool.length)];
  }

  // 8. Recalculate actual power distance against original requested level (for debug)
  const actualPowerDistance = calculatePowerDistance(selected.effect, powerLevel);

  // 9. Build debug info
  const debug: ChaosDebug = {
    phase: "Phase 3 — Chaos Engine (Weighted Proximity)",
    inputs: { keywords, impulse, powerLevel, adversityTokens: tokens },
    relevanceRoll,
    powerRoll,
    relevanceBand,
    powerBand,
    effectivePowerLevel,
    candidateCount: relevanceBand === "critFail" ? effects.length : candidates.length,
    poolSize: effects.length,
    selectedIndex: selected.originalIndex,
    selectedProximity: selected.proximity,
    selectedPowerDistance: actualPowerDistance,
    topMatches,
  };

  logDebug(debug, selected.effect);

  return { effect: selected.effect, debug };
}

// ---- Helpers ----

function getRelevanceBand(roll: number): RelevanceBand {
  if (roll >= CRIT_SUCCESS_THRESHOLD) return "critSuccess";
  if (roll < CRIT_FAIL_THRESHOLD) return "critFail";
  if (roll >= NARROW_BAND_THRESHOLD) return "narrow";
  return "wide";
}

function getPowerBand(roll: number): PowerBand {
  if (roll >= CRIT_SUCCESS_THRESHOLD) return "critSuccess";
  if (roll < CRIT_FAIL_THRESHOLD) return "critFail";
  if (roll >= EXACT_POWER_THRESHOLD) return "exact";
  if (roll < WILD_POWER_THRESHOLD) return "wild";
  return "adjacent";
}

/**
 * On power crit fail, invert the player's requested power level.
 * surge → random flicker or cataclysm
 * cataclysm → flicker
 * flicker → cataclysm
 */
function getEffectivePowerLevel(band: PowerBand, requested: PowerLevel): PowerLevel {
  if (band !== "critFail") return requested;
  if (requested === "surge") {
    return Math.random() < 0.5 ? "flicker" : "cataclysm";
  }
  if (requested === "cataclysm") return "flicker";
  // flicker → cataclysm
  return "cataclysm";
}

// ---- Console Logging (GM-facing, never seen by players) ----

const BAND_ICONS: Record<string, string> = {
  critSuccess: "🌟",
  narrow: "🎯",
  wide: "🌊",
  critFail: "💥",
  exact: "✅",
  adjacent: "↔️",
  wild: "🎲",
};

function logDebug(debug: ChaosDebug, effect: Effect): void {
  console.group("%c🌀 Chaos Engine %c— %s", "color: #c44dff; font-weight: bold;", "color: #8b7f9e;", debug.phase);

  console.log("Inputs:", debug.inputs);

  console.log(
    `%cRelevance roll: %c${debug.relevanceRoll.toFixed(3)} %c→ %c${BAND_ICONS[debug.relevanceBand]} ${debug.relevanceBand.toUpperCase()}`,
    "color: #8b7f9e;",
    "color: #e8e0f0; font-weight: bold;",
    "color: #8b7f9e;",
    "color: #c44dff; font-weight: bold;",
  );

  console.log(
    `%cPower roll:    %c${debug.powerRoll.toFixed(3)} %c→ %c${BAND_ICONS[debug.powerBand]} ${debug.powerBand.toUpperCase()}%c${debug.effectivePowerLevel !== debug.inputs.powerLevel ? ` (inverted to ${debug.effectivePowerLevel})` : ""}`,
    "color: #8b7f9e;",
    "color: #e8e0f0; font-weight: bold;",
    "color: #8b7f9e;",
    "color: #c44dff; font-weight: bold;",
    "color: #ef4444;",
  );

  console.log(
    `%cCandidates: %c${debug.candidateCount}%c / ${debug.poolSize} %c(after filters)`,
    "color: #8b7f9e;",
    "color: #e8e0f0; font-weight: bold;",
    "color: #8b7f9e;",
    "color: #8b7f9e;",
  );

  // Top 5 closest matches
  if (debug.topMatches.length > 0) {
    console.log("%cTop 5 matches:", "color: #8b7f9e; font-weight: bold;");
    for (const m of debug.topMatches) {
      const marker = m.id === effect.id ? " ← SELECTED" : "";
      console.log(
        `  %c#${m.id} %c"${m.name}" %cproximity %c${m.proximity.toFixed(3)}%c${marker}`,
        "color: #e8e0f0;",
        "color: #a78bfa;",
        "color: #8b7f9e;",
        "color: #e8e0f0; font-weight: bold;",
        "color: #e040fb; font-weight: bold;",
      );
    }
  }

  console.log(
    `%cSelected: %c#${effect.id} "${effect.name}" %c| proximity %c${debug.selectedProximity.toFixed(3)} %c| power dist %c${debug.selectedPowerDistance.toFixed(3)}`,
    "color: #8b7f9e;",
    "color: #e040fb; font-weight: bold;",
    "color: #8b7f9e;",
    "color: #e8e0f0; font-weight: bold;",
    "color: #8b7f9e;",
    "color: #e8e0f0; font-weight: bold;",
  );

  console.groupEnd();
}
