import type { NextRequest } from "next/server";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { createPalMessage, listPalMessages, palLinkExists } from "@/lib/server/pals/palsDb";
import { notifyPalMessageRecipient } from "@/lib/server/push/palMessageNotifications";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export const dynamic = "force-dynamic";

type CreatePalMessageBody = {
  partnerId?: string;
  type?: string;
  body?: string;
  verseReference?: string;
};

function dbMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (/violates check constraint|check constraint/i.test(raw) && /body|pal_messages_body/i.test(raw)) {
    return "Message could not be saved: the database still enforces a minimum length on pal messages. In Supabase SQL, run migration `011_drop_pal_messages_body_min_6.sql` (or drop constraint `pal_messages_body_check`).";
  }
  if (/pal_messages/i.test(raw) && /does not exist|relation.*not exist/i.test(raw)) {
    return "Pal messages database not ready. Run the latest pals migration for this deployment.";
  }
  return raw || fallback;
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const partnerId = req.nextUrl.searchParams.get("partnerId")?.trim() ?? "";
  if (!isLikelyPartnerUserId(partnerId) || partnerId === auth.userId) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }

  try {
    const linked = await palLinkExists(auth.userId, partnerId);
    if (!linked) {
      return Response.json({ message: "Link this pal first before opening shared messages." }, { status: 403 });
    }
    const messages = await listPalMessages(auth.userId, partnerId);
    return Response.json({ messages });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not load pal messages.") }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: CreatePalMessageBody;
  try {
    body = (await req.json()) as CreatePalMessageBody;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const partnerId = body.partnerId?.trim() ?? "";
  if (!isLikelyPartnerUserId(partnerId) || partnerId === auth.userId) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }

  const rawType = body.type?.trim() ?? "reflection";
  const type = rawType === "encouragement" ? "encouragement" : rawType === "reflection" ? "reflection" : null;
  if (!type) {
    return Response.json({ message: "Invalid message type." }, { status: 400 });
  }

  const rawBody = (body.body ?? "").trim();
  const normalizedBody = type === "encouragement" ? rawBody.replace(/^encouragement:\s*/i, "").trim() : rawBody;
  if (normalizedBody.length < 1) {
    return Response.json({ message: "Message cannot be empty." }, { status: 422 });
  }

  try {
    const linked = await palLinkExists(auth.userId, partnerId);
    if (!linked) {
      return Response.json({ message: "Link this pal first before sending shared messages." }, { status: 403 });
    }

    const message = await createPalMessage({
      authorId: auth.userId,
      recipientId: partnerId,
      type,
      body: normalizedBody,
      verseReference: body.verseReference?.trim()
    });

    try {
      await notifyPalMessageRecipient(message);
    } catch (notificationErr) {
      console.warn("[pal-messages] push notification failed", {
        messageId: message.id,
        recipientId: message.recipientId,
        error: notificationErr instanceof Error ? notificationErr.message : String(notificationErr)
      });
    }

    return Response.json({ message }, { status: 201 });
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not save pal message.") }, { status: 503 });
  }
}
