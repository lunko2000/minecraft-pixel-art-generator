"use client";

import { renderFurigana, stripFurigana } from "./furigana";
import { useLanguage } from "./use-language";

/**
 * Wraps a translated string for display as visible text content. Renders
 * real furigana when that's the active language, otherwise the plain text
 * (the {base|reading} markup stripped). Use this for anything that ends up
 * as rendered text on the page; for an aria-label, title, alt, or any other
 * plain-string context, call stripFurigana directly instead — those can't
 * hold the <ruby> markup this produces.
 */
export function T({ children }: { children: string }) {
  const { language } = useLanguage();
  return language === "ja-furigana" ? renderFurigana(children) : stripFurigana(children);
}
