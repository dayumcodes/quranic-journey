import { apiFetch } from "@/lib/api/client";
import type { Goal } from "@/types";

type PalSharedGoalApiRow = {
  id?: string;
  partnerId?: string;
  targetSurahId?: number;
  versesPerDay?: number;
  daysPerWeek?: number;
  targetDate?: string;
};

const palSharedGoalsFetchOpts = { logoutOnUnauthorized: false as const };

function normalizePalSharedGoal(row: PalSharedGoalApiRow): Goal {
  return {
    id: row.id?.trim() || crypto.randomUUID(),
    type: "shared",
    partner_id: row.partnerId?.trim() || undefined,
    target_surah_id: Math.min(114, Math.max(1, Math.floor(row.targetSurahId ?? 2))),
    verses_per_day: Math.max(1, Math.floor(row.versesPerDay ?? 1)),
    days_per_week: Math.min(7, Math.max(1, Math.floor(row.daysPerWeek ?? 7))),
    target_date: row.targetDate?.trim() || undefined,
    progress: { user_percentage: 0, partner_percentage: 0 }
  };
}

export async function getPalSharedGoals(partnerId?: string): Promise<Goal[]> {
  const query = partnerId?.trim() ? `?partnerId=${encodeURIComponent(partnerId.trim())}` : "";
  const raw = await apiFetch<{ goals?: PalSharedGoalApiRow[] }>(`/api/pal-shared-goals${query}`, palSharedGoalsFetchOpts);
  return Array.isArray(raw.goals) ? raw.goals.map(normalizePalSharedGoal) : [];
}

export async function createPalSharedGoal(payload: {
  partnerId: string;
  targetSurahId: number;
  versesPerDay: number;
  daysPerWeek: number;
  targetDate?: string;
}): Promise<Goal> {
  const raw = await apiFetch<{ goal?: PalSharedGoalApiRow }>(
    "/api/pal-shared-goals",
    {
      ...palSharedGoalsFetchOpts,
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
  return normalizePalSharedGoal(raw.goal ?? {});
}
