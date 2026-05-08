import { apiFetch } from "@/lib/api/client";
import type { AudioRecitation, Chapter, Tafsir, Verse } from "@/types";

const CONTENT_BASE = "https://api.quran.foundation/api/v4";

export const getChapters = async (): Promise<Chapter[]> => {
  const data = await apiFetch<{ chapters: Chapter[] }>(`${CONTENT_BASE}/chapters`);
  return data.chapters;
};

export const getVerseByKey = async (verseKey: string): Promise<Verse> => {
  const data = await apiFetch<{ verse: Verse }>(
    `${CONTENT_BASE}/verses/by_key/${verseKey}?language=en&words=true&translations=131&tafsirs=169`
  );
  return data.verse;
};

export const getRecitationByAyah = async (verseKey: string, recitationId = 7): Promise<AudioRecitation> => {
  const data = await apiFetch<{ audio_files: { verse_key: string; url: string }[] }>(
    `${CONTENT_BASE}/recitations/${recitationId}/by_ayah/${verseKey}`
  );
  const first = data.audio_files[0];
  return { verse_key: first.verse_key, url: first.url };
};

export const getTafsirByAyah = async (verseKey: string): Promise<Tafsir> => {
  const data = await apiFetch<{ tafsir: Tafsir }>(`${CONTENT_BASE}/tafsirs/169/by_ayah/${verseKey}`);
  return data.tafsir;
};
