import { apiFetch } from "@/lib/api/client";

export type SyncedPal = {
  partnerId: string;
  displayName: string;
  updatedAt: number;
};

export function getPals() {
  return apiFetch<{ pals: SyncedPal[] }>("/api/pals");
}

export function acceptPal(payload: {
  partnerId: string;
  partnerDisplayName?: string;
  myDisplayNameForPartner?: string;
}) {
  return apiFetch<{ success: true }>("/api/pals/accept", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function removePal(partnerId: string) {
  return apiFetch<{ success: true }>(`/api/pals/${encodeURIComponent(partnerId)}`, {
    method: "DELETE"
  });
}
