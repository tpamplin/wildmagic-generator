import type { Effect } from "../types/effect";
import type { Impulse } from "../components/ImpulseSelector";
import type { PowerLevel } from "../components/PowerLevelSelector";
import { KEYWORD_WEIGHT, IMPULSE_WEIGHT, HELPFUL_WEIGHT, POWER_LEVEL_MAP } from "./constants";

/**
 * Calculate dynamic proximity weights based on adversity tokens spent.
 * More tokens → keywords dominate, impulse/helpful matter less.
 *
 * At 0 tokens: kw=0.50  imp=0.35  help=0.15  (default spread)
 * At 9 tokens: kw=0.80  imp=0.15  help=0.05  (keywords dominate)
 */
function getDynamicWeights(adversityTokens: number) {
  const t = Math.min(adversityTokens, 9) / 9; // 0…1
  return {
    keyword: KEYWORD_WEIGHT + t * 0.3,
    impulse: IMPULSE_WEIGHT - t * 0.2,
    helpful: HELPFUL_WEIGHT - t * 0.1,
  };
}

/**
 * Calculate how closely an effect matches the player's keyword + impulse intent.
 * Returns 0–1 where 1 = perfect match, 0 = no match.
 *
 * Blank keywords (null) contribute a neutral 0.5 to avoid penalising
 * the player for leaving slots open.
 *
 * @param adversityTokens — tokens spent to maintain control; higher values
 *   shift weight toward keywords and away from impulse/helpful-harmful.
 */
export function calculateProximity(
  effect: Effect,
  keywords: (string | null)[],
  impulse: Impulse,
  adversityTokens: number = 0,
): number {
  // ---- Dynamic weights based on adversity tokens ----
  const w = getDynamicWeights(adversityTokens);

  // ---- Keyword match ----
  let keywordSum = 0;
  let keywordCount = 0;
  for (const kw of keywords) {
    if (kw === null) {
      keywordSum += 0.5; // neutral — neither helps nor hurts
    } else {
      keywordSum += effect.keywordScores[kw] ?? 0;
    }
    keywordCount++;
  }
  const keywordAvg = keywordCount > 0 ? keywordSum / keywordCount : 0.5;

  // ---- Impulse match ----
  const rawImpulse = effect.impulseScores[impulse] ?? 0;
  const impulseProximity = (rawImpulse + 1) / 2; // maps -1..1 → 0..1

  // ---- Helpful/harmful alignment ----
  let helpfulBonus: number;
  if (impulse === "hurt") {
    helpfulBonus = 1 - (effect.helpfulHarmful + 1) / 2;
  } else {
    helpfulBonus = (effect.helpfulHarmful + 1) / 2;
  }

  // ---- Weighted sum ----
  const proximity = keywordAvg * w.keyword + impulseProximity * w.impulse + helpfulBonus * w.helpful;

  return clamp(proximity, 0, 1);
}

/**
 * Calculate how far an effect's power tier is from the requested tier.
 * Returns 0–1 where 0 = exact match, 1 = opposite ends of the spectrum.
 */
export function calculatePowerDistance(effect: Effect, requestedPowerLevel: PowerLevel): number {
  const requestedTier = POWER_LEVEL_MAP[requestedPowerLevel] ?? 0.5;
  return Math.abs(effect.powerTier - requestedTier);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
