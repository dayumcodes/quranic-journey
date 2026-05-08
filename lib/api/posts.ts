import { apiFetch } from "@/lib/api/client";
import type { Post } from "@/types";

const USER_BASE = "https://api.quran.foundation/api/v1";

export const createPost = (payload: Partial<Post>) =>
  apiFetch<Post>(`${USER_BASE}/posts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
