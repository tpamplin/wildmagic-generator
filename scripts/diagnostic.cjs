// Phase 2 diagnostic — validate the tagged effects data cloud
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/data/effects.json"), "utf8"));

const ALL_KEYWORDS = [
  "Fire",
  "Ice",
  "Lightning",
  "Wind",
  "Water",
  "Earth",
  "Void",
  "Light",
  "Shadow",
  "Escape",
  "Protect",
  "Destroy",
  "Heal",
  "Hide",
  "Fly",
  "Transform",
  "Reveal",
  "Bind",
  "Break",
  "Time",
  "Memory",
  "Dreams",
  "Truth",
  "Fear",
  "Hunger",
  "Gravity",
  "Sound",
  "Silence",
  "Chaos",
  "Weapon",
  "Shield",
  "Door",
  "Bridge",
  "Feast",
  "Mirror",
  "Crown",
  "Key",
  "Bell",
  "Chain",
];
const ALL_IMPULSES = ["help", "hurt", "heal", "stop", "move", "know", "change", "make"];
const ALL_STATS = ["cognition", "force", "reflex", "conflict", "influence", "stability"];
const ALL_TARGETS = ["self", "ally", "enemy", "area", "summon", "world"];

let errors = 0;
let warnings = 0;

console.log("=== Phase 2 Data Cloud Diagnostic ===\n");
console.log("Total effects:", data.length);

// 1. Structural validation
console.log("\n--- Structural Validation ---");
for (const e of data) {
  const missing = [];
  if (!e.keywordScores || typeof e.keywordScores !== "object") missing.push("keywordScores");
  if (typeof e.powerTier !== "number") missing.push("powerTier");
  if (!e.impulseScores || typeof e.impulseScores !== "object") missing.push("impulseScores");
  if (typeof e.helpfulHarmful !== "number") missing.push("helpfulHarmful");
  if (!Array.isArray(e.targetTypes)) missing.push("targetTypes");
  if (!e.statAffinity || typeof e.statAffinity !== "object") missing.push("statAffinity");

  if (missing.length > 0) {
    console.log("  ERROR: Effect #" + e.id + ' "' + e.name + '" missing:', missing.join(", "));
    errors++;
  }

  // Check all keyword keys present
  for (const k of ALL_KEYWORDS) {
    if (!(k in (e.keywordScores || {}))) {
      console.log("  ERROR: Effect #" + e.id + " missing keyword:", k);
      errors++;
    }
  }
  for (const i of ALL_IMPULSES) {
    if (!(i in (e.impulseScores || {}))) {
      console.log("  ERROR: Effect #" + e.id + " missing impulse:", i);
      errors++;
    }
  }
  for (const s of ALL_STATS) {
    if (!(s in (e.statAffinity || {}))) {
      console.log("  ERROR: Effect #" + e.id + " missing stat:", s);
      errors++;
    }
  }
}
console.log("  Structural errors:", errors);

// 2. Score range validation
console.log("\n--- Score Range Validation ---");
let rangeErrors = 0;
for (const e of data) {
  // keywordScores should be 0.0–1.0
  for (const [k, v] of Object.entries(e.keywordScores)) {
    if (v < 0.0 || v > 1.0) {
      console.log("  ERROR: Effect #" + e.id + " keyword " + k + " = " + v + " (out of 0.0–1.0)");
      rangeErrors++;
    }
  }
  // powerTier should be 0.0–1.0
  if (e.powerTier < 0.0 || e.powerTier > 1.0) {
    console.log("  ERROR: Effect #" + e.id + " powerTier = " + e.powerTier);
    rangeErrors++;
  }
  // impulseScores should be -1.0–1.0
  for (const [i, v] of Object.entries(e.impulseScores)) {
    if (v < -1.0 || v > 1.0) {
      console.log("  ERROR: Effect #" + e.id + " impulse " + i + " = " + v);
      rangeErrors++;
    }
  }
  // helpfulHarmful should be -1.0–1.0
  if (e.helpfulHarmful < -1.0 || e.helpfulHarmful > 1.0) {
    console.log("  ERROR: Effect #" + e.id + " helpfulHarmful = " + e.helpfulHarmful);
    rangeErrors++;
  }
  // statAffinity should be 0.0–1.0
  for (const [s, v] of Object.entries(e.statAffinity)) {
    if (v < 0.0 || v > 1.0) {
      console.log("  ERROR: Effect #" + e.id + " stat " + s + " = " + v);
      rangeErrors++;
    }
  }
  // targetTypes should only contain valid values
  for (const t of e.targetTypes) {
    if (!ALL_TARGETS.includes(t)) {
      console.log("  ERROR: Effect #" + e.id + " invalid targetType: " + t);
      rangeErrors++;
    }
  }
}
console.log("  Range errors:", rangeErrors);

// 3. Suspicious patterns
console.log("\n--- Suspicious Patterns ---");
let suspicious = 0;
for (const e of data) {
  // All-zero keyword scores
  const nonZeroKw = Object.values(e.keywordScores).filter((v) => v !== 0).length;
  if (nonZeroKw === 0) {
    console.log("  WARNING: Effect #" + e.id + ' "' + e.name + '" has zero keyword associations');
    suspicious++;
  }
  // All-zero impulse scores
  const nonZeroImp = Object.values(e.impulseScores).filter((v) => v !== 0).length;
  if (nonZeroImp === 0) {
    console.log("  WARNING: Effect #" + e.id + ' "' + e.name + '" has zero impulse associations');
    suspicious++;
  }
  // All-zero stat affinity
  const nonZeroSt = Object.values(e.statAffinity).filter((v) => v !== 0).length;
  if (nonZeroSt === 0 && nonZeroKw > 0) {
    console.log("  INFO: Effect #" + e.id + ' "' + e.name + '" has zero stat affinity (may be intentional)');
  }
  // Empty targetTypes
  if (e.targetTypes.length === 0) {
    console.log("  WARNING: Effect #" + e.id + ' "' + e.name + '" has empty targetTypes');
    suspicious++;
  }
  // helpfulHarmful mismatch with impulse scores
  const avgHurt = e.impulseScores["hurt"] || 0;
  const avgHelp = (e.impulseScores["help"] || 0) + (e.impulseScores["heal"] || 0);
  if (e.helpfulHarmful > 0.5 && avgHurt > 0.3) {
    console.log("  WARNING: Effect #" + e.id + ' "' + e.name + '" is helpful but has high hurt impulse score');
    suspicious++;
  }
  if (e.helpfulHarmful < -0.5 && avgHelp > 0.3) {
    console.log("  WARNING: Effect #" + e.id + ' "' + e.name + '" is harmful but has high help/heal impulse score');
    suspicious++;
  }
}
console.log("  Suspicious patterns:", suspicious);

// 4. Summary statistics
console.log("\n--- Summary ---");
const avgKwPerEffect =
  data.reduce((sum, e) => sum + Object.values(e.keywordScores).filter((v) => v !== 0).length, 0) / data.length;
const avgImpPerEffect =
  data.reduce((sum, e) => sum + Object.values(e.impulseScores).filter((v) => v !== 0).length, 0) / data.length;
const avgPowerTier = data.reduce((sum, e) => sum + e.powerTier, 0) / data.length;
const avgHH = data.reduce((sum, e) => sum + e.helpfulHarmful, 0) / data.length;
const knownCount = data.filter((e) => e.known).length;
const hiddenCount = data.filter((e) => !e.known).length;

console.log("  Avg keywords per effect:", avgKwPerEffect.toFixed(1));
console.log("  Avg impulse associations per effect:", avgImpPerEffect.toFixed(1));
console.log("  Avg power tier:", avgPowerTier.toFixed(2));
console.log("  Avg helpful/harmful:", avgHH.toFixed(2));
console.log("  Known effects:", knownCount);
console.log("  Hidden effects:", hiddenCount);

// Power tier distribution
const flicker = data.filter((e) => e.powerTier < 0.33).length;
const surge = data.filter((e) => e.powerTier >= 0.33 && e.powerTier < 0.67).length;
const cataclysm = data.filter((e) => e.powerTier >= 0.67).length;
console.log("  Power tier distribution: Flicker=" + flicker + " Surge=" + surge + " Cataclysm=" + cataclysm);

// Helpful/harmful distribution
const helpful = data.filter((e) => e.helpfulHarmful > 0.2).length;
const neutral = data.filter((e) => e.helpfulHarmful >= -0.2 && e.helpfulHarmful <= 0.2).length;
const harmful = data.filter((e) => e.helpfulHarmful < -0.2).length;
console.log("  Helpful/harmful distribution: Helpful=" + helpful + " Neutral=" + neutral + " Harmful=" + harmful);

console.log("\n=== Diagnostic Complete ===");
console.log("Errors:", errors, "| Warnings:", warnings + suspicious);
if (errors === 0) console.log("✅ Data cloud is structurally valid.");
