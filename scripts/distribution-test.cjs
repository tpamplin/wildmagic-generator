// Phase 3 distribution test — 10,000 casts with dynamic weights + adversity tokens.
// Run with: npm run test-distribution
// Mirrors src/engine/ — must be kept in sync with constants.ts, scorer.ts, and chaosEngine.ts.

const fs = require("fs");
const path = require("path");

// ---- Constants (mirrored) ----
const KEYWORD_WEIGHT = 0.5;
const IMPULSE_WEIGHT = 0.35;
const HELPFUL_WEIGHT = 0.15;
const CRIT_SUCCESS_THRESHOLD = 0.9;
const CRIT_FAIL_THRESHOLD = 0.1;
const NARROW_BAND_THRESHOLD = 0.6;
const NARROW_BAND_PERCENT = 0.3;
const WIDE_BAND_PERCENT = 0.75;
const EXACT_POWER_THRESHOLD = 0.75;
const WILD_POWER_THRESHOLD = 0.25;
const EXACT_POWER_DISTANCE = 0.1;
const ADJACENT_POWER_DISTANCE = 0.25;
const POWER_LEVEL_MAP = { flicker: 0.0, surge: 0.5, cataclysm: 1.0 };

const effects = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/data/effects.json"), "utf8"));

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** Dynamic weights based on adversity tokens (mirrors scorer.ts). */
function getDynamicWeights(adversityTokens) {
  const t = Math.min(adversityTokens, 9) / 9;
  return {
    keyword: KEYWORD_WEIGHT + t * 0.3,
    impulse: IMPULSE_WEIGHT - t * 0.2,
    helpful: HELPFUL_WEIGHT - t * 0.1,
  };
}

function calculateProximity(effect, keywords, impulse, adversityTokens) {
  const w = getDynamicWeights(adversityTokens || 0);
  let keywordSum = 0,
    keywordCount = 0;
  for (const kw of keywords) {
    if (kw === null) {
      keywordSum += 0.5;
    } else {
      keywordSum += effect.keywordScores[kw] ?? 0;
    }
    keywordCount++;
  }
  const keywordAvg = keywordCount > 0 ? keywordSum / keywordCount : 0.5;
  const rawImpulse = effect.impulseScores[impulse] ?? 0;
  const impulseProximity = (rawImpulse + 1) / 2;
  let helpfulBonus;
  if (impulse === "hurt") {
    helpfulBonus = 1 - (effect.helpfulHarmful + 1) / 2;
  } else {
    helpfulBonus = (effect.helpfulHarmful + 1) / 2;
  }
  return clamp(keywordAvg * w.keyword + impulseProximity * w.impulse + helpfulBonus * w.helpful, 0, 1);
}

function calculatePowerDistance(effect, requestedPowerLevel) {
  return Math.abs(effect.powerTier - (POWER_LEVEL_MAP[requestedPowerLevel] ?? 0.5));
}

function getRelevanceBand(roll) {
  if (roll >= CRIT_SUCCESS_THRESHOLD) return "critSuccess";
  if (roll < CRIT_FAIL_THRESHOLD) return "critFail";
  if (roll >= NARROW_BAND_THRESHOLD) return "narrow";
  return "wide";
}
function getPowerBand(roll) {
  if (roll >= CRIT_SUCCESS_THRESHOLD) return "critSuccess";
  if (roll < CRIT_FAIL_THRESHOLD) return "critFail";
  if (roll >= EXACT_POWER_THRESHOLD) return "exact";
  if (roll < WILD_POWER_THRESHOLD) return "wild";
  return "adjacent";
}

function getEffectivePowerLevel(band, requested) {
  if (band !== "critFail") return requested;
  if (requested === "surge") return Math.random() < 0.5 ? "flicker" : "cataclysm";
  if (requested === "cataclysm") return "flicker";
  return "cataclysm";
}

function selectEffectChaos(effects, keywords, impulse, powerLevel, adversityTokens) {
  const tokens = Math.max(0, Math.min(10, adversityTokens || 0));
  const relevanceRoll = Math.min(1, Math.random() + tokens * 0.1);
  const powerRoll = Math.min(1, Math.random() + tokens * 0.1);
  const relevanceBand = getRelevanceBand(relevanceRoll);
  const powerBand = getPowerBand(powerRoll);
  const effectivePowerLevel = getEffectivePowerLevel(powerBand, powerLevel);
  const scored = effects.map((effect, index) => ({
    effect,
    originalIndex: index,
    proximity: calculateProximity(effect, keywords, impulse, tokens),
    powerDistance: calculatePowerDistance(effect, effectivePowerLevel),
  }));
  let candidates = scored;
  if (relevanceBand !== "critFail") {
    let maxDist;
    if (powerBand === "critSuccess" || powerBand === "critFail") maxDist = EXACT_POWER_DISTANCE;
    else if (powerBand === "exact") maxDist = EXACT_POWER_DISTANCE;
    else if (powerBand === "adjacent") maxDist = ADJACENT_POWER_DISTANCE;
    else maxDist = 1.0;
    if (maxDist < 1.0) {
      candidates = scored.filter((s) => s.powerDistance <= maxDist);
      if (candidates.length === 0) candidates = scored;
    }
  }
  let selected;
  if (relevanceBand === "critSuccess") {
    const sorted = [...candidates].sort((a, b) => b.proximity - a.proximity);
    selected = sorted[0];
  } else if (relevanceBand === "critFail") {
    selected = scored[Math.floor(Math.random() * scored.length)];
  } else if (relevanceBand === "narrow") {
    const sorted = [...candidates].sort((a, b) => b.proximity - a.proximity);
    const cutoff = Math.max(1, Math.ceil(sorted.length * NARROW_BAND_PERCENT));
    selected = sorted.slice(0, cutoff)[Math.floor(Math.random() * cutoff)];
  } else {
    const sorted = [...candidates].sort((a, b) => b.proximity - a.proximity);
    const cutoff = Math.max(1, Math.ceil(sorted.length * WIDE_BAND_PERCENT));
    selected = sorted.slice(0, cutoff)[Math.floor(Math.random() * cutoff)];
  }
  return {
    effect: selected.effect,
    relevanceRoll,
    powerRoll,
    relevanceBand,
    powerBand,
    effectivePowerLevel,
    candidateCount: relevanceBand === "critFail" ? effects.length : candidates.length,
    selectedProximity: selected.proximity,
    selectedPowerDistance: calculatePowerDistance(selected.effect, powerLevel),
  };
}

// ---- Run ----
const ITERATIONS = 10000;
const keywords = ["Fire", "Heal", null];
const impulse = "hurt";
const powerLevel = "surge";
const TOKEN_LEVELS = [0, 5, 9];

for (const tokens of TOKEN_LEVELS) {
  console.log(`\n=== Phase 3 Distribution Test (${tokens} adversity tokens) ===\n`);
  console.log("Inputs:", { keywords, impulse, powerLevel, adversityTokens: tokens });
  console.log("Iterations:", ITERATIONS, "\n");

  const bandCounts = { critSuccess: 0, narrow: 0, wide: 0, critFail: 0 };
  const powerBandCounts = { critSuccess: 0, exact: 0, adjacent: 0, wild: 0, critFail: 0 };
  let totalProximity = 0,
    totalPowerDist = 0,
    totalCandidates = 0;
  let invertedCount = 0;
  const effectHits = {};

  for (let i = 0; i < ITERATIONS; i++) {
    const result = selectEffectChaos(effects, keywords, impulse, powerLevel, tokens);
    bandCounts[result.relevanceBand]++;
    powerBandCounts[result.powerBand]++;
    totalProximity += result.selectedProximity;
    totalPowerDist += result.selectedPowerDistance;
    totalCandidates += result.candidateCount;
    if (result.effectivePowerLevel !== powerLevel) invertedCount++;
    effectHits[result.effect.id] = (effectHits[result.effect.id] || 0) + 1;
  }

  console.log("--- Relevance Band Distribution ---");
  console.log(
    "  Crit Success (10%):  ",
    bandCounts.critSuccess,
    "(" + ((bandCounts.critSuccess / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Narrow (30%):        ",
    bandCounts.narrow,
    "(" + ((bandCounts.narrow / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Wide (50%):          ",
    bandCounts.wide,
    "(" + ((bandCounts.wide / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Crit Fail (10%):     ",
    bandCounts.critFail,
    "(" + ((bandCounts.critFail / ITERATIONS) * 100).toFixed(1) + "%)",
  );

  console.log("\n--- Power Band Distribution ---");
  console.log(
    "  Crit Success (10%):",
    powerBandCounts.critSuccess,
    "(" + ((powerBandCounts.critSuccess / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Exact (15%):        ",
    powerBandCounts.exact,
    "(" + ((powerBandCounts.exact / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Adjacent (50%):     ",
    powerBandCounts.adjacent,
    "(" + ((powerBandCounts.adjacent / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Wild (15%):         ",
    powerBandCounts.wild,
    "(" + ((powerBandCounts.wild / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  Crit Fail (10%):    ",
    powerBandCounts.critFail,
    "(" + ((powerBandCounts.critFail / ITERATIONS) * 100).toFixed(1) + "%)",
  );
  console.log(
    "  (Power inverted:    ",
    invertedCount,
    "times — " + ((invertedCount / ITERATIONS) * 100).toFixed(1) + "%)",
  );

  console.log("\n--- Stats ---");
  console.log("  Avg candidates after filter:", (totalCandidates / ITERATIONS).toFixed(1));
  console.log("  Avg proximity of selected:", (totalProximity / ITERATIONS).toFixed(3));
  console.log("  Avg power distance:", (totalPowerDist / ITERATIONS).toFixed(3));

  const sortedHits = Object.entries(effectHits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log("\n--- Top 10 Most Selected ---");
  for (const [id, count] of sortedHits) {
    const e = effects.find((x) => x.id === parseInt(id));
    console.log(
      "  #" +
        id +
        ' "' +
        (e ? e.name : "?") +
        '" - ' +
        count +
        " times (" +
        ((count / ITERATIONS) * 100).toFixed(1) +
        "%)",
    );
  }

  console.log("\n--- Health Check ---");
  const checks = [
    { label: "Crit Success ~10%", actual: bandCounts.critSuccess / ITERATIONS, expected: 0.1, tolerance: 0.02 },
    { label: "Crit Fail ~10%", actual: bandCounts.critFail / ITERATIONS, expected: 0.1, tolerance: 0.02 },
    {
      label: "Power crit success ~10%",
      actual: powerBandCounts.critSuccess / ITERATIONS,
      expected: 0.1,
      tolerance: 0.02,
    },
    { label: "Power crit fail ~10%", actual: powerBandCounts.critFail / ITERATIONS, expected: 0.1, tolerance: 0.02 },
    { label: "Exact power ~15%", actual: powerBandCounts.exact / ITERATIONS, expected: 0.15, tolerance: 0.03 },
    { label: "Wild power ~15%", actual: powerBandCounts.wild / ITERATIONS, expected: 0.15, tolerance: 0.03 },
  ];
  let failures = 0;
  for (const c of checks) {
    const ok = Math.abs(c.actual - c.expected) <= c.tolerance;
    console.log("  " + (ok ? "OK" : "FAIL") + " " + c.label + ": " + (c.actual * 100).toFixed(1) + "%");
    if (!ok) failures++;
  }
  if (failures === 0) console.log("\nAll checks passed.");
  else console.log("\n" + failures + " check(s) outside tolerance.");
}
