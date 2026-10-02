"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BlockPicker } from "@/components/block-picker";
import { T } from "@/lib/i18n/T";
import { useTranslations } from "@/lib/i18n/use-translations";
import { scaleToHeight } from "@/lib/size";
import { useImageDimensions } from "@/lib/use-image-dimensions";
import { usePixelArt } from "../pixel-art-provider";

export default function BlocksPage() {
  const router = useRouter();
  const { image, height } = usePixelArt();
  const imageSize = useImageDimensions(image);
  const hasInput = image !== null;
  const t = useTranslations();

  // The image is only kept in memory, so a page refresh sends you back to step 1.
  useEffect(() => {
    if (!hasInput) router.replace("/");
  }, [hasInput, router]);

  if (!image) return null;

  const dimensions = imageSize && scaleToHeight(imageSize, height);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
        >
          <T>{t.common.back}</T>
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          <T>{t.blocksPage.pageTitle}</T>
        </h1>
        <p className="text-sm text-zinc-500">
          {image.name}
          {dimensions && ` · ${dimensions.width}x${dimensions.height}`}
        </p>
      </div>
      <BlockPicker />
    </main>
  );
}
