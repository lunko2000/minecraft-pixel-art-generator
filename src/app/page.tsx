"use client";

import Link from "next/link";
import { UploadForm } from "@/components/upload-form";
import { T } from "@/lib/i18n/T";
import { useTranslations } from "@/lib/i18n/use-translations";
import { usePixelArt } from "./pixel-art-provider";

export default function Home() {
  const { image } = usePixelArt();
  const t = useTranslations();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-zinc-100">
        <T>{t.home.title}</T>
      </h1>
      <UploadForm />
      {image && (
        <Link
          href="/generate"
          className="text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
        >
          <T>{t.home.currentProjectLink}</T> →
        </Link>
      )}

      <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
          <h2 className="text-sm font-medium text-zinc-300">
            <T>{t.home.aboutHeading}</T>
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            <T>{t.home.aboutBody}</T>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-zinc-300">
            <T>{t.home.howToUseHeading}</T>
          </h2>
          <ol className="mt-1 flex list-decimal flex-col gap-1.5 pl-4 text-sm text-zinc-400">
            <li>
              <T>{t.home.step1}</T>
            </li>
            <li>
              <T>{t.home.step2}</T>
            </li>
            <li>
              <T>{t.home.step3}</T>
            </li>
            <li>
              <T>{t.home.step4Prefix}</T>
              <span className="text-zinc-300">
                <T>{t.home.currentProjectLink}</T>
              </span>
              <T>{t.home.step4Suffix}</T>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
