import type { PowerLevel } from "../components/PowerLevelSelector";

// Phase 3 — tunable weights and thresholds for the Chaos Engine.
// All values can be adjusted for playtesting without touching engine logic.

// ---- Proximity formula weights ----
export const KEYWORD_WEIGHT = 0.5;
export const IMPULSE_WEIGHT = 0.35;
export const HELPFUL_WEIGHT = 0.15;

// ---- Relevance roll bands ----
// Crit Success: roll >= CRIT_SUCCESS_THRESHOLD  → top 10% → pick THE #1 closest match exactly
// Narrow:      NARROW_BAND_THRESHOLD <= roll < CRIT_SUCCESS_THRESHOLD → 30% → random from top 30%
// Wide:        CRIT_FAIL_THRESHOLD <= roll < NARROW_BAND_THRESHOLD → 50% → random from top 75%
// Crit Fail:   roll < CRIT_FAIL_THRESHOLD        → bottom 10% → pure random from ALL 100, ignore everything
export const CRIT_SUCCESS_THRESHOLD = 0.9;
export const NARROW_BAND_THRESHOLD = 0.6;
export const CRIT_FAIL_THRESHOLD = 0.1;

// ---- Band selection sizes ----
export const NARROW_BAND_PERCENT = 0.3; // top 30%
export const WIDE_BAND_PERCENT = 0.75; // top 75%

// ---- Power accuracy band thresholds ----
// Crit Success: powerRoll >= CRIT_SUCCESS_THRESHOLD                     → forced exact match
// Exact:       EXACT_POWER_THRESHOLD <= powerRoll < CRIT_SUCCESS_THRESHOLD
// Adjacent:    WILD_POWER_THRESHOLD  <= powerRoll < EXACT_POWER_THRESHOLD
// Wild:        CRIT_FAIL_THRESHOLD   <= powerRoll < WILD_POWER_THRESHOLD
// Crit Fail:   powerRoll < CRIT_FAIL_THRESHOLD                           → invert power level entirely
export const EXACT_POWER_THRESHOLD = 0.75;
export const WILD_POWER_THRESHOLD = 0.25;

// ---- Power tier distance cutoffs ----
export const EXACT_POWER_DISTANCE = 0.1; // tighter  (was 0.15)
export const ADJACENT_POWER_DISTANCE = 0.25; // tighter (was 0.4)

// ---- Power level to numeric mapping ----
export const POWER_LEVEL_MAP: Record<PowerLevel, number> = {
  flicker: 0.0,
  surge: 0.5,
  cataclysm: 1.0,
};
