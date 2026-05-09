/** Detect Arabic / Quranic glyph blocks including presentation forms (outside U+0600..06FF). */
export function looksLikeArabicScript(s: string): boolean {
  if (!s) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(s);
}
