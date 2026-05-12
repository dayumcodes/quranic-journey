import { apiFetch } from "@/lib/api/client";
import type { PalNotificationSummary } from "@/types";

const notificationFetchOpts = { logoutOnUnauthorized: false as const };

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function getPalNotificationSummary(): Promise<PalNotificationSummary> {
  return apiFetch<PalNotificationSummary>("/api/pal-notifications", notificationFetchOpts);
}

export async function markPalMessagesRead(partnerId: string): Promise<PalNotificationSummary> {
  return apiFetch<PalNotificationSummary>("/api/pal-notifications", {
    ...notificationFetchOpts,
    method: "POST",
    body: JSON.stringify({ partnerId })
  });
}

export async function getPushSubscriptionConfig(): Promise<{ configured: boolean; publicKey: string | null }> {
  return apiFetch<{ configured: boolean; publicKey: string | null }>("/api/push-subscriptions", notificationFetchOpts);
}

function normalizeSubscriptionPayload(raw: PushSubscription | PushSubscriptionJSON | PushSubscriptionBody): PushSubscriptionBody {
  if (typeof PushSubscription !== "undefined" && raw instanceof PushSubscription) {
    const json = raw.toJSON();
    return {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth
      }
    };
  }
  const body = raw as PushSubscriptionJSON | PushSubscriptionBody;
  return {
    endpoint: body.endpoint,
    keys: {
      p256dh: body.keys?.p256dh,
      auth: body.keys?.auth
    }
  };
}

export async function savePushSubscription(raw: PushSubscription | PushSubscriptionJSON | PushSubscriptionBody): Promise<void> {
  const payload = normalizeSubscriptionPayload(raw);
  await apiFetch<{ success: boolean }>("/api/push-subscriptions", {
    ...notificationFetchOpts,
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await apiFetch<{ success: boolean }>("/api/push-subscriptions", {
    ...notificationFetchOpts,
    method: "DELETE",
    body: JSON.stringify({ endpoint })
  });
}
