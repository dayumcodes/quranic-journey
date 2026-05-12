import { deletePushSubscriptionByEndpoint, getUserProfile, listPushSubscriptions, type PalMessageRow } from "@/lib/server/pals/palsDb";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/server/push/webPush";

function preview(body: string, limit = 96): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, Math.max(0, limit - 1)).trimEnd()}...`;
}

export async function notifyPalMessageRecipient(message: PalMessageRow): Promise<void> {
  if (!isWebPushConfigured()) return;

  const subscriptions = await listPushSubscriptions(message.recipientId);
  if (subscriptions.length === 0) return;

  const senderProfile = await getUserProfile(message.authorId).catch(() => null);
  const senderName = senderProfile?.displayName?.trim() || "Your pal";
  const shortPreview = preview(message.body);
  const payload = {
    title: message.type === "encouragement" ? `${senderName} sent encouragement` : `${senderName} sent a new message`,
    body: shortPreview,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `pal-thread:${message.authorId}`,
    renotify: true,
    data: {
      url: `/pal?thread=${encodeURIComponent(message.authorId)}`,
      partnerId: message.authorId,
      sourceKey: `pal-message:${message.id}`,
      messageType: message.type
    }
  };

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const result = await sendWebPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        payload
      );

      if (!result.ok && result.permanentFailure) {
        await deletePushSubscriptionByEndpoint(subscription.endpoint);
        return;
      }

      if (!result.ok) {
        console.warn("[pal-notifications] web push delivery failed", {
          endpointSuffix: subscription.endpoint.slice(-24),
          statusCode: result.statusCode,
          message: result.message
        });
      }
    })
  );
}
