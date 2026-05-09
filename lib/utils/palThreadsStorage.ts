import {
  clearStoredPartnerId,
  isLikelyPartnerUserId as isValidPalParticipantId,
  loadStoredPartnerDisplayName,
  loadStoredPartnerId
} from "@/lib/utils/palPartnerStorage";

export type PalThread = {
  partnerId: string;
  displayName: string;
  updatedAt: number;
};

const THREADS_KEY = (uid: string) => `al_rihla_pal_threads_v2:${uid}`;
const ACTIVE_KEY = (uid: string) => `al_rihla_pal_active_thread:${uid}`;

function safeParse(raw: string | null): PalThread[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (row): row is PalThread =>
          !!row &&
          typeof row === "object" &&
          typeof (row as PalThread).partnerId === "string" &&
          isValidPalParticipantId((row as PalThread).partnerId) &&
          typeof (row as PalThread).displayName === "string"
      )
      .map((t) => ({
        partnerId: t.partnerId.trim(),
        displayName: t.displayName.trim() || "Pal",
        updatedAt: typeof t.updatedAt === "number" ? t.updatedAt : Date.now()
      }));
  } catch {
    return [];
  }
}

export function loadPalThreads(userId: string): PalThread[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(THREADS_KEY(userId)));
  } catch {
    return [];
  }
}

export function savePalThreads(userId: string, threads: PalThread[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THREADS_KEY(userId), JSON.stringify(threads));
  } catch {
    /* ignore */
  }
}

/** One-time migrate from legacy single-partner keys + legacy storage */
export function migrateLegacyPartnerIntoThreads(userId: string): PalThread[] {
  if (typeof window === "undefined") return [];
  let threads = loadPalThreads(userId);
  const legacyPid = loadStoredPartnerId(userId);
  const legacyName = loadStoredPartnerDisplayName(userId);
  if (legacyPid && isValidPalParticipantId(legacyPid) && !threads.some((t) => t.partnerId === legacyPid)) {
    threads = [{ partnerId: legacyPid, displayName: legacyName || "Partner", updatedAt: Date.now() }, ...threads];
    savePalThreads(userId, threads);
    clearStoredPartnerId(userId);
  }
  return threads;
}

export function upsertPalThread(userId: string, partnerId: string, displayName?: string): PalThread[] {
  const pid = partnerId.trim();
  if (!isValidPalParticipantId(pid) || pid === userId) return loadPalThreads(userId);
  const threads = loadPalThreads(userId);
  const name = displayName?.trim() || threads.find((t) => t.partnerId === pid)?.displayName || "Partner";
  const next = threads.filter((t) => t.partnerId !== pid);
  next.unshift({ partnerId: pid, displayName: name || "Partner", updatedAt: Date.now() });
  savePalThreads(userId, next);
  return next;
}

export function removePalThread(userId: string, partnerId: string): PalThread[] {
  const next = loadPalThreads(userId).filter((t) => t.partnerId !== partnerId.trim());
  savePalThreads(userId, next);
  return next;
}

/**
 * Link two Quran Foundation IDs in local pal lists when one person adds the other,
 * plus mirror so the partner’s bucket on this browser already lists you under your account name.
 * Cross-browser sync still requires both people to accept an invite once.
 */
export function establishMutualPalLink(params: {
  myUserId: string;
  partnerId: string;
  partnerDisplayName: string;
  myDisplayNameForPartner: string;
}): PalThread[] {
  const { myUserId, partnerId, partnerDisplayName, myDisplayNameForPartner } = params;
  const trimmedPartner = partnerId.trim();
  if (!isValidPalParticipantId(trimmedPartner) || trimmedPartner === myUserId.trim()) return loadPalThreads(myUserId);

  upsertPalThread(trimmedPartner, myUserId.trim(), myDisplayNameForPartner.trim() || "Pal");
  return upsertPalThread(myUserId.trim(), trimmedPartner, partnerDisplayName.trim() || "Pal");
}

/** Removes the link from both local pal lists (same-browser mirror). */
export function removeMirroredPalLink(myUserId: string, partnerId: string): PalThread[] {
  const pid = partnerId.trim();
  const mid = myUserId.trim();
  removePalThread(pid, mid);
  return removePalThread(mid, pid);
}

export function renamePalThread(userId: string, partnerId: string, displayName: string): PalThread[] {
  const next = loadPalThreads(userId).map((t) =>
    t.partnerId === partnerId.trim() ? { ...t, displayName: displayName.trim() || t.displayName, updatedAt: Date.now() } : t
  );
  savePalThreads(userId, next);
  return next;
}

export function loadActiveThreadId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ACTIVE_KEY(userId))?.trim();
    return v && isValidPalParticipantId(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveActiveThreadId(userId: string, partnerId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!partnerId) localStorage.removeItem(ACTIVE_KEY(userId));
    else localStorage.setItem(ACTIVE_KEY(userId), partnerId.trim());
  } catch {
    /* ignore */
  }
}

/** Merge shared-goal partner ids into thread list without clobbering names */
export function syncThreadsFromGoals(userId: string, goals: { type?: string; partner_id?: string }[]): PalThread[] {
  migrateLegacyPartnerIntoThreads(userId);
  let threads = loadPalThreads(userId);
  const partnerIds = new Set<string>();
  for (const g of goals) {
    const pid = g.partner_id?.trim();
    if (g.type !== "shared" || !pid || !isValidPalParticipantId(pid) || pid === userId) continue;
    partnerIds.add(pid);
  }
  for (const pid of partnerIds) {
    if (!threads.some((t) => t.partnerId === pid)) {
      threads.unshift({ partnerId: pid, displayName: "Partner", updatedAt: Date.now() });
    }
  }
  savePalThreads(userId, threads);
  return threads;
}
