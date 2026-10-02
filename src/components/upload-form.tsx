"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_HEIGHT, MIN_HEIGHT, usePixelArt } from "@/app/pixel-art-provider";
import { stripFurigana } from "@/lib/i18n/furigana";
import { T } from "@/lib/i18n/T";
import { useTranslations } from "@/lib/i18n/use-translations";
import { scaleToHeight } from "@/lib/size";
import { useImageDimensions } from "@/lib/use-image-dimensions";

const clampHeight = (value: number) =>
  Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(value)));

export function UploadForm() {
  const router = useRouter();
  const { image, setImage, height, setHeight } = usePixelArt();
  const fileInput = useRef<HTMLInputElement>(null);
  const imageSize = useImageDimensions(image);
  const t = useTranslations();

  // What the number field shows. Kept as text so an in-progress, temporarily
  // out-of-range entry can round-trip. Resynced from `height` on render
  // (rather than in an effect) whenever the slider or a commit changes it.
  const [heightText, setHeightText] = useState(String(height));
  const [syncedHeight, setSyncedHeight] = useState(height);
  if (height !== syncedHeight) {
    setSyncedHeight(height);
    setHeightText(String(height));
  }

  // While typing, only commit numbers that are already in range, so a
  // multi-digit entry (e.g. typing "1", "12", "128") isn't clamped back to
  // the minimum after the first keystroke. Out-of-range or unparsable text
  // is clamped once the field is left, via commitHeight.
  const handleHeightInput = (raw: string) => {
    setHeightText(raw);
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed >= MIN_HEIGHT && parsed <= MAX_HEIGHT) {
      setHeight(Math.round(parsed));
    }
  };

  const commitHeight = () => {
    const parsed = Number(heightText);
    const clamped = clampHeight(Number.isFinite(parsed) ? parsed : height);
    setHeight(clamped);
    // setHeight alone won't refresh the text when the clamped value equals
    // the height already in state (e.g. clearing the field, then blurring
    // while it was already at the minimum) since nothing then differs for
    // the render-time sync above to react to.
    setHeightText(String(clamped));
  };

  // Coming back from the next page: show the previously chosen file again.
  useEffect(() => {
    if (image && fileInput.current) {
      const transfer = new DataTransfer();
      transfer.items.add(image);
      fileInput.current.files = transfer.files;
    }
  }, [image]);

  const canContinue = image !== null;
  const preview = imageSize && scaleToHeight(imageSize, height);

  return (
    <form
      className="flex w-full max-w-md flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) router.push("/blocks");
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="image" className="text-sm font-medium text-zinc-300">
          <T>{t.upload.chooseImageLabel}</T>
        </label>
        <input
          ref={fileInput}
          id="image"
          name="image"
          type="file"
          accept="image/*"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950 text-sm text-zinc-400 file:mr-4 file:cursor-pointer file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="height" className="text-sm font-medium text-zinc-300">
            <T>{t.upload.pixelArtSizeLabel}</T>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              aria-label={stripFurigana(t.upload.heightAriaLabel)}
              min={MIN_HEIGHT}
              max={MAX_HEIGHT}
              value={heightText}
              onChange={(event) => handleHeightInput(event.target.value)}
              onBlur={commitHeight}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="w-14 rounded-md border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-right text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm text-zinc-400">
              <T>{t.upload.blocksTall}</T>
            </span>
          </div>
        </div>
        <input
          id="height"
          name="height"
          type="range"
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          value={height}
          onChange={(event) => setHeight(Number(event.target.value))}
          className="w-full cursor-pointer accent-zinc-100"
        />
        <p className="text-xs text-zinc-500">
          <T>
            {preview
              ? t.upload.previewKnown(preview.width, preview.height)
              : t.upload.previewUnknown}
          </T>
        </p>
      </div>

      <button
        type="submit"
        disabled={!canContinue}
        className="w-full cursor-pointer rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-zinc-100"
      >
        <T>{t.common.next}</T>
      </button>
    </form>
  );
}
