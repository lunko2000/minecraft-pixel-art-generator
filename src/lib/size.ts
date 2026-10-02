export type Dimensions = { width: number; height: number };

/** Scales an image's dimensions down to the given pixel art height, keeping its aspect ratio. */
export function scaleToHeight(original: Dimensions, targetHeight: number): Dimensions {
  const ratio = original.width / original.height;
  return { width: Math.max(1, Math.round(targetHeight * ratio)), height: targetHeight };
}
