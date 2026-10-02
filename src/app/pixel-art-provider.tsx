"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction } from "react";
import { blocks, type VersionFilter } from "@/data/blocks";

export const MIN_HEIGHT = 16;
export const MAX_HEIGHT = 256;
export const DEFAULT_HEIGHT = 128;

export type Mode = "creative" | "survival";

// Blocks you can't get in survival start out excluded.
const defaultExcludedBlocks = () =>
  new Set(blocks.filter((block) => block.category === "creative").map((block) => block.id));

type PixelArtState = {
  image: File | null;
  setImage: (image: File | null) => void;
  /** How many blocks tall the pixel art should be. The width follows the image's own shape. */
  height: number;
  setHeight: (height: number) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  /** Ids of blocks left out of the palette. Only enforced in survival mode. */
  excludedBlocks: Set<string>;
  setExcludedBlocks: Dispatch<SetStateAction<Set<string>>>;
  /** Restricts the palette to blocks that already existed in an older version. */
  version: VersionFilter;
  setVersion: (version: VersionFilter) => void;

  // The rest of this is the generate page's own view of things. It lives
  // here, not as local state on that page, so that navigating away (like to
  // the home page, to reach it again through "Current project") and back
  // doesn't lose it — a plain useState resets the moment its component
  // unmounts, and every route in this app is its own component.
  /** Whether color matching spreads its rounding error onto neighboring pixels. */
  dither: boolean;
  setDither: (dither: boolean) => void;
  /**
   * Renders each block as a flat swatch of its average color instead of its
   * real texture. Real textures carry their own surface grain (dirt
   * speckle, wood grain, fabric weave); this isolates whether that grain,
   * rather than the color matching itself, is what reads as "rough".
   */
  solidColors: boolean;
  setSolidColors: (solidColors: boolean) => void;
  /** The settled zoom level (not the slider's live drag position). */
  zoom: number;
  setZoom: (zoom: number) => void;
  /** Cell indices already marked as placed in-game. */
  placedCells: Set<number>;
  setPlacedCells: Dispatch<SetStateAction<Set<number>>>;
  /**
   * Identifies the exact generation placedCells belongs to — the image, its
   * size, dithering, and the block palette — everything that determines
   * what the grid actually looks like. The generated grid itself is *not*
   * kept here: it's cheap enough to just regenerate, and comparing this
   * signature is what tells the generate page whether marks from a previous
   * visit still apply or need clearing, since a plain object-identity check
   * would see every regeneration as "different" even with identical inputs.
   */
  markedGeneration: string | null;
  setMarkedGeneration: (signature: string | null) => void;
};

const PixelArtContext = createContext<PixelArtState | null>(null);

export function PixelArtProvider({ children }: { children: React.ReactNode }) {
  const [image, setImage] = useState<File | null>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [mode, setMode] = useState<Mode>("creative");
  const [excludedBlocks, setExcludedBlocks] = useState<Set<string>>(defaultExcludedBlocks);
  const [version, setVersion] = useState<VersionFilter>("all");
  const [dither, setDither] = useState(true);
  const [solidColors, setSolidColors] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [placedCells, setPlacedCells] = useState<Set<number>>(new Set());
  const [markedGeneration, setMarkedGeneration] = useState<string | null>(null);

  return (
    <PixelArtContext.Provider
      value={{
        image,
        setImage,
        height,
        setHeight,
        mode,
        setMode,
        excludedBlocks,
        setExcludedBlocks,
        version,
        setVersion,
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
      }}
    >
      {children}
    </PixelArtContext.Provider>
  );
}

export function usePixelArt() {
  const context = useContext(PixelArtContext);
  if (!context) {
    throw new Error("usePixelArt must be used inside <PixelArtProvider>");
  }
  return context;
}
