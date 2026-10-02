"use client";

import { en } from "./en";
import { ja } from "./ja";
import { useLanguage } from "./use-language";

// "ja-furigana" intentionally reuses the exact same dictionary as "ja" — the
// text is identical either way, only how it's *rendered* differs (plain vs.
// with <ruby> annotations), which components handle via <T> / stripFurigana,
// not by picking a different dictionary. See furigana.tsx.
const dictionaries = { en, ja, "ja-furigana": ja };

export function useTranslations() {
  const { language } = useLanguage();
  return dictionaries[language];
}
