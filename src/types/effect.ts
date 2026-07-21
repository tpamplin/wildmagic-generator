export interface Effect {
  id: number;
  name: string;
  description: string;
  known: boolean;

  // Phase 2 scoring axes
  keywordScores: Record<string, number>; // ~39 keywords, 0.0–1.0
  powerTier: number; // 0.0 (flicker) – 1.0 (cataclysm)
  impulseScores: Record<string, number>; // 8 impulses, -1.0 – 1.0
  helpfulHarmful: number; // -1.0 (harmful) – 1.0 (helpful)
  targetTypes: string[]; // e.g. ["self", "enemy", "summon"]
  statAffinity: Record<string, number>; // 6 stats, 0.0–1.0
}
