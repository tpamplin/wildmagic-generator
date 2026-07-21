import type { Effect } from "../types/effect";

export interface EffectTags {
  keywords: string[];
  impulse: string;
}

/** Maps a numeric power tier to its display label. */
export function getPowerLabel(powerTier: number): string {
  if (powerTier >= 0.67) return "cataclysm";
  if (powerTier >= 0.33) return "surge";
  return "flicker";
}

/** Returns the adversity token cost to pick this spell. */
export function getSpellCost(isDiscovered: boolean, powerTier: number): number {
  if (!isDiscovered) return 10;
  if (powerTier >= 0.67) return 10; // cataclysm
  if (powerTier >= 0.33) return 8; // surge
  return 5; // flicker
}

/**
 * Extracts the top-scoring keywords (max 3, score > 0) and the dominant impulse
 * from an effect's scoring data.
 */
export function getEffectTags(effect: Effect): EffectTags {
  // Top keywords — descending by score, keep only those with score > 0, take top 3
  const keywords = Object.entries(effect.keywordScores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);

  // Dominant impulse — highest absolute score
  const impulseEntries = Object.entries(effect.impulseScores);
  if (impulseEntries.length === 0) {
    return { keywords, impulse: "none" };
  }
  const [topImpulse] = impulseEntries.reduce((best, curr) => (curr[1] > best[1] ? curr : best));

  return { keywords, impulse: topImpulse };
}
