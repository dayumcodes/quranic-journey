import { apiFetch } from "@/lib/api/client";
import type { ActivitySession, Collection, Goal, Post, StreakData } from "@/types";

const USER_BASE = (process.env.NEXT_PUBLIC_USER_API_BASE_URL ?? "https://api.quran.foundation/api/v1").replace(/\/+$/, "");

export const getStreaks = () => apiFetch<StreakData>(`${USER_BASE}/streaks`);
export const postActivitySession = (payload: Partial<ActivitySession>) =>
  apiFetch<ActivitySession>(`${USER_BASE}/activity/sessions`, { method: "POST", body: JSON.stringify(payload) });
export const getGoals = () => apiFetch<Goal[]>(`${USER_BASE}/goals`);
export const postGoal = (payload: Partial<Goal>) =>
  apiFetch<Goal>(`${USER_BASE}/goals`, { method: "POST", body: JSON.stringify(payload) });
export const getCollections = () => apiFetch<Collection[]>(`${USER_BASE}/collections`);
export const postCollection = (payload: Record<string, unknown>) =>
  apiFetch<Collection>(`${USER_BASE}/collections`, { method: "POST", body: JSON.stringify(payload) });
export const getActivity = (from: string, to: string) => apiFetch<ActivitySession[]>(`${USER_BASE}/activity?from=${from}&to=${to}`);
export const getPosts = (id1: string, id2: string) =>
  apiFetch<Post[]>(`${USER_BASE}/posts?user_ids=${id1},${id2}&type=reflection,encouragement`);
