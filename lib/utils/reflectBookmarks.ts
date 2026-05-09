const STORAGE_KEY = "al_rihla_reflect_bookmarks";

export type LocalReflectBookmark = { verse_key: string; saved_at: string };

export function loadLocalBookmarks(): LocalReflectBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is LocalReflectBookmark => typeof x === "object" && x !== null && typeof (x as LocalReflectBookmark).verse_key === "string")
      .slice(0, 200);
  } catch {
    return [];
  }
}

export function persistLocalBookmarks(list: LocalReflectBookmark[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)));
    window.dispatchEvent(new Event("reflect-bookmarks-changed"));
  } catch {
    /* ignore quota */
  }
}

export function addLocalBookmark(verseKey: string): void {
  const list = loadLocalBookmarks();
  if (list.some((b) => b.verse_key === verseKey)) return;
  list.unshift({ verse_key: verseKey, saved_at: new Date().toISOString() });
  persistLocalBookmarks(list);
}

export function removeLocalBookmark(verseKey: string): void {
  persistLocalBookmarks(loadLocalBookmarks().filter((b) => b.verse_key !== verseKey));
}

export function hasLocalBookmark(verseKey: string): boolean {
  return loadLocalBookmarks().some((b) => b.verse_key === verseKey);
}
