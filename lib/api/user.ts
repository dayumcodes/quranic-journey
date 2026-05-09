import { apiFetch } from "@/lib/api/client";
import { getUserApiBase } from "@/lib/api/userApiBase";
import type { ActivitySession, Collection, Goal, Post, StreakData } from "@/types";

const USER_BASE = getUserApiBase();

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
  const paths = [`${USER_BASE}/users/${encodeURIComponent(id)}`, `${USER_BASE}/user/${encodeURIComponent(id)}`];
  for (const url of paths) {
    try {
      const raw = await apiFetch<unknown>(url);
      const label = pickPartnerLabelFromProfileJson(raw);
      if (label) return label;
    } catch {
      /* try alternate path */
    }
  }
  return null;
}

export const getStreaks = () => apiFetch<StreakData>(`${USER_BASE}/streaks`);
export const postActivitySession = (payload: Partial<ActivitySession>) =>
  apiFetch<ActivitySession>(`${USER_BASE}/activity/sessions`, { method: "POST", body: JSON.stringify(payload) });
export const getGoals = () => apiFetch<Goal[]>(`${USER_BASE}/goals`);
export const postGoal = (payload: Partial<Goal>) =>
  apiFetch<Goal>(`${USER_BASE}/goals`, { method: "POST", body: JSON.stringify(payload) });
export const getCollections = () => apiFetch<Collection[]>(`${USER_BASE}/collections`);
export const postCollection = (payload: Record<string, unknown>) =>
  apiFetch<Collection>(`${USER_BASE}/collections`, { method: "POST", body: JSON.stringify(payload) });
export const getActivity = (from: string, to: string, userIds?: string) =>
  apiFetch<ActivitySession[]>(
    `${USER_BASE}/activity?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${userIds ? `&user_ids=${encodeURIComponent(userIds)}` : ""}`
  );
export const getPosts = (id1: string, id2: string) =>
  apiFetch<Post[]>(`${USER_BASE}/posts?user_ids=${id1},${id2}&type=reflection,encouragement`);
