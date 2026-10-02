import type { ReactNode } from "react";

// Japanese dictionary strings mark readings inline as {base|reading}, e.g.
// "{建築物|けんちくぶつ}に{変換|へんかん}します" — one shared source for both
// plain Japanese (the braces are just stripped) and Japanese-with-furigana
// (the braces become a real <ruby> annotation), rather than maintaining the
// same sentences twice over.
const FURIGANA_PATTERN = /\{([^|{}]+)\|([^{}]+)\}/g;

/** Plain-text Japanese, for contexts that can't hold markup: aria-label,
 * title, alt, anywhere else only a string (not JSX) is valid. A no-op on
 * English text, since it never contains this markup — safe to call
 * unconditionally regardless of the current language. */
export function stripFurigana(text: string): string {
  return text.replace(FURIGANA_PATTERN, "$1");
}

/** The same text with real <ruby>/<rt> furigana annotations, for visible
 * text content. Renders identically to stripFurigana's output on text with
 * no markup (English, or Japanese strings with no kanji in them). */
export function renderFurigana(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(FURIGANA_PATTERN)) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      // whitespace-nowrap: otherwise the browser can line-wrap a ruby
      // element's base text mid-word, splitting its own reading across two
      // lines — confirmed happening on 進捗 and 保存 in testing.
      //
      // aria-hidden on the reading itself: a screen reader already
      // pronounces 漢字 correctly from the Unicode text alone, so exposing
      // the reading too would just announce it twice. Furigana is a visual
      // aid for sighted readers who know the word but not that kanji, not
      // something assistive tech needs — confirmed this was happening via
      // an accessible-name match in testing (an "Exclude all" button's
      // computed name included its own reading, inline, once it had one).
      <ruby key={key++} className="whitespace-nowrap">
        {match[1]}
        <rp aria-hidden>(</rp>
        <rt aria-hidden>{match[2]}</rt>
        <rp aria-hidden>)</rp>
      </ruby>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
