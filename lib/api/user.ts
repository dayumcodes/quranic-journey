import { apiFetch } from "@/lib/api/client";
import { getUserApiBase } from "@/lib/api/userApiBase";
import type { ActivitySession, Collection, Goal, Post, StreakData } from "@/types";

const USER_BASE = getUserApiBase();

type QfPaged<T> = {
  success?: boolean;
  data?: T[];
  pagination?: Record<string, unknown>;
};

type QfGoalPlan = {
  hasGoal?: boolean;
  goalId?: string;
  id?: string;
  date?: string;
  progress?: number;
  ranges?: string[];
  dailyTargetRanges?: string[];
  remainingDailyTargetRanges?: string[];
  versesRead?: number;
};

type QfStreakRow = {
  id?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  days?: number;
};

type QfActivityDay = {
  id?: string;
  date?: string;
  type?: string;
  ranges?: string[];
  versesRead?: number;
  secondsRead?: number;
};

type QfPostAuthor = {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

type QfReference = {
  chapterId?: number;
  from?: number;
  to?: number;
};

type QfPostRow = {
  id?: string | number;
  authorId?: string;
  author?: QfPostAuthor;
  body?: string;
  createdAt?: string;
  publishedAt?: string;
  updatedAt?: string;
  references?: QfReference[];
};

function qfTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function qfHeaders(): HeadersInit {
  return { "x-timezone": qfTimezone() };
}

function unwrapList<T>(raw: QfPaged<T> | T[]): T[] {
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
}

function toIsoDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function parseRangeChapterId(range?: string | null): number {
  if (!range) return 2;
  const [chapter] = range.split(":");
  const id = Number(chapter);
  return Number.isFinite(id) && id >= 1 && id <= 114 ? id : 2;
}

function parseRangeVerseCount(range?: string | null): number {
  if (!range) return 1;
  const [, verses] = range.split(":");
  if (!verses) return 1;
  const [fromPart, toPart = fromPart] = verses.split("-");
  const from = Number(fromPart);
  const to = Number(toPart);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 1;
  return Math.max(1, Math.abs(to - from) + 1);
}

function normalizeGoalPlan(raw: { data?: QfGoalPlan } | QfGoalPlan): Goal[] {
  const plan = "data" in raw && raw.data ? raw.data : raw;
  if (!plan?.hasGoal && !plan?.goalId) return [];
  const targetRange = plan.dailyTargetRanges?.[0] ?? plan.ranges?.[0] ?? plan.remainingDailyTargetRanges?.[0] ?? null;
  return [
    {
      id: plan.goalId || plan.id || "qf-goal",
      type: "personal",
      target_surah_id: parseRangeChapterId(targetRange),
      verses_per_day: parseRangeVerseCount(targetRange),
      days_per_week: 7,
      target_date: plan.date,
      progress: { user_percentage: Math.round((plan.progress ?? 0) * 100) }
    }
  ];
}

function normalizeStreaks(raw: { data?: QfStreakRow[] } | QfStreakRow[]): StreakData {
  const rows = unwrapList(raw);
  const current = rows[0];
  const days = typeof current?.days === "number" ? current.days : 0;
  return {
    streak_count: days,
    longest_streak: days,
    days_active: current?.startDate && current?.endDate ? [current.startDate, current.endDate] : []
  };
}

export function normalizeQfPost(row: QfPostRow, currentUserId?: string, partnerId?: string): Post {
  const body = (row.body ?? "").trim();
  const isEncouragement = /^encouragement:/i.test(body);
  const verseRef =
    typeof row.references?.[0]?.chapterId === "number" && typeof row.references?.[0]?.from === "number"
      ? `${row.references[0]!.chapterId}:${row.references[0]!.from}${typeof row.references[0]!.to === "number" && row.references[0]!.to !== row.references[0]!.from ? `-${row.references[0]!.to}` : ""}`
      : undefined;
  const authorId = row.authorId || row.author?.id || "";
  const inferredRecipient =
    partnerId && currentUserId && authorId ? (authorId === currentUserId ? partnerId : currentUserId) : undefined;
  return {
    id: String(row.id ?? crypto.randomUUID()),
    type: isEncouragement ? "encouragement" : "reflection",
    author_id: authorId,
    recipient_id: inferredRecipient,
    body: body.replace(/^encouragement:\s*/i, "").trim() || body,
    verse_reference: verseRef,
    created_at: row.createdAt || row.publishedAt || row.updatedAt || new Date().toISOString()
  };
}

function pickPartnerLabelFromProfileJson(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inner =
    "data" in o && typeof o.data === "object" && o.data !== null ? (o.data as Record<string, unknown>) : o;

  const first = typeof inner.firstName === "string" ? inner.firstName.trim() : "";
  const last = typeof inner.lastName === "string" ? inner.lastName.trim() : "";
  const full = `${first} ${last}`.trim();
  if (full) return full;

  const username = typeof inner.username === "string" ? inner.username.trim() : "";
  if (username) return username;

  const email = typeof inner.email === "string" ? inner.email.trim() : "";
  const localPart = email.split("@")[0];
  return localPart || null;
}

/**
 * Best-effort display name from QF profile (authenticated request to user API proxy).
 */
export async function fetchPartnerDisplayName(partnerUserId: string): Promise<string | null> {
  const id = partnerUserId.trim();
  if (!id) return null;
  // Current QF pre-live docs expose the authenticated user's profile, not a documented partner-by-id lookup.
  // Keep this best-effort helper silent to avoid repeat 404s while Pal falls back to local nicknames.
  void id;
  return null;
}

export const getStreaks = async (): Promise<StreakData> =>
  normalizeStreaks(
    await apiFetch<{ data?: QfStreakRow[] }>(
      `${USER_BASE}/streaks?type=QURAN&status=ACTIVE&first=1&orderBy=days&sortOrder=desc`,
      { headers: qfHeaders() }
    )
  );

export const postActivitySession = async (payload: Partial<ActivitySession>): Promise<ActivitySession> => {
  const verseKey = payload.verse_key?.trim();
  const range = verseKey ? `${verseKey}-${verseKey}` : "1:1-1:1";
  const raw = await apiFetch<{ data?: QfActivityDay }>(`${USER_BASE}/activity-days`, {
    method: "POST",
    headers: qfHeaders(),
    body: JSON.stringify({
      type: "QURAN",
      seconds: Math.max(1, Math.floor(payload.duration_seconds ?? 30)),
      ranges: [range],
      mushafId: 4
    })
  });
  const day = raw?.data;
  return {
    id: day?.id || crypto.randomUUID(),
    type: payload.type ?? "reading",
    verse_key: verseKey,
    duration_seconds: payload.duration_seconds ?? day?.secondsRead ?? 0,
    created_at: day?.date || new Date().toISOString()
  };
};

export const getGoals = async (): Promise<Goal[]> =>
  normalizeGoalPlan(
    await apiFetch<{ data?: QfGoalPlan }>(`${USER_BASE}/goals/get-todays-plan?type=QURAN_RANGE`, {
      headers: qfHeaders()
    })
  );

export const postGoal = (payload: Partial<Goal>) =>
  apiFetch<{ success?: boolean; data?: { id?: string } }>(`${USER_BASE}/goals?mushafId=4`, {
    method: "POST",
    headers: qfHeaders(),
    body: JSON.stringify({
      type: "QURAN_RANGE",
      amount: Math.max(1, Math.floor(payload.verses_per_day ?? 1)),
      duration: Math.min(7, Math.max(1, Math.floor(payload.days_per_week ?? 7))),
      category: "QURAN"
    })
  });

export const getCollections = () => apiFetch<Collection[]>(`${USER_BASE}/collections`);
export const postCollection = (payload: Record<string, unknown>) =>
  apiFetch<Collection>(`${USER_BASE}/collections`, { method: "POST", body: JSON.stringify(payload) });

export const getActivity = async (from: string, to: string, userIds?: string): Promise<ActivitySession[]> => {
  if (userIds) {
    throw new Error("Cross-user activity-day queries are not available on the documented QF pre-live endpoints.");
  }
  const raw = await apiFetch<{ data?: QfActivityDay[] }>(
    `${USER_BASE}/activity-days?from=${encodeURIComponent(toIsoDate(from))}&to=${encodeURIComponent(toIsoDate(to))}&type=QURAN`,
    { headers: qfHeaders() }
  );
  const rows = unwrapList(raw);
  return rows.flatMap((row) => {
    const count = Math.max(0, Math.floor(row.versesRead ?? 0));
    return Array.from({ length: count || 0 }, (_, idx) => ({
      id: `${row.id ?? row.date ?? "activity"}:${idx}`,
      type: "reading",
      verse_key: row.ranges?.[0]?.split("-")[0],
      duration_seconds: row.secondsRead,
      created_at: row.date || new Date().toISOString()
    }));
  });
};

export const getPosts = async (id1: string, id2: string): Promise<Post[]> => {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", "20");
  params.set("sortBy", "latest");
  params.set("filter[authors][0]", id1);
  params.set("filter[authors][1]", id2);
  const raw = await apiFetch<QfPaged<QfPostRow>>(`${USER_BASE}/posts/feed?${params.toString()}`);
  return unwrapList(raw)
    .map((row) => normalizeQfPost(row, id1, id2))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};
