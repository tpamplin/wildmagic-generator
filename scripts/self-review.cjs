// Self-review consistency checks and fixups
const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/data/effects.json"), "utf8"));

// Fix Snail Mode (#22) - it engages force and reflex
const snail = data.find((e) => e.id === 22);
if (snail) {
  snail.statAffinity.force = 0.3;
  snail.statAffinity.reflex = 0.2;
  console.log("Fixed: Snail Mode stat affinity (force=0.3, reflex=0.2)");
}

// Consistency spot-checks across effect groups
const checks = [
  { group: "Healing", ids: [29, 67, 68], impulse: "heal", min: 0.8 },
  { group: "Damage", ids: [28, 18, 30, 73, 27], impulse: "hurt", min: 0.9 },
  { group: "Summoning", ids: [3, 5, 17, 21, 40, 43, 44, 45, 50, 75, 86, 90, 94, 95], impulse: "make", min: 0.5 },
  { group: "Knowledge", ids: [14, 44, 57, 63, 64, 87], impulse: "know", min: 0.6 },
];

let issues = 0;
for (const c of checks) {
  for (const id of c.ids) {
    const e = data.find((x) => x.id === id);
    if (!e) continue;
    const score = e.impulseScores[c.impulse];
    if (score < c.min) {
      console.log(
        "INCONSISTENCY: " +
          c.group +
          " effect #" +
          id +
          ' "' +
          e.name +
          '" ' +
          c.impulse +
          "=" +
          score +
          " (expected >= " +
          c.min +
          ")",
      );
      issues++;
    }
  }
}

// Check for effects that SHOULD have stat affinity but don't
const statRequiredEffects = [
  { id: 5, name: "Chaos Entities", stats: ["conflict", "reflex"] },
  { id: 19, name: "Taser", stats: ["conflict", "stability"] },
  { id: 34, name: "Millipede's Fathomless Grace", stats: ["reflex"] },
  { id: 35, name: "Millipede's Glamor to Spare", stats: ["influence"] },
  { id: 41, name: "Theme Song", stats: ["influence", "conflict", "stability"] },
  { id: 65, name: "Slam", stats: ["force", "conflict"] },
  { id: 82, name: "The Floor is Lava", stats: ["reflex", "stability"] },
  { id: 92, name: "Wings", stats: ["reflex", "force", "stability"] },
  { id: 93, name: "The Extra Mile", stats: ["reflex", "force"] },
  { id: 94, name: "Helpful Shadow", stats: ["reflex"] },
  { id: 95, name: "Simulacrum", stats: ["conflict", "force", "cognition"] },
];
for (const check of statRequiredEffects) {
  const e = data.find((x) => x.id === check.id);
  if (!e) continue;
  for (const stat of check.stats) {
    if (e.statAffinity[stat] === 0) {
      console.log("MISSING STAT: Effect #" + e.id + ' "' + e.name + '" should have ' + stat + " > 0");
      issues++;
    }
  }
}

if (issues === 0) console.log("All consistency checks passed.");
else console.log(issues + " consistency issues found.");

fs.writeFileSync(path.join(__dirname, "..", "src/data/effects.json"), JSON.stringify(data, null, 2), "utf8");
