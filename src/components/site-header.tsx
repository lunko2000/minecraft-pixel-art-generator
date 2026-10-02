"use client";

import Link from "next/link";
import { useEffect } from "react";
import { renderFurigana, stripFurigana } from "@/lib/i18n/furigana";
import { T } from "@/lib/i18n/T";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTranslations } from "@/lib/i18n/use-translations";

/**
 * On every page (this is rendered from the root layout, not any one route),
 * so there's always a way back to step 1 without retracing whichever page
 * you happen to be on — the per-page "← Back" links only ever go one step
 * back, not all the way. The language switcher lives here for the same
 * reason: one place, available everywhere, rather than repeated per page.
 */
export function SiteHeader() {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();

  // The <html lang> attribute is set statically (to "en") by the server,
  // since the real preference only exists in this browser's localStorage.
  // This brings it in line once that preference is known on the client.
  // Furigana is still the Japanese script underneath (just annotated), so
  // it gets the same "ja" tag as plain Japanese, not a separate one.
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "ja";
  }, [language]);

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <Link
        href="/"
        className="text-sm font-medium text-zinc-400 underline-offset-4 transition-colors hover:text-zinc-100 hover:underline"
      >
        <T>{t.nav.homeLink}</T>
      </Link>
      {/* Each option is always written in its own language, not translated
          — the point is for a Japanese speaker to be able to find "日本語"
          and switch to it even if they can't read the English UI yet. The
          furigana option demonstrates itself: its own label carries the
          reading it would add everywhere else. */}
      <div className="flex gap-1.5" role="group" aria-label={stripFurigana(t.nav.languageLabel)}>
        <button
          type="button"
          aria-pressed={language === "en"}
          onClick={() => setLanguage("en")}
          className="cursor-pointer rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
        >
          English
        </button>
        <button
          type="button"
          aria-pressed={language === "ja"}
          onClick={() => setLanguage("ja")}
          className="cursor-pointer rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
        >
          日本語
        </button>
        <button
          type="button"
          aria-pressed={language === "ja-furigana"}
          onClick={() => setLanguage("ja-furigana")}
          className="cursor-pointer rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 aria-pressed:border-zinc-300 aria-pressed:bg-zinc-100 aria-pressed:text-zinc-900"
        >
          {renderFurigana("{日本語|にほんご}（ふりがな）")}
        </button>
      </div>
    </header>
  );
}
