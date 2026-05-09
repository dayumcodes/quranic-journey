import { apiFetch } from "@/lib/api/client";
import { getUserApiBase } from "@/lib/api/userApiBase";
import type { ActivitySession, Collection, Goal, Post, StreakData } from "@/types";

const USER_BASE = getUserApiBase();

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
