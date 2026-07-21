import type { Effect } from "../types/effect";
import effectsData from "./effects.json";

function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

function validateEffect(obj: unknown): obj is Effect {
  if (!isRecord(obj)) return false;
  const e = obj;
  return (
    typeof e.id === "number" &&
    typeof e.name === "string" &&
    typeof e.description === "string" &&
    typeof e.known === "boolean" &&
    isRecord(e.keywordScores) &&
    typeof e.powerTier === "number" &&
    isRecord(e.impulseScores) &&
    typeof e.helpfulHarmful === "number" &&
    Array.isArray(e.targetTypes) &&
    isRecord(e.statAffinity)
  );
}

function parseEffects(data: unknown): Effect[] {
  if (!Array.isArray(data)) {
    throw new Error("effects.json must be an array");
  }
  return data.map((item, index) => {
    if (!validateEffect(item)) {
      throw new Error(
        `Effect at index ${index} failed Phase 2 validation. ` +
          `Expected all scoring fields. Got keys: ${Object.keys(item as object).join(", ")}`,
      );
    }
    // validateEffect is a type predicate — after the throw above, item is narrowed to Effect.
    return item;
  });
}

export const effects: Effect[] = parseEffects(effectsData);
