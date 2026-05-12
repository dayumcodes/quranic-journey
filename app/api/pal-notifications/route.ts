import type { NextRequest } from "next/server";
import { listPalUnreadThreads, markPalThreadRead, palLinkExists } from "@/lib/server/pals/palsDb";
import { resolveAuthenticatedUser } from "@/lib/server/pals/auth";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";
import type { PalNotificationSummary, PalUnreadThread } from "@/types";

export const dynamic = "force-dynamic";

type MarkReadBody = {
  partnerId?: string;
};

function dbMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : "";
  if (/pal_message_reads|pal_messages|pal_links/i.test(raw)) {
    return "Pal notifications database not ready. Run the latest pals migration for this deployment.";
  }
  return raw || fallback;
}

async function buildSummary(userId: string): Promise<PalNotificationSummary> {
  const rows = await listPalUnreadThreads(userId);
  const threads: PalUnreadThread[] = rows.map((row) => ({
    partnerId: row.partnerId,
    displayName: row.displayName,
    unreadCount: row.unreadCount,
    latestMessageId: row.latestMessageId,
    latestMessagePreview: row.latestMessagePreview,
    latestMessageType: row.latestMessageType,
    latestMessageAt: row.latestMessageAt
  }));
  const latest = rows[0];
  return {
    totalUnread: rows.reduce((sum, row) => sum + row.unreadCount, 0),
    threads,
    latestUnread: latest?.latestMessageId
      ? {
          sourceKey: `pal-message:${latest.latestMessageId}`,
          partnerId: latest.partnerId,
          senderName: latest.displayName,
          senderInitials: latest.senderInitials,
          preview: latest.latestMessagePreview,
          messageType: latest.latestMessageType ?? "reflection",
          createdAt: latest.latestMessageAt ?? new Date().toISOString()
        }
      : null
  };
}

export async function GET(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const summary = await buildSummary(auth.userId);
    return Response.json(summary);
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not load pal notifications.") }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await resolveAuthenticatedUser(req);
  if (!auth) return Response.json({ message: "Unauthorized" }, { status: 401 });

  let body: MarkReadBody;
  try {
    body = (await req.json()) as MarkReadBody;
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const partnerId = body.partnerId?.trim() ?? "";
  if (!isLikelyPartnerUserId(partnerId) || partnerId === auth.userId) {
    return Response.json({ message: "Invalid partner id." }, { status: 400 });
  }

  try {
    const linked = await palLinkExists(auth.userId, partnerId);
    if (!linked) {
      return Response.json({ message: "Link this pal first before updating notifications." }, { status: 403 });
    }
    await markPalThreadRead(auth.userId, partnerId);
    const summary = await buildSummary(auth.userId);
    return Response.json(summary);
  } catch (err) {
    return Response.json({ message: dbMessage(err, "Could not update pal notifications.") }, { status: 503 });
  }
}
