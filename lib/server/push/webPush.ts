import webpush, { type PushSubscription } from "web-push";

type WebPushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

let vapidConfigured = false;

function readWebPushConfig(): WebPushConfig | null {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

function ensureVapid(): WebPushConfig | null {
  const cfg = readWebPushConfig();
  if (!cfg) return null;
  if (!vapidConfigured) {
    webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
    vapidConfigured = true;
  }
  return cfg;
}

export function isWebPushConfigured(): boolean {
  return !!readWebPushConfig();
}

export function getWebPushPublicKey(): string | null {
  return readWebPushConfig()?.publicKey ?? null;
}

export type StoredPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type WebPushSendResult =
  | { ok: true }
  | {
      ok: false;
      statusCode?: number;
      permanentFailure: boolean;
      message: string;
    };

export async function sendWebPushNotification(
  subscription: StoredPushSubscription,
  payload: Record<string, unknown>
): Promise<WebPushSendResult> {
  const cfg = ensureVapid();
  if (!cfg) {
    return {
      ok: false,
      permanentFailure: false,
      message: "Missing WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY / WEB_PUSH_SUBJECT."
    };
  }
  try {
    await webpush.sendNotification(subscription as PushSubscription, JSON.stringify(payload), {
      TTL: 60
    });
    return { ok: true };
  } catch (err) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err && typeof (err as { statusCode?: number }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : undefined;
    return {
      ok: false,
      statusCode,
      permanentFailure: statusCode === 404 || statusCode === 410,
      message: err instanceof Error ? err.message : "Web Push delivery failed."
    };
  }
}
