import type { Effect } from "../types/effect";
import type { Impulse } from "../components/ImpulseSelector";
import type { PowerLevel } from "../components/PowerLevelSelector";

export interface SelectResult {
  effect: Effect;
  /** Debug info — logged to console but never shown to the player. */
  debug: SelectDebug;
}

export interface SelectDebug {
  phase: string;
  inputs: {
    keywords: (string | null)[];
    impulse: Impulse;
    powerLevel: PowerLevel;
  };
  /** Phase 1: raw random index. Phase 2-3: will include relevance/power rolls. */
  randomIndex: number;
  poolSize: number;
}

function logDebug(debug: SelectDebug): void {
  console.group("%c🌀 Wild Magic Engine %c— %s", "color: #c44dff; font-weight: bold;", "color: #8b7f9e;", debug.phase);
  console.log("Inputs:", debug.inputs);
  console.log("Pool size:", debug.poolSize);
  console.log("Random index:", debug.randomIndex, `/ ${debug.poolSize - 1}`);
  console.groupEnd();
}

export function selectEffect(
  effects: Effect[],
  keywords: (string | null)[],
  impulse: Impulse,
  powerLevel: PowerLevel,
): SelectResult {
  if (effects.length === 0) {
    throw new Error("selectEffect: effects array is empty — cannot select a random effect.");
  }
  const index = Math.floor(Math.random() * effects.length);
  const effect = effects[index];

  const debug: SelectDebug = {
    phase: "Phase 2 — Pure Random (Scored Data)",
    inputs: { keywords, impulse, powerLevel },
    randomIndex: index,
    poolSize: effects.length,
  };

  logDebug(debug);

  return { effect, debug };
}
