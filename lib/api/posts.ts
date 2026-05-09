import { apiFetch } from "@/lib/api/client";
import { getUserApiBase } from "@/lib/api/userApiBase";
import type { Post } from "@/types";

const USER_BASE = getUserApiBase();

export const createPost = (payload: Partial<Post>) =>
  apiFetch<Post>(`${USER_BASE}/posts`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
