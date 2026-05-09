import { RequestError } from "@/lib/api/client";
import type { AudioRecitation, Chapter, Tafsir, Verse } from "@/types";

/** Same-origin proxy → `GET /content/api/v4/…` + `x-auth-token` / `x-client-id` on the server ([quickstart](https://api-docs.quran.foundation/docs/quickstart/)). */
async function qfProxyJson<T>(pathWithQuery: string): Promise<T> {
  const clean = pathWithQuery.startsWith("/") ? pathWithQuery.slice(1) : pathWithQuery;
  const url = `/api/qf/${clean}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  });
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const raw = await res.text();
      if (raw.length > 0 && raw.length < 500) {
        try {
          const body = JSON.parse(raw) as { message?: string };
          if (body.message) message = body.message;
        } catch {
          message = raw.trim() || message;
        }
      }
    } catch {
      /* keep default message */
    }
    throw new RequestError(res.status, message);
  }
  return (await res.json()) as T;
}

export const getChapters = async (): Promise<Chapter[]> => {
  const data = await qfProxyJson<{ chapters: Chapter[] }>("chapters?language=en");
  return data.chapters ?? [];
};

/**
 * Merges two `verses/by_key` responses:
 * - **Script-focused** (`words=false`) returns full `text_uthmani` / Imlaʾi variants (readable with Amiri).
 * - **Word-focused** (`words=true`) returns word timings/translations but often only mushaf stacking glyphs in `words[].text`/`code_v1`, which must not be used alone for paragraph display.
 *
 * Same pattern applies to verses-by-page: verse objects expose `text_uthmani` when not reduced to glyphs-only payloads.
 */
export const getVerseByKey = async (verseKey: string): Promise<Verse> => {
  const enc = encodeURIComponent(verseKey);
  const verseFields = "text_uthmani,text_uthmani_simple,text_imlaei,text_imlaei_simple";
  const scriptsQuery = `verses/by_key/${enc}?language=en&translations=131&tafsirs=169&fields=${encodeURIComponent(verseFields)}`;
  const wbwQuery = `${scriptsQuery}&words=true`;

  const settled = await Promise.allSettled([qfProxyJson<{ verse: Verse }>(scriptsQuery), qfProxyJson<{ verse: Verse }>(wbwQuery)]);

  const scriptPack = settled[0];
  const wbwPack = settled[1];

  if (scriptPack.status === "rejected" && wbwPack.status === "rejected") {
    throw scriptPack.reason ?? wbwPack.reason;
  }

  const scriptVerse = scriptPack.status === "fulfilled" ? scriptPack.value.verse : undefined;
  const wbwVerse = wbwPack.status === "fulfilled" ? wbwPack.value.verse : undefined;

  if (!wbwVerse && scriptVerse) {
    return { ...scriptVerse, words: scriptVerse.words ?? [] };
  }

  if (wbwVerse && !scriptVerse) {
    return { ...wbwVerse, words: wbwVerse.words ?? [] };
  }

  const s = scriptVerse!;
  const w = wbwVerse!;

  return {
    ...w,
    words: w.words ?? s.words ?? [],
    text_uthmani: s.text_uthmani ?? w.text_uthmani,
    text_uthmani_simple: s.text_uthmani_simple ?? w.text_uthmani_simple,
    text_imlaei: s.text_imlaei ?? w.text_imlaei,
    text_imlaei_simple: s.text_imlaei_simple ?? w.text_imlaei_simple
  };
};

export const getRecitationByAyah = async (verseKey: string, recitationId = 7): Promise<AudioRecitation> => {
  const encodedKey = encodeURIComponent(verseKey);
  const data = await qfProxyJson<{ audio_files?: { verse_key: string; url: string }[] }>(
    `recitations/${encodeURIComponent(String(recitationId))}/by_ayah/${encodedKey}`
  );
  const first = data.audio_files?.[0];
  if (!first?.url) throw new Error("No recitation audio returned.");
  return { verse_key: first.verse_key, url: first.url };
};

export const getTafsirByAyah = async (verseKey: string): Promise<Tafsir> => {
  const data = await qfProxyJson<{ tafsir: Tafsir }>(
    `tafsirs/169/by_ayah/${encodeURIComponent(verseKey)}`
  );
  return data.tafsir;
};
