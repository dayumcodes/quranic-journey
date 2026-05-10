import { apiFetch } from "@/lib/api/client";

export type SyncedPal = {
  partnerId: string;
  displayName: string;
  updatedAt: number;
};

const palsFetchOpts = { logoutOnUnauthorized: false as const };

export function getPals() {
  return apiFetch<{ pals: SyncedPal[] }>("/api/pals", palsFetchOpts);
}

export function acceptPal(payload: {
  partnerId: string;
  partnerDisplayName?: string;
  myDisplayNameForPartner?: string;
}) {
  return apiFetch<{ success: true }>("/api/pals/accept", {
    ...palsFetchOpts,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function removePal(partnerId: string) {
  return apiFetch<{ success: true }>(`/api/pals/${encodeURIComponent(partnerId)}`, {
    ...palsFetchOpts,
    method: "DELETE"
  });
}
