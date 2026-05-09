import type { Verse } from "@/types";

/** Mushaf “v1/v2” glyphs (Uthmani stacking) — not meant for ordinary web fonts ([see Content API schemas](https://api-docs.quran.foundation/docs/content_apis_versioned/verses-by-verse-key)). */
export function isMushafGlyphString(s: string): boolean {
  return /[\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s);
}

function orderedWords(v: Verse): Verse["words"] {
  return [...(v.words ?? [])].sort((a, b) => a.position - b.position);
}

/**
 * Readable Arabic for typography (Amiri, etc.): use verse-level Uthmani / Imlaʾi scripts.
 * Do not concatenate `words[].code_v1`/`text` mushaf glyphs for display—they won’t match what standard fonts paint.
 */
function wordReadableArabicFallback(word: Verse["words"][number]): string {
  const w = word as Verse["words"][number] & { text?: string; code_v1?: string };
  const t = (w.text_uthmani ?? w.text ?? "").trim();
  if (!t || isMushafGlyphString(t)) return "";
  return t;
}

export function verseArabicDisplay(verse: Verse): string {
  const line =
    verse.text_uthmani?.trim() ||
    verse.text_imlaei?.trim() ||
    verse.text_uthmani_simple?.trim() ||
    verse.text_imlaei_simple?.trim();

  if (line) return line;

  const fromWords = orderedWords(verse)
    .map(wordReadableArabicFallback)
    .filter(Boolean)
    .join(" ");

  const compact = fromWords.replace(/\s+/g, "").trim();
  return compact || "";
}

/** Prefer verse-level `translations`, else concatenate word translations (common on pre-live). */
export function verseTranslationDisplay(verse: Verse, fallback: string): string {
  const fromVerse = verse.translations?.[0]?.text?.trim();
  if (fromVerse) return fromVerse;

  const fromWords =
    orderedWords(verse)
      .map((w) => w.translation?.text?.trim())
      .filter((t): t is string => !!t && !/^\(\d+\)$/.test(t))
      .join(" ")
      .trim() ?? "";

  return fromWords || fallback;
}
