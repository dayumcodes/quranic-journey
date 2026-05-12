import { apiFetch } from "@/lib/api/client";
import type { UserProfile } from "@/types";

const opts = { logoutOnUnauthorized: false as const };

export function getMyProfile(): Promise<{ profile: UserProfile | null }> {
  return apiFetch<{ profile: UserProfile | null }>("/api/profile", opts);
}

export function updateMyProfile(displayName: string): Promise<{ profile: UserProfile }> {
  return apiFetch<{ profile: UserProfile }>("/api/profile", {
    ...opts,
    method: "PUT",
    body: JSON.stringify({ displayName })
  });
}
