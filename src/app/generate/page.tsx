"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { blockIcon, blocks, blocksById } from "@/data/blocks";
import { useCollectedBlocks } from "@/lib/use-collected-blocks";
import { buildPalette, generatePixelArt, loadImage, type PixelArtGrid } from "@/lib/pixel-art";
import { scaleToHeight } from "@/lib/size";
import { useImageDimensions } from "@/lib/use-image-dimensions";
import { usePixelArt } from "../pixel-art-provider";

// How wide the preview canvas aims to be on screen, before it's scaled down
// further (via CSS) to fit a narrow viewport.
const TARGET_PREVIEW_WIDTH = 1100;
const MAX_CELL_SIZE = 24;
// The zoom slider's top end aims for at least this many pixels per block,
// however small "fit" made a block for this particular grid — that's the
// actual point of zooming, so it shouldn't cap out anywhere short of it,
// unless MAX_CANVAS_PIXELS below won't allow it.
const MIN_ZOOMED_PX_PER_BLOCK = 160;
// Browsers refuse to allocate a canvas bigger than roughly this many total
// pixels — Chrome's actual limit is about 268 million — and silently render
// it blank rather than erroring, so this has to be enforced before that
// point, not discovered after. A 128-tall grid alone (a very ordinary size)
// would need ~420 million pixels to hit MIN_ZOOMED_PX_PER_BLOCK, well past
// that limit, so for grids at or above that size the slider's top end is
// however far this budget actually allows instead.
const MAX_CANVAS_PIXELS = 200_000_000;
// How long to wait after the slider stops moving before actually re-drawing
// at the new resolution. Redrawing means reloading every block's texture at
// a new size, which is too heavy to do on every tick of a drag.
const ZOOM_REDRAW_DELAY = 120;
// Every block stacks to 64 in the actual game.
const STACK_SIZE = 64;

/** "1 Stack + 6", "3 Stacks", or null for anything under one full stack. */
function stackBreakdown(count: number): string | null {
  const stacks = Math.floor(count / STACK_SIZE);
  if (stacks === 0) return null;
  const remainder = count % STACK_SIZE;
  const stackLabel = `${stacks} Stack${stacks === 1 ? "" : "s"}`;
  return remainder === 0 ? stackLabel : `${stackLabel} + ${remainder}`;
}

export default function GeneratePage() {
  const router = useRouter();
  const {
    image,
    height,
    mode,
    excludedBlocks,
    version,
    dither,
    setDither,
    solidColors,
    setSolidColors,
    zoom,
    setZoom,
    placedCells,
    setPlacedCells,
    markedGeneration,
    setMarkedGeneration,
  } = usePixelArt();
  const imageSize = useImageDimensions(image);
  const hasInput = image !== null;
  const { collected, toggleCollected, clearCollected } = useCollectedBlocks();

  // The image is only kept in memory, so a page refresh sends you back to step 1.
  useEffect(() => {
    if (!hasInput) router.replace("/");
  }, [hasInput, router]);

  const dimensions = useMemo(
    () => (imageSize ? scaleToHeight(imageSize, height) : null),
    [imageSize, height],
  );

  // The same "what's actually usable" rule as the block picker: in creative
  // mode every block in the version filter is fair game, in survival mode
  // whatever was excluded there is left out here too.
  const availableBlocks = useMemo(() => {
    const versionBlocks =
      version === "all" ? blocks : blocks.filter((block) => block.since === version);
    return mode === "creative"
      ? versionBlocks
      : versionBlocks.filter((block) => !excludedBlocks.has(block.id));
  }, [mode, excludedBlocks, version]);

  const [grid, setGrid] = useState<PixelArtGrid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  // Which row's build guide is open, if any.
  const [openRow, setOpenRow] = useState<number | null>(null);
  // Mirrors placedCells for the full-redraw effect below to read without
  // depending on it: clicking a block draws/erases that one mark directly
  // (see toggleCellPlaced), so the effect only needs to do a full redraw
  // when the grid or zoom level actually changes, not on every click —
  // otherwise every mark would re-clear and redraw the whole canvas, however
  // big "however big" happens to be at the current zoom.
  const placedCellsRef = useRef(placedCells);
  useEffect(() => {
    placedCellsRef.current = placedCells;
  }, [placedCells]);
  // The row-of-buttons column can't use the usual flex "stretch" trick to
  // match the canvas's height, because that stretches the canvas itself too
  // — and unlike the column, the canvas has an aspect ratio that isn't
  // allowed to change. So its height is measured off the canvas directly.
  const [canvasHeight, setCanvasHeight] = useState<number | null>(null);

  // Identifies everything that determines what the grid actually looks
  // like: a different value here means marks from before don't apply
  // anymore. Comparing this (rather than the grid object itself) is what
  // lets marks — and the zoom level — survive leaving this page and coming
  // back to it (via "Current project" on the home page): the grid gets
  // regenerated fresh either way, a new object each time, but if nothing
  // that actually affects its content changed, the marks still make sense.
  //
  // Built from height rather than dimensions on purpose: dimensions comes
  // from useImageDimensions, which resolves asynchronously, so it's null
  // for a render or two on every mount — including when returning via
  // "Current project" to a completely unchanged project. height is exactly
  // as good a signal (dimensions is a pure function of it and the image's
  // own fixed intrinsic size) and, unlike dimensions, is known synchronously
  // from the very first render, so there's no window where this looks like
  // a new generation before settling back to the real, unchanged one.
  const generationSignature = useMemo(() => {
    if (!image) return null;
    return [
      image.name,
      image.size,
      image.lastModified,
      height,
      dither,
      mode,
      version,
      [...excludedBlocks].sort().join(","),
    ].join("|");
  }, [image, height, dither, mode, version, excludedBlocks]);

  // The null check matters: generationSignature is null before an image
  // exists at all, and this shouldn't count that as "changed" the moment
  // one shows up (that's the very first, ordinary generation, not a change
  // from some prior one). An effect, not the render-time "adjust state"
  // pattern usually used in this codebase for this kind of reset — that
  // pattern calls a component's *own* setState while it renders, which is
  // fine, but placedCells etc. now live in PixelArtProvider, an ancestor,
  // and updating an ancestor's state mid-render (rather than in response to
  // an event or effect) is exactly what React's "Cannot update a component
  // while rendering a different component" warning is about.
  useEffect(() => {
    if (generationSignature !== null && generationSignature !== markedGeneration) {
      setMarkedGeneration(generationSignature);
      setPlacedCells(new Set());
      setZoom(1);
    }
  }, [generationSignature, markedGeneration, setMarkedGeneration, setPlacedCells, setZoom]);

  // 1 = fit the available width, same as before zoom existed. Above that,
  // the canvas renders at a fixed pixel-per-block size instead and a
  // scrollbar takes over, so you can zoom in as far as seeing one block
  // clearly without the surrounding page also blowing up. zoomInput tracks
  // the slider itself (instant, cheap, and only ever local — no reason for
  // every drag tick to update shared state); zoom is what rendering
  // actually uses, debounced a little behind it so dragging doesn't redraw
  // every texture on every pixel of motion, and shared so the level you
  // left off at is still there if you come back to this page later.
  const [zoomInput, setZoomInput] = useState(zoom);
  // Keeps zoomInput in step whenever markedGeneration settles to a new
  // value: either this generation was just confirmed unchanged (in which
  // case zoom is whatever was left over from before, and the slider should
  // show that) or the effect above just reset zoom to 1 for a genuinely new
  // one. Either way, that's the one moment zoomInput needs to catch up to
  // shared state rather than lead it — zoomInput is this component's own
  // state, so (unlike the reset effect above) adjusting it during render is
  // the right tool here, not an effect: zoom itself changes on every
  // debounced drag too, and only reacting to markedGeneration specifically
  // is what keeps that from looping back and stomping on zoomInput while
  // you're still mid-drag.
  const [lastSyncedGeneration, setLastSyncedGeneration] = useState(markedGeneration);
  if (markedGeneration !== lastSyncedGeneration) {
    setLastSyncedGeneration(markedGeneration);
    setZoomInput(zoom);
  }
  useEffect(() => {
    const id = setTimeout(() => setZoom(zoomInput), ZOOM_REDRAW_DELAY);
    return () => clearTimeout(id);
  }, [zoomInput, setZoom]);

  // How big one block renders as at "fit", in canvas pixels — the baseline
  // the zoom slider multiplies from.
  const cellSize = useMemo(
    () => (grid ? Math.max(1, Math.min(MAX_CELL_SIZE, Math.floor(TARGET_PREVIEW_WIDTH / grid.width))) : 0),
    [grid],
  );
  // However small "fit" made a block, the slider reaches at least
  // MIN_ZOOMED_PX_PER_BLOCK at its top end — unless the grid is big enough
  // that doing so would need a canvas past what browsers allow, in which
  // case the safe limit wins instead of a blank, broken canvas.
  const maxZoom = useMemo(() => {
    if (!grid || cellSize <= 0) return 4;
    const maxSafePxPerBlock = Math.sqrt(MAX_CANVAS_PIXELS / (grid.width * grid.height));
    const targetPxPerBlock = Math.min(MIN_ZOOMED_PX_PER_BLOCK, maxSafePxPerBlock);
    return Math.max(1, Math.round((targetPxPerBlock / cellSize) * 10) / 10);
  }, [grid, cellSize]);
  // The on-screen size of one block at the current zoom level, in CSS
  // pixels. At 1x this is exactly what "fit" would render anyway, so the
  // canvas can stay in its normal responsive max-width mode instead of
  // switching to an explicit pixel size only once you've actually zoomed in.
  // Rendering (not just displaying) at this size is what makes zooming in
  // actually reveal more block detail instead of just blurring up what "fit"
  // already had.
  const pxPerBlock = Math.round(cellSize * zoom);

  // Lets the row guide be dismissed the same way any other overlay would be.
  useEffect(() => {
    if (openRow === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenRow(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openRow]);

  // Keeps the row-button column's height in sync with the canvas's own
  // rendered height, however that changes: the grid resizing, the window
  // resizing, or the sidebar reflowing.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;
    const observer = new ResizeObserver(() => {
      setCanvasHeight(canvas.getBoundingClientRect().height);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [grid]);

  useEffect(() => {
    if (!image || !dimensions || availableBlocks.length === 0) return;

    let cancelled = false;
    const palette = buildPalette(availableBlocks);
    generatePixelArt(image, dimensions.width, dimensions.height, palette, { dither })
      .then((result) => {
        if (!cancelled) setGrid(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
      });

    return () => {
      cancelled = true;
    };
  }, [image, dimensions, availableBlocks, dither]);

  // Draws the finished grid, either with each block's real texture or as a
  // flat swatch of its average color, once it's ready.
  useEffect(() => {
    if (!grid) return;
    let cancelled = false;

    // Roughly how many pixels' worth of drawing to do before yielding back
    // to the browser for a frame. At high zoom, one full redraw can be well
    // over 100 million pixels — doing that in one uninterrupted loop blocks
    // the page for a visible stretch, which is exactly the "have to zoom in
    // slowly" lag. Chunking by total pixels (not cell count) keeps each
    // chunk's actual drawing work roughly the same regardless of zoom level.
    const PIXEL_BUDGET_PER_CHUNK = 4_000_000;

    const paint = async (textures: Map<string, HTMLImageElement> | null) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // Actually redrawing at pxPerBlock (rather than always at the "fit"
      // cellSize and letting CSS stretch the result) is what makes zooming
      // in reveal real texture detail instead of a blurrier version of the
      // same few pixels: a 16x16 texture drawn at, say, 96px still has all
      // 16x16 of its own detail to show, nearest-neighbor-scaled up crisp.
      canvas.width = grid.width * pxPerBlock;
      canvas.height = grid.height * pxPerBlock;
      ctx.imageSmoothingEnabled = false;

      const cellsPerChunk = Math.max(1, Math.floor(PIXEL_BUDGET_PER_CHUNK / (pxPerBlock * pxPerBlock)));
      for (let start = 0; start < grid.cells.length; start += cellsPerChunk) {
        if (cancelled) return;
        const end = Math.min(grid.cells.length, start + cellsPerChunk);
        for (let i = start; i < end; i++) {
          const id = grid.cells[i];
          if (!id) continue;
          const x = (i % grid.width) * pxPerBlock;
          const y = Math.floor(i / grid.width) * pxPerBlock;
          if (textures) {
            ctx.drawImage(textures.get(id)!, x, y, pxPerBlock, pxPerBlock);
          } else {
            ctx.fillStyle = blocksById.get(id)!.color;
            ctx.fillRect(x, y, pxPerBlock, pxPerBlock);
          }
        }
        if (end < grid.cells.length) await new Promise(requestAnimationFrame);
      }
    };

    if (solidColors) {
      paint(null);
    } else {
      const ids = [...new Set(grid.cells)].filter((id): id is string => id !== null);
      Promise.all(ids.map((id) => loadImage(blockIcon(blocksById.get(id)!)))).then((images) => {
        if (!cancelled) paint(new Map(ids.map((id, i) => [id, images[i]])));
      });
    }

    return () => {
      cancelled = true;
    };
  }, [grid, solidColors, pxPerBlock]);

  // Draws one dark tile with a red X, for a single marked cell.
  const drawMark = (ctx: CanvasRenderingContext2D, index: number, width: number) => {
    const x = (index % width) * pxPerBlock;
    const y = Math.floor(index / width) * pxPerBlock;
    const pad = pxPerBlock * 0.22;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x, y, pxPerBlock, pxPerBlock);
    ctx.beginPath();
    ctx.moveTo(x + pad, y + pad);
    ctx.lineTo(x + pxPerBlock - pad, y + pxPerBlock - pad);
    ctx.moveTo(x + pxPerBlock - pad, y + pad);
    ctx.lineTo(x + pad, y + pxPerBlock - pad);
    ctx.stroke();
  };

  // Full redraw of every mark, on its own transparent canvas stacked on top
  // of the block art — needed whenever the grid or zoom level changes,
  // since that changes the canvas's size and every mark's position on it.
  // A single click doesn't need this: toggleCellPlaced below draws or erases
  // just that one cell directly, so marking stays cheap no matter how big
  // the canvas is at the current zoom.
  useEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !grid) return;

    canvas.width = grid.width * pxPerBlock;
    canvas.height = grid.height * pxPerBlock;
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = Math.max(1, pxPerBlock * 0.18);
    ctx.lineCap = "round";

    for (const index of placedCellsRef.current) {
      drawMark(ctx, index, grid.width);
    }
    // drawMark is stable across renders in everything that matters here
    // (pxPerBlock); only grid/pxPerBlock should trigger this full redraw.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, pxPerBlock]);

  const toggleCellPlaced = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !grid) return;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((event.clientX - rect.left) / rect.width) * grid.width);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * grid.height);
    if (col < 0 || col >= grid.width || row < 0 || row >= grid.height) return;

    const index = row * grid.width + col;
    if (!grid.cells[index]) return; // nothing placed on an empty cell

    setPlacedCells((current) => {
      const next = new Set(current);
      if (next.delete(index)) {
        ctx.clearRect(col * pxPerBlock, row * pxPerBlock, pxPerBlock, pxPerBlock);
      } else {
        next.add(index);
        drawMark(ctx, index, grid.width);
      }
      return next;
    });
  };

  // Ordered the way you'd actually place them: bottom row first (the row
  // you'd stand on to start building), left to right, working up to the top
  // row last — rather than most-needed-first, which doesn't track a real
  // build sequence at all.
  const materials = useMemo(() => {
    if (!grid) return [];
    const counts = new Map<string, number>();
    const firstSeenOrder = new Map<string, number>();
    for (let row = grid.height - 1; row >= 0; row--) {
      for (let col = 0; col < grid.width; col++) {
        const id = grid.cells[row * grid.width + col];
        if (!id) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
        if (!firstSeenOrder.has(id)) firstSeenOrder.set(id, firstSeenOrder.size);
      }
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ block: blocksById.get(id)!, count }))
      .sort((a, b) => firstSeenOrder.get(a.block.id)! - firstSeenOrder.get(b.block.id)!);
  }, [grid]);

  // Just the blocks needed for one row, for the per-row build guide — the
  // same shape as the full materials list above, scoped to one slice of it,
  // in the same left-to-right placement order.
  const rowMaterials = useMemo(() => {
    if (!grid || openRow === null) return [];
    const counts = new Map<string, number>();
    const firstSeenOrder = new Map<string, number>();
    const start = openRow * grid.width;
    for (let x = 0; x < grid.width; x++) {
      const id = grid.cells[start + x];
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
      if (!firstSeenOrder.has(id)) firstSeenOrder.set(id, firstSeenOrder.size);
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ block: blocksById.get(id)!, count }))
      .sort((a, b) => firstSeenOrder.get(a.block.id)! - firstSeenOrder.get(b.block.id)!);
  }, [grid, openRow]);

  if (!image) return null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-2">
        <Link
          href="/blocks"
          className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Your pixel art</h1>
        <p className="text-sm text-zinc-500">
          {image.name}
          {dimensions && ` · ${dimensions.width}x${dimensions.height}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">Color blending</div>
          <p className="text-sm text-zinc-500">
            Dithering breaks up flat color bands into a more nuanced texture
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Color matching mode">
          <button
            type="button"
            aria-pressed={!dither}
            onClick={() => setDither(false)}
            className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
          >
            Flat colors
          </button>
          <button
            type="button"
            aria-pressed={dither}
            onClick={() => setDither(true)}
            className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
          >
            Dithered
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">Preview style</div>
          <p className="text-sm text-zinc-500">
            Real textures have their own grain; solid shows just the matched color
          </p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Preview style">
          <button
            type="button"
            aria-pressed={!solidColors}
            onClick={() => setSolidColors(false)}
            className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
          >
            Textured
          </button>
          <button
            type="button"
            aria-pressed={solidColors}
            onClick={() => setSolidColors(true)}
            className="cursor-pointer rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
          >
            Solid colors
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div>
          <div className="text-sm font-medium text-zinc-300">Zoom</div>
          <p className="text-sm text-zinc-500">
            Past 1×, scroll the preview to reach the parts that don&apos;t fit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-right text-sm text-zinc-400 tabular-nums">
            {zoomInput === 1 ? "Fit" : `${zoomInput.toFixed(1)}× · ${Math.round(cellSize * zoomInput)}px`}
          </span>
          <input
            type="range"
            aria-label="Zoom level"
            min={1}
            max={maxZoom}
            step={0.1}
            value={zoomInput}
            onChange={(event) => setZoomInput(Number(event.target.value))}
            className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-zinc-100 sm:w-56"
          />
          {zoomInput !== 1 && (
            <button
              type="button"
              onClick={() => setZoomInput(1)}
              className="cursor-pointer text-sm text-zinc-300 underline-offset-4 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {availableBlocks.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          No blocks are available to build with. Go back and include at least one.
        </p>
      ) : error ? (
        <p className="rounded-xl border border-rose-900 bg-rose-950 p-5 text-sm text-rose-300">
          {error}
        </p>
      ) : !grid ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Generating your pixel art…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>
              <span className="text-zinc-100">{placedCells.size}</span> of{" "}
              {materials.reduce((sum, { count }) => sum + count, 0)} blocks marked as placed
            </span>
            {placedCells.size > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPlacedCells(new Set());
                  const canvas = overlayRef.current;
                  canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
                }}
                className="cursor-pointer text-zinc-300 underline-offset-4 hover:underline"
              >
                Clear marks
              </button>
            )}
            <span className="text-zinc-600">Click a block once you&apos;ve placed it in-game</span>
          </div>

          {/* No rounded corners anywhere near the canvas: border-radius on a
              canvas clips its own drawn pixels (it's a replaced element, not
              a plain box), which was cutting the actual corner blocks off.
              Square corners here are load-bearing, not just style.
              items-start, not stretch, for the same reason the corners
              matter: the canvas's aspect ratio must never be touched, so the
              row-button column's height is measured off it (canvasHeight)
              instead of the other way around. */}
          <div
            className={
              zoom > 1
                ? // Breaks out of the page's centered max-w-6xl column to span
                  // the full browser width. left-1/2 alone would shift this
                  // by 50% of its own narrow parent, not 50% of the
                  // viewport — using a margin in vw units to pull it back
                  // doesn't cancel that out, since the two are fractions of
                  // different widths. -translate-x-1/2 is the fix: it's 50%
                  // of *this* element's own width, which is the full 100vw
                  // set below, so the two actually cancel out correctly.
                  "relative left-1/2 w-screen -translate-x-1/2 max-h-[75vh] overflow-auto border-y border-zinc-800 px-4"
                : "w-full"
            }
          >
            <div className={zoom > 1 ? "flex w-max items-start" : "flex items-start"}>
              <div className="relative min-w-0 max-w-full">
                <canvas
                  ref={canvasRef}
                  className={
                    "block border-y border-l border-zinc-800 [image-rendering:pixelated]" +
                    (zoom > 1 ? "" : " h-auto max-w-full")
                  }
                />
                <canvas
                  ref={overlayRef}
                  onClick={toggleCellPlaced}
                  className="absolute inset-0 size-full cursor-pointer [image-rendering:pixelated]"
                />
              </div>
              {/* One button per row, lined up with that row on the canvas
                  beside it, however tall or short each row ends up being
                  at the current zoom level. */}
              <div
                style={canvasHeight ? { height: canvasHeight } : undefined}
                className="flex w-6 shrink-0 flex-col overflow-hidden border-y border-x border-zinc-800"
              >
                {Array.from({ length: grid.height }, (_, row) => (
                  <button
                    key={row}
                    type="button"
                    onClick={() => setOpenRow(row)}
                    title={`Blocks for row ${row + 1}`}
                    className="min-h-0 flex-1 cursor-pointer border-b border-zinc-800 bg-zinc-900 text-[8px] leading-none text-zinc-500 transition-colors last:border-b-0 hover:bg-zinc-700 hover:text-zinc-100"
                  >
                    ?
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-medium text-zinc-300">
                Materials ({materials.length} block{materials.length === 1 ? "" : "s"})
              </h2>
              <span className="text-sm text-zinc-500">
                {materials.filter(({ block }) => collected.has(block.id)).length} collected
              </span>
              {materials.some(({ block }) => collected.has(block.id)) && (
                <button
                  type="button"
                  onClick={clearCollected}
                  className="cursor-pointer text-sm text-zinc-300 underline-offset-4 hover:underline"
                >
                  Clear collected
                </button>
              )}
            </div>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {materials.map(({ block, count }) => {
                const breakdown = stackBreakdown(count);
                const isCollected = collected.has(block.id);
                return (
                  <li
                    key={block.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={isCollected}
                      onChange={() => toggleCollected(block.id)}
                      aria-label={`Mark ${block.name} as collected`}
                      className="size-4 shrink-0 cursor-pointer accent-zinc-100"
                    />
                    <Image
                      src={blockIcon(block)}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className={`size-6 shrink-0 [image-rendering:pixelated] ${isCollected ? "opacity-40" : ""}`}
                    />
                    <span className={`truncate ${isCollected ? "text-zinc-500 line-through" : ""}`}>
                      {block.name}
                    </span>
                    <span className="ml-auto shrink-0 text-zinc-500">
                      {count}
                      {breakdown && ` (${breakdown})`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {grid && openRow !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Blocks for row ${openRow + 1}`}
            className="flex max-h-[80vh] w-full max-w-sm flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-100">
                Row {openRow + 1} of {grid.height}
              </h2>
              <button
                type="button"
                onClick={() => setOpenRow(null)}
                aria-label="Close"
                className="cursor-pointer text-zinc-500 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <ul className="flex flex-col gap-1 overflow-y-auto">
              {rowMaterials.map(({ block, count }) => {
                const breakdown = stackBreakdown(count);
                return (
                  <li
                    key={block.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
                  >
                    <Image
                      src={blockIcon(block)}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="size-6 shrink-0 [image-rendering:pixelated]"
                    />
                    <span className="truncate">{block.name}</span>
                    <span className="ml-auto shrink-0 text-zinc-500">
                      {count}
                      {breakdown && ` (${breakdown})`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
