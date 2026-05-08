export function calculateWordsPerMinute(wordsRead: number, durationSeconds: number): number {
  if (!durationSeconds) return 0;
  return Math.round((wordsRead / durationSeconds) * 60);
}
