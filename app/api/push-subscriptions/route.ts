import type { NextRequest } from "next/server";
import { deletePushSubscription, upsertPushSubscription } from "@/lib/server/pals/palsDb";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { getWebPushPublicKey, isWebPushConfigured } from "@/lib/server/push/webPush";

export const dynamic = "force-dynamic";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

function dbMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (/push_subscriptions/i.test(raw)) {
    return "Push notifications database not ready. Run the latest pals migration for this deployment.";
  }
  return raw || fallback;
}

function parseSubscriptionBody(raw: unknown): PushSubscriptionBody | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as PushSubscriptionBody;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) return null;
  return {
    endpoint,
    keys: {
      p256dh,
      auth
    }
  };
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  return Response.json({
    configured: isWebPushConfigured(),
    publicKey: getWebPushPublicKey()
  });
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });
  if (!isWebPushConfigured()) {
    return Response.json({ message: "Push notifications are not configured on this deployment." }, { status: 503 });
  }

  let parsed: PushSubscriptionBody | null = null;
  try {
    parsed = parseSubscriptionBody(await req.json());
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed?.endpoint || !parsed.keys?.p256dh || !parsed.keys?.auth) {
    return Response.json({ message: "Invalid push subscription." }, { status: 400 });
  }

  try {
    const subscription = await upsertPushSubscription({
      userId: auth.userId,
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
      userAgent: req.headers.get("user-agent") ?? ""
    });
    return Response.json({ success: true, subscription: { endpoint: subscription.endpoint } });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not save push subscription.") }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: { endpoint?: string } = {};
  try {
    body = (await req.json()) as { endpoint?: string };
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = body.endpoint?.trim() ?? "";
  if (!endpoint) {
    return Response.json({ message: "Missing subscription endpoint." }, { status: 400 });
  }

  try {
    await deletePushSubscription(auth.userId, endpoint);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not remove push subscription.") }, { status: 503 });
  }
}
