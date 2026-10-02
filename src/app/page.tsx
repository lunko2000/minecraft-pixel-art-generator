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
    </main>
  );
}
