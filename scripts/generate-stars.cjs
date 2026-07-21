// Generate hundreds of randomly positioned stars for the nebula background.
// Run: node scripts/generate-stars.cjs > src/stars.css

const STAR_COUNT = 300;
const lines = [];

lines.push("/* Auto-generated stars — " + STAR_COUNT + " randomly positioned */");
lines.push(".nebula-layer-2 {");
lines.push("  background-image:");

for (let i = 0; i < STAR_COUNT; i++) {
  const x = (Math.random() * 100).toFixed(1);
  const y = (Math.random() * 100).toFixed(1);
  const size = Math.random() < 0.15 ? "2px 2px" : "1px 1px";
  const alpha = (0.3 + Math.random() * 0.7).toFixed(2);
  const suffix = i < STAR_COUNT - 1 ? "," : ";";
  lines.push(
    "    radial-gradient(" + size + " at " + x + "% " + y + "%, rgba(255,255,255," + alpha + "), transparent)" + suffix,
  );
}

lines.push("}");
console.log(lines.join("\n"));
