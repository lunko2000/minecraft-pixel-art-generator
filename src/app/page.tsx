"use client";

import Link from "next/link";
import { UploadForm } from "@/components/upload-form";
import { usePixelArt } from "./pixel-art-provider";

export default function Home() {
  const { image } = usePixelArt();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-100">
        Minecraft Pixel Art Generator
      </h1>
      <UploadForm />
      {image && (
        <Link
          href="/generate"
          className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
        >
          Current project →
        </Link>
      )}

      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">About</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Turns any image into a Minecraft build: it matches each pixel to the closest-looking
            real block, using actual block textures, so you get a materials list and a block-by-block
            guide instead of just a colorful picture.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-300">How to use it</h2>
          <ol className="mt-1 flex list-decimal flex-col gap-1.5 pl-4 text-sm text-zinc-400">
            <li>Upload an image above and choose how tall the finished build should be.</li>
            <li>
              Pick your blocks: Creative mode uses everything, or go Survival to exclude whatever
              you can&apos;t easily gather, filtered to a specific Minecraft version if you&apos;d like.
              There&apos;s only the current version and 1.16.5 for now — that&apos;s just what the
              creator plays :)
            </li>
            <li>
              Generate your build. From there you can zoom in, switch between flat and dithered
              colors, mark blocks off as you place them, and check off materials as you collect them.
            </li>
            <li>
              Come back anytime with the <span className="text-zinc-300">Current project</span> link
              above — your marks and progress are saved right where you left them.
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
