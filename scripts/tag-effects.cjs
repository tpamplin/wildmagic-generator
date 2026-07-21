// Phase 2 scoring — tag all 100 effects with metadata
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

function makeKeywordScores(o) {
  const r = {};
  for (const k of ALL_KEYWORDS) r[k] = o[k] ?? 0.0;
  return r;
}
function makeImpulseScores(o) {
  const r = {};
  for (const i of ALL_IMPULSES) r[i] = o[i] ?? 0.0;
  return r;
}
function makeStatAffinity(o) {
  const r = {};
  for (const s of ALL_STATS) r[s] = o[s] ?? 0.0;
  return r;
}

// ---- SCORING DATA ----
// Each entry: name → { keywordScores (sparse), powerTier, impulseScores (sparse), helpfulHarmful, targetTypes[], statAffinity (sparse) }

const S = {}; // scores lookup by effect name

// 1-10
S["Liquid Air"] = {
  k: { Wind: 0.7, Water: 0.6, Fly: 0.5, Escape: 0.3, Transform: 0.4 },
  pt: 0.4,
  i: { move: 0.8, change: 0.3 },
  hh: 0.5,
  t: ["self"],
  st: { reflex: 0.5, force: 0.3 },
};
S["Candle"] = {
  k: { Fire: 0.6, Light: 0.8 },
  pt: 0.1,
  i: { help: 0.4, know: 0.2, make: 0.3 },
  hh: 0.3,
  t: ["self"],
  st: {},
};
S["Banana Acolytes"] = { k: { Chaos: 0.6 }, pt: 0.4, i: { make: 0.8 }, hh: 0.1, t: ["summon"], st: {} };
S["En Español"] = {
  k: { Sound: 0.5, Chaos: 0.5, Transform: 0.5, Silence: -0.4 },
  pt: 0.3,
  i: { stop: 0.3, change: 0.7, hurt: 0.1 },
  hh: -0.1,
  t: ["area"],
  st: { cognition: 0.2, influence: 0.4 },
};
S["Chaos Entities"] = {
  k: { Chaos: 0.9 },
  pt: 0.5,
  i: { hurt: 0.3, make: 0.7 },
  hh: -0.4,
  t: ["summon"],
  st: { reflex: 0.3, conflict: 0.4 },
};
S["Folding Chair"] = { k: { Chaos: 0.4 }, pt: 0.0, i: { make: 0.5 }, hh: 0.1, t: ["summon"], st: {} };
S["Hypeman"] = {
  k: { Light: 0.3, Chaos: 0.4, Fear: -0.4 },
  pt: 0.4,
  i: { help: 0.8, change: 0.3, make: 0.5 },
  hh: 0.7,
  t: ["self", "summon"],
  st: { influence: 0.9 },
};
S["Glitter Burst"] = {
  k: { Light: 0.6, Reveal: 0.8, Chaos: 0.3 },
  pt: 0.2,
  i: { help: 0.3, know: 0.5, change: 0.2, make: 0.2 },
  hh: 0.2,
  t: ["self", "area"],
  st: { cognition: 0.1 },
};
S["Ethereal Glow"] = {
  k: { Light: 0.7, Void: 0.3, Transform: 0.5 },
  pt: 0.1,
  i: { change: 0.5 },
  hh: 0.0,
  t: ["self"],
  st: { influence: 0.3 },
};
S["Be Unseen"] = {
  k: { Light: -0.6, Shadow: 0.7, Hide: 1.0, Escape: 0.5, Reveal: -0.5 },
  pt: 0.4,
  i: { help: 0.3, hurt: 0.2, move: 0.5, change: 0.4 },
  hh: 0.4,
  t: ["self"],
  st: { reflex: 0.8 },
};

// 11-20
S["Teleport"] = {
  k: { Void: 0.5, Escape: 0.6, Door: 0.3, Bridge: 0.2, Fly: 0.2 },
  pt: 0.6,
  i: { help: 0.5, move: 1.0 },
  hh: 0.6,
  t: ["self"],
  st: { reflex: 0.7 },
};
S["Dino Directions"] = {
  k: { Truth: 0.5, Memory: 0.2, Dreams: 0.1, Sound: 0.2 },
  pt: 0.4,
  i: { help: 0.5, know: 0.9, make: 0.5 },
  hh: 0.5,
  t: ["summon"],
  st: { cognition: 0.8 },
};
S["Vortex"] = {
  k: { Void: 0.9, Chaos: 0.7, Door: 0.6, Bridge: 0.4, Gravity: 0.5, Escape: 0.3 },
  pt: 0.8,
  i: { hurt: 0.5, move: 0.3, change: 0.2 },
  hh: -0.5,
  t: ["self", "area", "world"],
  st: { stability: 0.6, reflex: 0.3, conflict: 0.2 },
};
S["Prophesy"] = {
  k: { Time: 0.6, Dreams: 0.7, Truth: 0.8, Memory: 0.4, Light: 0.5 },
  pt: 0.5,
  i: { help: 0.4, know: 1.0 },
  hh: 0.5,
  t: ["self"],
  st: { cognition: 0.9, stability: 0.2 },
};
S["Prehensile Tongue"] = {
  k: { Transform: 0.7, Bind: 0.5, Break: 0.2 },
  pt: 0.3,
  i: { help: 0.4, hurt: 0.1, heal: 0.2, stop: 0.2, change: 0.6 },
  hh: 0.3,
  t: ["self"],
  st: { force: 0.4, reflex: 0.5, conflict: 0.2 },
};
S["Water Breathing"] = {
  k: { Water: 0.9, Transform: 0.5, Escape: 0.2 },
  pt: 0.3,
  i: { help: 0.5, move: 0.3, change: 0.5 },
  hh: 0.4,
  t: ["self"],
  st: { stability: 0.3 },
};
S["Friends"] = {
  k: { Water: 0.5, Sound: 0.5, Chaos: 0.4 },
  pt: 0.4,
  i: { help: 0.6, make: 0.6 },
  hh: 0.5,
  t: ["summon"],
  st: { influence: 0.2, stability: 0.5 },
};
S["Kinetic Impulse"] = {
  k: { Gravity: 0.9, Destroy: 0.8, Break: 0.8, Wind: 0.5 },
  pt: 0.95,
  i: { hurt: 1.0, move: 0.7 },
  hh: -0.9,
  t: ["enemy", "world"],
  st: { force: 0.8, conflict: 0.5 },
};
S["Taser"] = {
  k: { Lightning: 0.9, Fear: 0.3 },
  pt: 0.55,
  i: { hurt: 0.9, stop: 0.7 },
  hh: -0.6,
  t: ["enemy"],
  st: { reflex: 0.3, conflict: 0.7, stability: 0.5 },
};
S["Rainbow Ride"] = {
  k: { Light: 0.7, Fly: 0.5, Escape: 0.4 },
  pt: 0.4,
  i: { move: 0.9, change: 0.2, make: 0.3 },
  hh: 0.3,
  t: ["self"],
  st: { reflex: 0.6 },
};

// 21-30
S["Corpse Puppet"] = {
  k: { Shadow: 0.5, Transform: 0.5, Fear: 0.2, Chaos: 0.3 },
  pt: 0.5,
  i: { help: 0.5, hurt: 0.2, heal: 0.1, change: 0.4, make: 0.7 },
  hh: 0.3,
  t: ["summon"],
  st: { force: 0.3, conflict: 0.3 },
};
S["Snail Mode"] = {
  k: { Transform: 0.8, Hide: 0.4, Chaos: 0.5 },
  pt: 0.3,
  i: { help: 0.1, move: -0.3, change: 0.8 },
  hh: 0.0,
  t: ["self"],
  st: { force: -0.3, reflex: -0.2 },
};
S["Magic Mucus"] = {
  k: { Bind: 0.7, Water: 0.3, Earth: 0.2 },
  pt: 0.3,
  i: { hurt: 0.3, stop: 0.7, change: 0.1, make: 0.2 },
  hh: -0.3,
  t: ["area"],
  st: { force: 0.2, reflex: 0.4 },
};
S["Feet"] = { k: { Transform: 0.6, Chaos: 0.5 }, pt: 0.05, i: { change: 0.5 }, hh: 0.0, t: ["self"], st: {} };
S["Plainify"] = {
  k: { Transform: 0.7, Silence: 0.5, Fear: 0.2, Chaos: 0.4 },
  pt: 0.3,
  i: { hurt: 0.4, stop: 0.5, change: 0.9 },
  hh: -0.4,
  t: ["enemy", "area"],
  st: { conflict: 0.3, influence: 0.5 },
};
S["Frost Blast"] = {
  k: { Ice: 1.0, Destroy: 0.6, Break: 0.5, Wind: 0.3 },
  pt: 0.6,
  i: { hurt: 0.9, stop: 0.4 },
  hh: -0.7,
  t: ["enemy", "area"],
  st: { force: 0.4, reflex: 0.3, conflict: 0.5, stability: 0.2 },
};
S["Acid Spray"] = {
  k: { Destroy: 0.8, Break: 0.7, Water: 0.3, Fear: 0.3 },
  pt: 0.6,
  i: { hurt: 0.95 },
  hh: -0.8,
  t: ["enemy", "area"],
  st: { force: 0.3, reflex: 0.3, conflict: 0.6 },
};
S["Shatter"] = {
  k: { Destroy: 1.0, Break: 1.0, Chaos: 0.5, Sound: 0.4 },
  pt: 0.75,
  i: { hurt: 1.0 },
  hh: -1.0,
  t: ["enemy", "world"],
  st: { force: 0.7, conflict: 0.7 },
};
S["Heal Wound"] = {
  k: { Heal: 1.0, Transform: 0.4, Protect: 0.4 },
  pt: 0.5,
  i: { help: 0.9, hurt: -0.5, heal: 1.0 },
  hh: 0.9,
  t: ["ally"],
  st: { stability: 0.3 },
};
S["1000 Years of Darkness"] = {
  k: { Shadow: 0.9, Time: 0.9, Fear: 0.8, Void: 0.7, Silence: 0.5, Dreams: 0.6 },
  pt: 0.95,
  i: { hurt: 1.0, stop: 0.6 },
  hh: -1.0,
  t: ["enemy"],
  st: { conflict: 0.4, stability: 0.8 },
};

// 31-40
S["Choo Choo Shoe"] = {
  k: { Bridge: 0.2, Chaos: 0.5, Hide: 0.4, Sound: 0.3 },
  pt: 0.15,
  i: { help: 0.1, make: 0.5 },
  hh: 0.1,
  t: ["summon"],
  st: {},
};
S["Water jet"] = {
  k: { Water: 1.0, Destroy: 0.3 },
  pt: 0.35,
  i: { hurt: 0.5, stop: 0.2 },
  hh: -0.2,
  t: ["enemy", "area"],
  st: { force: 0.5, conflict: 0.3 },
};
S["Laser eyes"] = {
  k: { Light: 0.8, Fire: 0.6, Destroy: 0.7, Break: 0.4 },
  pt: 0.55,
  i: { hurt: 0.9 },
  hh: -0.6,
  t: ["enemy"],
  st: { force: 0.3, conflict: 0.7 },
};
S["Millipede\u2019s Fathomless Grace"] = {
  k: { Fly: 0.5, Transform: 0.6, Gravity: -0.5, Escape: 0.4 },
  pt: 0.45,
  i: { help: 0.3, move: 0.8, change: 0.5 },
  hh: 0.4,
  t: ["self"],
  st: { force: 0.2, reflex: 0.8 },
};
S["Millipede\u2019s Glamor to Spare"] = {
  k: { Light: 0.5, Transform: 0.5, Chaos: 0.4, Hide: -0.5 },
  pt: 0.35,
  i: { help: 0.3, change: 0.6 },
  hh: 0.1,
  t: ["self"],
  st: { reflex: -0.3, influence: 0.8 },
};
S["Millipede\u2019s 300 Eggs"] = {
  k: { Chaos: 0.8, Feast: 0.3 },
  pt: 0.2,
  i: { make: 0.7 },
  hh: 0.1,
  t: ["self", "area"],
  st: {},
};
S["Candy Cave Psychosis"] = {
  k: { Fear: -0.8, Dreams: 0.7, Chaos: 0.7, Truth: -0.5, Protect: -0.5 },
  pt: 0.5,
  i: { hurt: 0.5, change: 0.8 },
  hh: -0.6,
  t: ["self"],
  st: { cognition: 0.3, conflict: 0.2, stability: 0.7 },
};
S["Summon Bridge"] = {
  k: { Bridge: 1.0, Door: 0.4, Earth: 0.3 },
  pt: 0.4,
  i: { help: 0.4, move: 0.5, change: 0.2, make: 0.9 },
  hh: 0.4,
  t: ["area", "summon"],
  st: { force: 0.3 },
};
S["Rebound"] = {
  k: { Protect: 0.8, Shield: 0.7, Break: 0.3 },
  pt: 0.5,
  i: { help: 0.7, hurt: 0.5, stop: 0.6 },
  hh: 0.5,
  t: ["self"],
  st: { reflex: 0.4, conflict: 0.3, stability: 0.2 },
};
S["Spirit Wrestler"] = {
  k: { Protect: 0.4, Fear: 0.3 },
  pt: 0.5,
  i: { help: 0.6, hurt: 0.7, stop: 0.3, make: 0.7 },
  hh: 0.2,
  t: ["summon"],
  st: { force: 0.7, reflex: 0.5, conflict: 0.9 },
};

// 41-50
S["Theme Song"] = {
  k: { Sound: 0.8, Fear: 0.6, Light: 0.3, Chaos: 0.3 },
  pt: 0.45,
  i: { help: 0.6, hurt: 0.5, stop: 0.3 },
  hh: 0.3,
  t: ["self", "area", "enemy"],
  st: { influence: 0.9, stability: 0.5, conflict: 0.6 },
};
S["Jelly Legs"] = {
  k: { Transform: 0.7, Break: 0.3, Stop: 0.0 },
  pt: 0.3,
  i: { hurt: 0.5, stop: 0.7 },
  hh: -0.3,
  t: ["enemy"],
  st: { force: 0.3, reflex: 0.4 },
};
S["Summon Potato Salad"] = {
  k: { Feast: 0.9, Earth: 0.3, Chaos: 0.4 },
  pt: 0.2,
  i: { make: 0.7, help: 0.1 },
  hh: 0.2,
  t: ["summon"],
  st: {},
};
S["Ask Nyx"] = {
  k: { Truth: 0.7, Memory: 0.5, Know: 0.0, Dreams: 0.3 },
  pt: 0.4,
  i: { know: 1.0, help: 0.6 },
  hh: 0.5,
  t: ["summon"],
  st: { cognition: 0.8 },
};
S["Summon Talking Coat"] = {
  k: { Chaos: 0.5, Transform: 0.3 },
  pt: 0.3,
  i: { make: 0.8, know: 0.3 },
  hh: 0.2,
  t: ["summon"],
  st: { influence: 0.3 },
};
S["Banana Ear Psychosis"] = {
  k: { Sound: 0.7, Truth: -0.5, Chaos: 0.7, Dreams: 0.4 },
  pt: 0.4,
  i: { know: 0.6, change: 0.5 },
  hh: 0.0,
  t: ["self"],
  st: { cognition: 0.5, stability: 0.4 },
};
S["Prank Call Psychosis"] = {
  k: { Sound: 0.6, Fear: 0.5, Truth: -0.3, Chaos: 0.6 },
  pt: 0.3,
  i: { hurt: 0.5, change: 0.5 },
  hh: -0.4,
  t: ["self"],
  st: { stability: 0.6, cognition: 0.3 },
};
S["Sense of wellbeing"] = {
  k: { Light: 0.3, Heal: 0.3, Truth: 0.2 },
  pt: 0.1,
  i: { help: 0.6, heal: 0.5 },
  hh: 0.6,
  t: ["self"],
  st: { stability: 0.7 },
};
S["Sense of Wellbutrin"] = {
  k: { Light: 0.3, Force: 0.0, Chaos: 0.2 },
  pt: 0.15,
  i: { help: 0.4, change: 0.7, make: 0.5 },
  hh: 0.5,
  t: ["self"],
  st: { stability: 0.5, cognition: 0.3 },
};
S["Summon Perfect Souffle"] = {
  k: { Feast: 1.0, Make: 0.0 },
  pt: 0.05,
  i: { help: 0.3, make: 0.9 },
  hh: 0.5,
  t: ["summon"],
  st: {},
};

// 51-60
S["Snowman Psychosis"] = {
  k: { Ice: 0.7, Fear: 0.4, Chaos: 0.6, Transform: 0.5 },
  pt: 0.4,
  i: { change: 0.8, stop: 0.3 },
  hh: -0.4,
  t: ["self"],
  st: { stability: 0.7, influence: 0.4 },
};
S["Extract Kidney"] = {
  k: { Transform: 0.5, Chaos: 0.6, Heal: -0.3 },
  pt: 0.4,
  i: { change: 0.7, hurt: 0.3 },
  hh: -0.1,
  t: ["enemy"],
  st: { force: 0.2, cognition: 0.2 },
};
S["Create Diversion"] = {
  k: { Sound: 0.8, Hide: 0.5, Escape: 0.4, Fear: 0.4 },
  pt: 0.2,
  i: { help: 0.5, stop: 0.3, move: 0.4, make: 0.4 },
  hh: 0.3,
  t: ["area"],
  st: { reflex: 0.4, cognition: 0.3 },
};
S["Musical Meltdown"] = {
  k: { Sound: 0.9, Chaos: 0.6, Fire: 0.4, Fear: 0.3 },
  pt: 0.5,
  i: { change: 0.6, hurt: 0.4 },
  hh: -0.2,
  t: ["self"],
  st: { influence: 0.6, stability: 0.5 },
};
S["Smoke Machine"] = {
  k: { Shadow: 0.6, Hide: 0.8, Wind: 0.4, Light: -0.3 },
  pt: 0.3,
  i: { help: 0.5, hurt: 0.2, stop: 0.2, move: 0.4, make: 0.3 },
  hh: 0.4,
  t: ["self", "area"],
  st: { reflex: 0.7 },
};
S["Tranquilizer Gun"] = {
  k: { Stop: 0.0, Wind: 0.3, Fear: 0.4 },
  pt: 0.5,
  i: { hurt: 0.6, stop: 0.9 },
  hh: -0.3,
  t: ["enemy"],
  st: { reflex: 0.4, conflict: 0.5, stability: 0.5 },
};
S["Ancient Mushroom Wisdom"] = {
  k: { Earth: 0.6, Truth: 0.7, Memory: 0.6, Time: 0.5, Know: 0.0 },
  pt: 0.4,
  i: { know: 1.0, help: 0.5 },
  hh: 0.6,
  t: ["self"],
  st: { cognition: 0.9 },
};
S["Magic Mushroom"] = {
  k: { Dreams: 0.8, Chaos: 0.7, Fear: 0.5, Truth: -0.3, Void: 0.5 },
  pt: 0.55,
  i: { change: 0.8, know: 0.3 },
  hh: -0.2,
  t: ["area"],
  st: { stability: 0.7, cognition: 0.4 },
};
S["Yummy Mushroom"] = {
  k: { Feast: 0.5, Earth: 0.3 },
  pt: 0.0,
  i: { help: 0.2, make: 0.2 },
  hh: 0.3,
  t: ["area"],
  st: {},
};
S["Starfish\u2019s Love"] = {
  k: { Light: 0.6, Truth: 0.5, Heal: 0.4, Fear: -0.6, Protect: 0.4 },
  pt: 0.35,
  i: { help: 0.9, heal: 0.7 },
  hh: 0.9,
  t: ["self", "ally"],
  st: { stability: 0.8, influence: 0.5 },
};

// 61-70
S["Sand Blast"] = {
  k: { Earth: 0.8, Wind: 0.6, Destroy: 0.4, Chaos: 0.3 },
  pt: 0.5,
  i: { hurt: 0.6, stop: 0.3 },
  hh: -0.3,
  t: ["area", "enemy"],
  st: { force: 0.5 },
};
S["Dehydration"] = {
  k: { Water: -0.9, Destroy: 0.7, Hunger: 0.5, Transform: 0.5 },
  pt: 0.65,
  i: { hurt: 0.9, change: 0.5 },
  hh: -0.7,
  t: ["enemy"],
  st: { force: 0.3, conflict: 0.5, stability: 0.3 },
};
S["Read Thoughts"] = {
  k: { Truth: 0.8, Memory: 0.5, Dreams: 0.3, Know: 0.0, Silence: -0.3 },
  pt: 0.5,
  i: { know: 1.0, help: 0.4 },
  hh: 0.5,
  t: ["self"],
  st: { cognition: 0.9, influence: 0.3 },
};
S["Feel Feelings"] = {
  k: { Truth: 0.7, Dreams: 0.4, Know: 0.0, Memory: 0.3 },
  pt: 0.45,
  i: { know: 1.0, help: 0.5, heal: 0.3 },
  hh: 0.5,
  t: ["self"],
  st: { cognition: 0.7, influence: 0.6 },
};
S["Slam"] = {
  k: { Force: 0.0, Conflict: 0.0, Destroy: 0.7, Fear: 0.6, Break: 0.8 },
  pt: 0.6,
  i: { hurt: 1.0, stop: 0.8 },
  hh: -0.8,
  t: ["enemy"],
  st: { force: 0.8, conflict: 0.9 },
};
S["Flatulence"] = {
  k: { Wind: 0.6, Sound: 0.7, Chaos: 0.6, Destroy: 0.2 },
  pt: 0.3,
  i: { hurt: 0.3, stop: 0.2, change: 0.3 },
  hh: -0.2,
  t: ["area"],
  st: { force: 0.3, influence: -0.3 },
};
S["Cure Disease"] = {
  k: { Heal: 1.0, Transform: 0.4, Protect: 0.5, Water: 0.2 },
  pt: 0.6,
  i: { heal: 1.0, help: 0.9, hurt: -0.4 },
  hh: 1.0,
  t: ["ally"],
  st: { stability: 0.4 },
};
S["Remove Curse"] = {
  k: { Heal: 0.8, Transform: 0.5, Protect: 0.5, Break: 0.4, Chaos: -0.4 },
  pt: 0.6,
  i: { heal: 0.9, help: 0.8, stop: 0.3 },
  hh: 0.9,
  t: ["ally"],
  st: { stability: 0.5, influence: 0.3 },
};
S["Insatiable Hunger"] = {
  k: { Hunger: 1.0, Fear: 0.4, Transform: 0.3, Chaos: 0.5 },
  pt: 0.3,
  i: { hurt: 0.5, change: 0.6 },
  hh: -0.5,
  t: ["self"],
  st: { stability: 0.5, force: 0.3 },
};
S["Telekinesis"] = {
  k: { Force: 0.0, Gravity: 0.7, Transform: 0.3, Bind: 0.4, Break: 0.3 },
  pt: 0.55,
  i: { help: 0.5, hurt: 0.5, move: 0.8, change: 0.5, make: 0.3 },
  hh: 0.4,
  t: ["self"],
  st: { force: 0.6, cognition: 0.3, reflex: 0.4 },
};

// 71-80
S["Hot Sauce"] = {
  k: { Fire: 0.7, Feast: 0.5, Chaos: 0.4 },
  pt: 0.2,
  i: { make: 0.6, hurt: 0.3 },
  hh: 0.0,
  t: ["summon"],
  st: {},
};
S["Rapid Growth"] = {
  k: { Transform: 0.8, Force: 0.0, Gravity: 0.3, Chaos: 0.4 },
  pt: 0.5,
  i: { change: 0.9, help: 0.3, hurt: 0.2 },
  hh: 0.1,
  t: ["self"],
  st: { force: 0.7, stability: 0.3 },
};
S["Flame Thrower"] = {
  k: { Fire: 1.0, Destroy: 0.8, Break: 0.5, Wind: 0.3, Fear: 0.5 },
  pt: 0.6,
  i: { hurt: 0.95 },
  hh: -0.7,
  t: ["enemy", "area"],
  st: { force: 0.3, conflict: 0.7 },
};
S["Blow Torch"] = {
  k: { Fire: 0.8, Light: 0.5, Destroy: 0.4, Break: 0.4, Transform: 0.3 },
  pt: 0.35,
  i: { help: 0.4, hurt: 0.6, make: 0.4 },
  hh: 0.0,
  t: ["self"],
  st: { force: 0.2, cognition: 0.2 },
};
S["Summon Narwhal"] = {
  k: { Water: 0.6, Chaos: 0.6, Fly: 0.5 },
  pt: 0.4,
  i: { make: 0.8 },
  hh: 0.1,
  t: ["summon"],
  st: {},
};
S["Sense of Foreboding"] = {
  k: { Fear: 0.8, Truth: 0.5, Time: 0.4, Dreams: 0.3 },
  pt: 0.2,
  i: { know: 0.7, help: 0.4, move: 0.5 },
  hh: 0.4,
  t: ["self"],
  st: { cognition: 0.5, stability: 0.4 },
};
S["Sense of Formaterol"] = {
  k: { Wind: 0.6, Heal: 0.3, Force: 0.0, Light: 0.3 },
  pt: 0.2,
  i: { help: 0.6, heal: 0.4, change: 0.3 },
  hh: 0.5,
  t: ["self"],
  st: { stability: 0.6, force: 0.4 },
};
S["Undo"] = {
  k: { Time: 0.95, Memory: 0.8, Chaos: 0.6, Transform: 0.5, Truth: -0.3 },
  pt: 0.9,
  i: { change: 0.9, heal: 0.5, stop: 0.5 },
  hh: 0.3,
  t: ["world"],
  st: { cognition: 0.4, stability: 0.5 },
};
S["Lifeline"] = {
  k: { Bridge: 0.7, Door: 0.8, Void: 0.6, Chaos: 0.5, Dreams: 0.4 },
  pt: 0.75,
  i: { help: 0.8, make: 0.8, heal: 0.5 },
  hh: 0.6,
  t: ["summon", "world"],
  st: { influence: 0.5, cognition: 0.3 },
};
S["Emergency Exit"] = {
  k: { Door: 1.0, Escape: 0.9, Bridge: 0.5, Protect: 0.6, Void: 0.3 },
  pt: 0.5,
  i: { help: 0.8, move: 0.9, stop: 0.2 },
  hh: 0.7,
  t: ["self", "area"],
  st: { reflex: 0.5, cognition: 0.2 },
};

// 81-90
S["Tiny Wizard"] = {
  k: { Chaos: 0.6, Light: 0.3, Transform: 0.3 },
  pt: 0.35,
  i: { make: 0.7, help: 0.3, know: 0.2 },
  hh: 0.1,
  t: ["summon"],
  st: { cognition: 0.3 },
};
S["The Floor is Lava"] = {
  k: { Fire: 0.7, Fear: 0.5, Gravity: -0.5, Transform: 0.4, Escape: 0.3, Fly: 0.5 },
  pt: 0.4,
  i: { move: 0.6, change: 0.5, help: 0.2 },
  hh: 0.2,
  t: ["self"],
  st: { reflex: 0.6, stability: 0.3 },
};
S["Emergency Sandwich"] = {
  k: { Feast: 0.9, Make: 0.0, Protect: 0.2 },
  pt: 0.05,
  i: { help: 0.5, heal: 0.3, make: 0.6 },
  hh: 0.5,
  t: ["summon"],
  st: {},
};
S["The Button"] = {
  k: { Chaos: 0.7, Fear: 0.4, Truth: -0.5, Mystery: 0.0 },
  pt: 0.3,
  i: { change: 0.6, know: -0.5, make: 0.3 },
  hh: 0.0,
  t: ["summon"],
  st: { cognition: 0.2, stability: 0.3 },
};
S["Llamas With Hats"] = {
  k: { Chaos: 0.8, Sound: 0.4, Truth: -0.3 },
  pt: 0.2,
  i: { change: 0.4, make: 0.6, know: 0.2 },
  hh: 0.1,
  t: ["summon"],
  st: { influence: 0.3 },
};
S["Summon Horse"] = {
  k: { Move: 0.0, Bridge: 0.3, Escape: 0.3 },
  pt: 0.3,
  i: { help: 0.4, make: 0.7, move: 0.5 },
  hh: 0.4,
  t: ["summon"],
  st: { force: 0.2, reflex: 0.3 },
};
S["The Floor Knows"] = {
  k: { Truth: 0.9, Earth: 0.5, Know: 0.0, Memory: 0.4 },
  pt: 0.4,
  i: { know: 1.0, help: 0.6 },
  hh: 0.6,
  t: ["area"],
  st: { cognition: 0.8 },
};
S["The Scenic Route"] = {
  k: { Bridge: 0.6, Door: 0.4, Move: 0.0, Dreams: 0.4, Truth: 0.3 },
  pt: 0.3,
  i: { move: 0.8, know: 0.6, help: 0.5 },
  hh: 0.5,
  t: ["area"],
  st: { cognition: 0.4, reflex: 0.3 },
};
S["Weather Wizard"] = {
  k: { Wind: 0.8, Water: 0.6, Lightning: 0.6, Ice: 0.5, Fire: 0.4, Earth: 0.4, Transform: 0.5 },
  pt: 0.7,
  i: { change: 0.9, help: 0.5, hurt: 0.5, make: 0.4 },
  hh: 0.3,
  t: ["world"],
  st: { cognition: 0.5, stability: 0.4 },
};
S["Summon Gorbo"] = {
  k: { Door: 0.5, Feast: 0.3, Crown: 0.3, Chaos: 0.5, Key: 0.3 },
  pt: 0.3,
  i: { make: 0.8, help: 0.4, know: 0.2 },
  hh: 0.3,
  t: ["summon", "area"],
  st: { influence: 0.4 },
};

// 91-100
S["Rock"] = {
  k: { Earth: 0.5, Weapon: 0.3 },
  pt: 0.05,
  i: { hurt: 0.5, make: 0.3 },
  hh: -0.1,
  t: ["summon"],
  st: { force: 0.3 },
};
S["Wings"] = {
  k: { Fly: 0.9, Transform: 0.6, Wind: 0.5, Light: 0.4 },
  pt: 0.4,
  i: { help: 0.4, move: 0.6, change: 0.6 },
  hh: 0.2,
  t: ["self"],
  st: { force: 0.4, reflex: 0.5, stability: 0.4 },
};
S["The Extra Mile"] = {
  k: { Transform: 0.7, Move: 0.0, Force: 0.0, Escape: 0.3 },
  pt: 0.3,
  i: { move: 0.8, change: 0.7, help: 0.2 },
  hh: 0.3,
  t: ["self"],
  st: { force: 0.4, reflex: 0.5 },
};
S["Helpful Shadow"] = {
  k: { Shadow: 0.8, Protect: 0.5, Transform: 0.4, Hide: 0.3 },
  pt: 0.5,
  i: { help: 0.9, make: 0.5, know: 0.3, move: 0.4 },
  hh: 0.7,
  t: ["summon"],
  st: { reflex: 0.5, cognition: 0.3, conflict: 0.3 },
};
S["Simulacrum"] = {
  k: { Transform: 0.6, Chaos: 0.5, Fire: 0.3, Make: 0.0 },
  pt: 0.6,
  i: { help: 0.6, make: 0.7, change: 0.5 },
  hh: 0.4,
  t: ["summon", "self"],
  st: { cognition: 0.3, conflict: 0.3, force: 0.3 },
};
S["Cosmic Receipt"] = {
  k: { Truth: 0.6, Key: 0.4, Chaos: 0.5, Memory: 0.3, Know: 0.0 },
  pt: 0.4,
  i: { know: 0.7, make: 0.5, help: 0.3 },
  hh: 0.3,
  t: ["self"],
  st: { cognition: 0.5 },
};
S["Unnecessary Goose"] = {
  k: { Chaos: 0.7, Truth: -0.5, Know: 0.0, Sound: 0.2 },
  pt: 0.25,
  i: { know: 0.6, make: 0.5, change: 0.3 },
  hh: 0.1,
  t: ["summon"],
  st: { cognition: 0.5, influence: 0.2 },
};
S["Reset"] = {
  k: { Time: 1.0, Memory: 0.9, Chaos: 0.7, Dreams: 0.6, Transform: 0.5, Truth: -0.4 },
  pt: 0.95,
  i: { change: 1.0, heal: 0.4, stop: 0.3, help: 0.3 },
  hh: 0.2,
  t: ["world"],
  st: { cognition: 0.5, stability: 0.6 },
};
S["Reality\u2019s Apology"] = {
  k: { Chaos: 0.7, Truth: 0.3, Light: 0.4, Heal: 0.3, Protect: 0.4 },
  pt: 0.6,
  i: { help: 0.8, heal: 0.5, change: 0.6 },
  hh: 0.7,
  t: ["world", "self"],
  st: { stability: 0.5, influence: 0.4 },
};
S["Barrier Breach"] = {
  k: { Void: 0.8, Door: 0.7, Truth: 0.9, Chaos: 0.8, Reveal: 0.8, Bridge: 0.6 },
  pt: 0.85,
  i: { know: 1.0, change: 0.7, help: 0.3 },
  hh: 0.5,
  t: ["self", "world"],
  st: { cognition: 1.0, stability: 0.8 },
};

// ---- Apply scores ----
let tagged = 0;
for (const effect of data) {
  const s = S[effect.name];
  if (!s) {
    console.log("WARNING: No scores for:", effect.name);
    continue;
  }
  effect.keywordScores = makeKeywordScores(s.k);
  effect.powerTier = s.pt;
  effect.impulseScores = makeImpulseScores(s.i);
  effect.helpfulHarmful = s.hh;
  effect.targetTypes = s.t;
  effect.statAffinity = makeStatAffinity(s.st);
  tagged++;
}

fs.writeFileSync(path.join(__dirname, "..", "src/data/effects.json"), JSON.stringify(data, null, 2), "utf8");
console.log("Tagged " + tagged + " / " + data.length + " effects");
