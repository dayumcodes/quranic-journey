import { apiFetch } from "@/lib/api/client";
import type { Post } from "@/types";

const USER_BASE = (process.env.NEXT_PUBLIC_USER_API_BASE_URL ?? "https://api.quran.foundation/api/v1").replace(/\/+$/, "");

export const createPost = (payload: Partial<Post>) =>
  apiFetch<Post>(`${USER_BASE}/posts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
