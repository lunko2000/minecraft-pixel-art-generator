import type { Block } from "@/data/blocks";

export type PixelArtGrid = {
  width: number;
  height: number;
  /** One block id per pixel, row-major. Null where the source image was transparent. */
  cells: (string | null)[];
};

type RGB = [number, number, number];
export type Palette = { id: string; rgb: RGB; noise: number }[];

function parseHexColor(hex: string): RGB {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

// "redmean": a weighted RGB distance that approximates how different two
// colors look, weighting each channel by how bright the pair is in red
// (https://www.compuphase.com/cmetric.htm). Tried CIE76 Lab distance first,
// but Lab is well known to be poorly behaved for blues specifically, and it
// showed here too: it matched pure blue to Purple Wool over Blue Wool/Blue
// Concrete. redmean picks the expected block for every primary and mid-tone
// color tested against this palette, so it's what's used.
function redmeanDistance([r1, g1, b1]: RGB, [r2, g2, b2]: RGB) {
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
}

export function buildPalette(blocks: Block[]): Palette {
  return blocks.map((block) => ({ id: block.id, rgb: parseHexColor(block.color), noise: block.noise }));
}

// A block whose own texture doesn't actually look like one flat color (ore
// flecks, a glazed terracotta's pattern, the target block's bullseye) should
// only win a pixel when it's genuinely the closer color, not merely tied
// with a smoother-looking block — otherwise it reads as noise in the result
// no matter how good the color match technically is. `noise` is already in
// the same redmean units as the color distance below, so a fraction of it
// added as a penalty achieves that without excluding busy blocks outright.
const NOISE_PENALTY_WEIGHT = 0.25;

function nearestBlock(rgb: RGB, palette: Palette): Palette[number] {
  let best = palette[0];
  let bestScore = Infinity;
  for (const entry of palette) {
    const score = redmeanDistance(rgb, entry.rgb) + entry.noise * NOISE_PENALTY_WEIGHT;
    if (score < bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return best;
}

/** Below this alpha (out of 255), a pixel is treated as empty: no block there. */
const TRANSPARENT_ALPHA = 128;
const clamp255 = (v: number) => Math.min(255, Math.max(0, v));

/** Matches every pixel to its own closest block, independently of its neighbors. */
function matchFlat(data: Uint8ClampedArray, width: number, height: number, palette: Palette) {
  const cells: (string | null)[] = new Array(width * height);
  // Real photos have huge runs of identical or near-identical colors, so
  // caching by exact color avoids rescanning the palette for each one.
  const cache = new Map<number, string | null>();

  for (let i = 0; i < cells.length; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];

    if (a < TRANSPARENT_ALPHA) {
      cells[i] = null;
      continue;
    }

    const key = (r << 16) | (g << 8) | b;
    let blockId = cache.get(key);
    if (blockId === undefined) {
      blockId = nearestBlock([r, g, b], palette).id;
      cache.set(key, blockId);
    }
    cells[i] = blockId;
  }

  return declutter(cells, data, width, height, palette);
}

// How much worse a color match is allowed to get, in redmean units, before
// declutter refuses to swap a pixel to match its neighbors. Picked by
// testing against a real photo with this exact problem (a smooth blue rose
// gradient landing partly on Sculk): low enough to leave real, deliberate
// single-pixel color accents alone, high enough to absorb the few-hundred-unit
// differences typical of two blocks that are both decent matches for the
// same spot in a gradient.
const DECLUTTER_TOLERANCE = 1200;

/**
 * A pixel whose color sits near the boundary between two blocks' territory
 * can flip to either one from one pixel to the next, even across a source
 * image with a smooth, continuous gradient — nearest-color matching has no
 * concept of its neighbors. When that happens between two blocks that look
 * very different (like a dark, mottled block and a plain light one), the
 * result reads as visible speckle even with no dithering involved. This
 * cleans up the clearest case: a pixel completely surrounded by one other
 * block, where that block is a nearly-as-good match anyway, so there was
 * never a strong reason for it to differ from its neighbors in the first
 * place.
 */
function declutter(cells: (string | null)[], data: Uint8ClampedArray, width: number, height: number, palette: Palette) {
  const rgbById = new Map(palette.map((entry) => [entry.id, entry.rgb]));
  const result = cells.slice();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const id = cells[i];
      if (!id) continue;

      let neighbor: string | null = null;
      let unanimous = true;
      let neighborCount = 0;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nid = cells[ny * width + nx];
        if (!nid) continue;
        neighborCount++;
        if (neighbor === null) neighbor = nid;
        else if (neighbor !== nid) unanimous = false;
      }

      if (!unanimous || neighborCount < 2 || neighbor === null || neighbor === id) continue;

      const offset = i * 4;
      const rgb: RGB = [data[offset], data[offset + 1], data[offset + 2]];
      const ownDistance = redmeanDistance(rgb, rgbById.get(id)!);
      const neighborDistance = redmeanDistance(rgb, rgbById.get(neighbor)!);
      if (neighborDistance <= ownDistance + DECLUTTER_TOLERANCE) {
        result[i] = neighbor;
      }
    }
  }

  return result;
}

/**
 * Matches each pixel to its closest block, then pushes the difference between
 * the source color and the block it landed on onto its not-yet-visited
 * neighbors (Floyd–Steinberg error diffusion). A flat match always rounds a
 * whole region of similar shades to the same one or two blocks, which reads
 * as hard, banded edges; spreading the rounding error instead lets a run of
 * pixels average out to the right shade over a handful of blocks, at the cost
 * of a slightly speckled, less flat-colored look.
 */
function matchDithered(data: Uint8ClampedArray, width: number, height: number, palette: Palette) {
  const cells: (string | null)[] = new Array(width * height);
  const errorR = new Float32Array(width * height);
  const errorG = new Float32Array(width * height);
  const errorB = new Float32Array(width * height);

  const addError = (x: number, y: number, er: number, eg: number, eb: number, weight: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = y * width + x;
    errorR[i] += er * weight;
    errorG[i] += eg * weight;
    errorB[i] += eb * weight;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const offset = i * 4;
      if (data[offset + 3] < TRANSPARENT_ALPHA) {
        cells[i] = null;
        continue;
      }

      const r = clamp255(data[offset] + errorR[i]);
      const g = clamp255(data[offset + 1] + errorG[i]);
      const b = clamp255(data[offset + 2] + errorB[i]);

      const match = nearestBlock([r, g, b], palette);
      cells[i] = match.id;

      const er = r - match.rgb[0];
      const eg = g - match.rgb[1];
      const eb = b - match.rgb[2];
      addError(x + 1, y, er, eg, eb, 7 / 16);
      addError(x - 1, y + 1, er, eg, eb, 3 / 16);
      addError(x, y + 1, er, eg, eb, 5 / 16);
      addError(x + 1, y + 1, er, eg, eb, 1 / 16);
    }
  }

  return cells;
}

/**
 * Turns an image into a grid of blocks: first downscaling it to exactly one
 * pixel per block (letting the browser blend each block's worth of source
 * pixels into one average color), then matching each resulting pixel to
 * whichever block in the palette looks closest to it.
 */
export async function generatePixelArt(
  image: File,
  width: number,
  height: number,
  palette: Palette,
  { dither = false }: { dither?: boolean } = {},
): Promise<PixelArtGrid> {
  if (palette.length === 0) {
    throw new Error("No blocks are available to build with.");
  }

  const bitmap = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't get a 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, width, height);
  const cells = dither
    ? matchDithered(data, width, height, palette)
    : matchFlat(data, width, height, palette);

  return { width, height, cells };
}

// Block textures never change once loaded, and the same couple hundred get
// reloaded on every re-render (each zoom step, each preview-style toggle),
// so caching them here — for the lifetime of the page, across every call
// site — turns every repeat load into an instant, already-resolved promise
// instead of a fresh decode.
const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Couldn't load ${src}`));
      image.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}
