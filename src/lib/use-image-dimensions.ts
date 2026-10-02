"use client";

import { useEffect, useState } from "react";
import type { Dimensions } from "./size";

/** The pixel dimensions of an uploaded image file, once it has loaded. */
export function useImageDimensions(file: File | null): Dimensions | null {
  const [size, setSize] = useState<Dimensions | null>(null);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    createImageBitmap(file)
      .then((bitmap) => {
        if (!cancelled) setSize({ width: bitmap.width, height: bitmap.height });
        bitmap.close();
      })
      .catch(() => {
        if (!cancelled) setSize(null);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  return file ? size : null;
}
