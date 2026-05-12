import { apiFetch } from "@/lib/api/client";
import type { PalReadingSnapshot } from "@/types";

const opts = { logoutOnUnauthorized: false as const };

function palProgressHeaders(): HeadersInit {
  return {
    "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  };
}

/** Must stay in sync with server `ReadingProgressPatch` in palsDb. */
export type PalProgressPatch = Partial<{
  targetSurahId: number;
  versesReadWeek: number;
  totalVersesRead: number;
  weeklyGoal: number;
}>;

export async function getPalProgress(partnerId?: string | null): Promise<{
  self: PalReadingSnapshot | null;
  partner: PalReadingSnapshot | null;
}> {
  const q = partnerId?.trim() ? `?partnerId=${encodeURIComponent(partnerId.trim())}` : "";
  return apiFetch<{ self: PalReadingSnapshot | null; partner: PalReadingSnapshot | null }>(`/api/pal-progress${q}`, {
    ...opts,
    headers: palProgressHeaders()
  });
}

export async function putPalProgress(patch: PalProgressPatch): Promise<{ self: PalReadingSnapshot }> {
  return apiFetch<{ self: PalReadingSnapshot }>("/api/pal-progress", {
    ...opts,
    headers: palProgressHeaders(),
    method: "PUT",
    body: JSON.stringify(patch)
  });
}
