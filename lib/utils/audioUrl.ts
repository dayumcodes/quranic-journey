/** Normalize Quran Foundation audio file paths to absolute HTTPS URLs for Howler. */
export function normalizeRecitationAudioUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `https://verses.quran.foundation/${path}`;
}
