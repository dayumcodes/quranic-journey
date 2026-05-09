const PREFIX_ID = "al_rihla_pal_partner_id:";
const PREFIX_NAME = "al_rihla_pal_partner_name:";

export const PAL_PARTNER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isLikelyPartnerUserId(raw: string): boolean {
  return PAL_PARTNER_UUID_RE.test(raw.trim());
}

export function loadStoredPartnerId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(PREFIX_ID + userId)?.trim();
    return v && isLikelyPartnerUserId(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveStoredPartnerId(userId: string, partnerId: string): void {
  if (typeof window === "undefined") return;
  if (!isLikelyPartnerUserId(partnerId)) return;
  try {
    localStorage.setItem(PREFIX_ID + userId, partnerId.trim());
  } catch {
    /* ignore */
  }
}

export function clearStoredPartnerId(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFIX_ID + userId);
    localStorage.removeItem(PREFIX_NAME + userId);
  } catch {
    /* ignore */
  }
}

export function loadStoredPartnerDisplayName(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const n = localStorage.getItem(PREFIX_NAME + userId)?.trim();
    return n && n.length > 0 ? n.slice(0, 48) : null;
  } catch {
    return null;
  }
}

export function saveStoredPartnerDisplayName(userId: string, name: string): void {
  if (typeof window === "undefined") return;
  const t = name.trim();
  if (!t) {
    try {
      localStorage.removeItem(PREFIX_NAME + userId);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    localStorage.setItem(PREFIX_NAME + userId, t.slice(0, 48));
  } catch {
    /* ignore */
  }
}

export function partnerIdFromGoals(goals: { type: string; partner_id?: string }[]): string | null {
  const g = goals.find((x) => x.type === "shared" && x.partner_id && isLikelyPartnerUserId(x.partner_id));
  return g?.partner_id?.trim() ?? null;
}
