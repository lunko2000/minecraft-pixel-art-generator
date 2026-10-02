// Builds the block list from a local Minecraft install.
//
//   node scripts/generate-blocks.mjs [path/to/minecraft.jar]
//
// Without an argument it uses the newest release found in your .minecraft
// folder. It keeps every block that is a full, opaque cube (the only blocks
// that work for pixel art). Blocks whose top or end looks different from
// their side, like logs and sandstone, get one entry per look. Each texture
// is written to public/blocks/<id>.png and the block list, with each
// texture's real average color, to src/data/blocks.json. Each block is also
// tagged with whether it already existed in LEGACY_VERSION, by checking your
// local install of that version too, for the app's version filter.
//
// The textures belong to Mojang/Microsoft. They are extracted from your own
// game files for local use.

import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import pngjs from "pngjs";

const { PNG } = pngjs;
const root = path.resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------- categories

// First matching rule wins. Anything unmatched falls into "overworld".
const categoryRules = [
  [/^(bedrock|reinforced_deepslate)$/, "creative"],
  [/(^|_)wool$/, "wool"],
  [/_concrete_powder$/, "concrete_powder"],
  [/_concrete$/, "concrete"],
  [/_glazed_terracotta$/, "glazed_terracotta"],
  [/^terracotta$|_terracotta$/, "terracotta"],
  [/(crimson|warped)_(planks|hyphae|stem|nylium)$/, "nether"],
  [/_planks$|_wood$|_log$|^(stripped_)?bamboo_block$|^bamboo_mosaic$/, "wood"],
  [/froglight/, "special"],
  [/^dead_.*coral_block$/, "coral"],
  [/sulfur|cinnabar/, "sulfur"],
  [/prismarine|sea_lantern|sponge/, "ocean"],
  [/^end_stone|purpur/, "end"],
  [
    /^(diamond|emerald|gold|lapis|netherite)_block$|obsidian|^ancient_debris$|^lodestone$/,
    "rare",
  ],
  [
    /netherrack|nether_brick|nether_wart|warped_wart|soul_|basalt|blackstone|glowstone|shroomlight|magma|quartz|nether_/,
    "nether",
  ],
  [/sculk|resin|packed_ice|blue_ice|honeycomb/, "special"],
  [
    /deepslate|tuff|calcite|dripstone|amethyst|_ore$|^raw_|^(iron|coal|redstone)_block$|copper|^(pale_)?moss_block$/,
    "underground",
  ],
];

const categoryOrder = [
  "overworld",
  "wood",
  "wool",
  "concrete",
  "concrete_powder",
  "terracotta",
  "glazed_terracotta",
  "coral",
  "underground",
  "sulfur",
  "nether",
  "end",
  "ocean",
  "special",
  "rare",
  "creative",
];

const categorize = (id) =>
  categoryRules.find(([pattern]) => pattern.test(id))?.[1] ?? "overworld";

// Same texture as another block, not obtainable in survival, changes look on
// its own once placed, or not something you'd build a picture with.
// Live coral only keeps its color underwater and dies (turning gray) as soon
// as it's exposed to air, so it's excluded; dead coral stays gray for good.
const skip =
  /^waxed_|^infested_|^budding_|_bulb$|^test_|^command_block$|^note_block$|^tnt$|^(crimson|warped)_nylium$|^(brain|bubble|fire|horn|tube)_coral_block$/;

// -------------------------------------------------------------------- jar

function findJar() {
  const versions = path.join(
    process.env.APPDATA ?? "",
    ".minecraft",
    "versions",
  );
  // Modded profiles (Fabric, OptiFine) have a json but no jar of their own.
  const releases = fs
    .readdirSync(versions)
    .filter((name) =>
      [".jar", ".json"].every((ext) =>
        fs.existsSync(path.join(versions, name, name + ext)),
      ),
    )
    .map((name) =>
      JSON.parse(fs.readFileSync(path.join(versions, name, `${name}.json`), "utf8")),
    )
    .filter((v) => v.type === "release")
    .sort((a, b) => b.releaseTime.localeCompare(a.releaseTime));
  if (releases.length === 0) throw new Error(`No release jar found in ${versions}`);
  return path.join(versions, releases[0].id, `${releases[0].id}.jar`);
}

const jarPath = process.argv[2] ?? findJar();
console.log(`Reading ${jarPath}`);
const zip = new AdmZip(jarPath);
const entries = new Map(zip.getEntries().map((e) => [e.entryName, e]));
const readJson = (name) => JSON.parse(entries.get(name).getData().toString());
const strip = (ref) => ref.replace(/^minecraft:/, "");

// The set of block ids that already existed in LEGACY_VERSION, or null if
// that version isn't installed locally.
const LEGACY_VERSION = "1.16.5";
function legacyBlockIds(versionId) {
  const dir = path.join(process.env.APPDATA ?? "", ".minecraft", "versions", versionId);
  const jarFile = path.join(dir, `${versionId}.jar`);
  if (!fs.existsSync(jarFile)) {
    console.log(`  ${versionId} isn't installed locally, so every block will be tagged "later"`);
    return null;
  }
  const ids = new Set(
    new AdmZip(jarFile)
      .getEntries()
      .map((e) => /^assets\/minecraft\/blockstates\/(.+)\.json$/.exec(e.entryName)?.[1])
      .filter(Boolean),
  );
  return ids;
}
const legacyIds = legacyBlockIds(LEGACY_VERSION);

// ------------------------------------------------------------------ models

function resolveModel(ref) {
  const chain = [];
  for (let current = ref; current; ) {
    const file = `assets/minecraft/models/${strip(current)}.json`;
    if (!entries.has(file)) return null;
    const model = readJson(file);
    chain.push(model);
    current = model.parent;
  }
  // The child overrides its parents.
  const textures = {};
  let elements;
  for (const model of chain) {
    for (const [key, value] of Object.entries(model.textures ?? {})) {
      if (!(key in textures)) textures[key] = value;
    }
    elements ??= model.elements;
  }
  return { textures, elements };
}

const resolveTexture = (value, textures) => {
  for (let i = 0; i < 10 && typeof value === "string" && value.startsWith("#"); i++) {
    value = textures[value.slice(1)];
  }
  return typeof value === "string" && !value.startsWith("#") ? value : null;
};

const directions = ["down", "up", "north", "south", "east", "west"];

/** The texture of each face, if the model is one plain full cube. */
function cubeFaces(model) {
  if (!model?.elements || model.elements.length !== 1) return null;
  const [element] = model.elements;
  if (
    element.from?.join() !== "0,0,0" ||
    element.to?.join() !== "16,16,16" ||
    element.rotation
  ) {
    return null;
  }
  const faces = {};
  for (const direction of directions) {
    const face = element.faces?.[direction];
    if (!face || face.tintindex !== undefined) return null;
    faces[direction] = resolveTexture(face.texture, model.textures);
    if (!faces[direction]) return null;
  }
  return faces;
}

const sameFaces = (a, b) => directions.every((d) => a[d] === b[d]);

/**
 * The faces of a block that is a full cube, or null. Blocks that can be placed
 * along an axis (logs, pillars) use their upright form. Any other block whose
 * appearance changes with its state (furnaces, lamps, ...) is left out.
 */
function blockFaces(blockstate) {
  if (!blockstate.variants) return null;
  const variants = Object.entries(blockstate.variants);
  const axial = variants.every(([key]) => key.includes("axis="));
  const upright = axial ? variants.filter(([key]) => key.includes("axis=y")) : variants;

  const all = upright.flatMap(([, variant]) =>
    (Array.isArray(variant) ? variant : [variant]).map((entry) =>
      cubeFaces(resolveModel(entry.model)),
    ),
  );
  if (all.length === 0 || all.some((faces) => !faces)) return null;
  if (!all.every((faces) => sameFaces(faces, all[0]))) return null;

  const sides = [all[0].north, all[0].south, all[0].east, all[0].west];
  if (sides.some((side) => side !== sides[0])) return null; // has a "front"
  return { side: sides[0], top: all[0].up, axial };
}

// ---------------------------------------------------------------- textures

/** Decodes a texture, keeping only the first frame of animated ones. */
function readTexture(texture) {
  const file = `assets/minecraft/textures/${strip(texture)}.png`;
  if (!entries.has(file)) return null;
  const full = PNG.sync.read(entries.get(file).getData());
  if (full.height % full.width !== 0) return null;

  const frame = new PNG({ width: full.width, height: full.width });
  full.data.copy(frame.data, 0, 0, frame.data.length);
  return frame;
}

function redmean(r1, g1, b1, r2, g2, b2) {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
}

function analyse(png) {
  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = png.width * png.height;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] !== 255) return null; // see-through, so not solid
    r += png.data[i];
    g += png.data[i + 1];
    b += png.data[i + 2];
  }
  const avg = [r, g, b].map((sum) => Math.round(sum / pixels));

  // How far the texture's own pixels stray from that single average color,
  // in the same redmean units matching uses. A patterned texture (rings,
  // ore flecks, a glazed terracotta glaze, the target block's bullseye)
  // never actually looks like its average color, no matter how well that
  // average matches the source image, so this is fed back into matching as
  // a penalty.
  let variance = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    variance += redmean(png.data[i], png.data[i + 1], png.data[i + 2], avg[0], avg[1], avg[2]);
  }
  variance = Math.round(variance / pixels);

  const hex = avg.map((v) => v.toString(16).padStart(2, "0")).join("");
  return { color: `#${hex}`, noise: variance };
}

// -------------------------------------------------------------------- main

const lang = readJson("assets/minecraft/lang/en_us.json");
const fallbackName = (id) =>
  id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ids = [...entries.keys()]
  .map((name) => /^assets\/minecraft\/blockstates\/(.+)\.json$/.exec(name)?.[1])
  .filter(Boolean)
  .filter((id) => !skip.test(id))
  .sort();

// Every look a block can give you: its side, and (if different) its top, or its
// end for blocks placed along an axis.
const candidates = [];
for (const id of ids) {
  const faces = blockFaces(readJson(`assets/minecraft/blockstates/${id}.json`));
  if (!faces) continue;

  const name = lang[`block.minecraft.${id}`] ?? fallbackName(id);
  const uniform = faces.top === faces.side;
  const since = legacyIds?.has(id) ? LEGACY_VERSION : "later";
  const base = { category: categorize(id), since };
  candidates.push({
    ...base,
    id,
    name,
    texture: faces.side,
    rank: uniform ? 1 : 0,
  });
  if (!uniform) {
    const face = faces.axial ? "end" : "top";
    candidates.push({
      ...base,
      id: `${id}_${face}`,
      name: `${name} (${face === "end" ? "End" : "Top"})`,
      texture: faces.top,
      face,
      rank: 2,
    });
  }
}

// When two blocks look identical, keep the one that is easiest to get: a log
// before the wood made from it, and a plain block before another block's top.
candidates.sort((a, b) => a.rank - b.rank);

const seen = new Map();
const found = [];
for (const candidate of candidates) {
  const png = readTexture(candidate.texture);
  const analysis = png && analyse(png);
  if (!analysis) continue;

  if (seen.has(candidate.texture)) {
    console.log(`  duplicate texture: ${candidate.id} looks like ${seen.get(candidate.texture)}`);
    continue;
  }
  seen.set(candidate.texture, candidate.id);

  const { id, name, category, face, since } = candidate;
  found.push({ id, name, category, face, since, ...analysis, png });
}

found.sort(
  (a, b) =>
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
    a.name.localeCompare(b.name),
);

if (new Set(found.map((block) => block.id)).size !== found.length) {
  throw new Error("Two blocks ended up with the same id");
}

const outDir = path.join(root, "public", "blocks");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const block of found) {
  fs.writeFileSync(path.join(outDir, `${block.id}.png`), PNG.sync.write(block.png));
}

fs.writeFileSync(
  path.join(root, "src", "data", "blocks.json"),
  JSON.stringify(
    found.map(({ id, name, color, noise, category, face, since }) => ({
      id,
      name,
      color,
      noise,
      category,
      ...(face && { face }),
      since,
    })),
    null,
    2,
  ) + "\n",
);

const legacyCount = found.filter((b) => b.since === LEGACY_VERSION).length;
console.log(
  `\n${found.length} blocks from ${ids.length} block types (${legacyCount} already in ${LEGACY_VERSION}, ${found.length - legacyCount} added later)`,
);
for (const category of categoryOrder) {
  const names = found.filter((b) => b.category === category).map((b) => b.id);
  console.log(`\n[${category}] ${names.length}\n  ${names.join(", ")}`);
}
