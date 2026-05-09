/** Browser must not call api.quran.foundation directly (many networks cannot resolve it). Prefer same-origin proxy. */
export function getUserApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_USER_API_BASE_URL?.trim();
  if (!raw || /^https?:\/\/api\.quran\.foundation\b/i.test(raw)) {
    return "/api/qf-user";
  }
  return raw.replace(/\/+$/, "");
}
