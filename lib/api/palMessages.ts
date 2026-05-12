import { RequestError, apiFetch } from "@/lib/api/client";
import type { Post } from "@/types";

type PalMessageApiRow = {
  id?: string | number;
  authorId?: string;
  recipientId?: string;
  type?: string;
  body?: string;
  verseReference?: string;
  createdAt?: string;
};

const palMessagesFetchOpts = { logoutOnUnauthorized: false as const };

function normalizePalMessage(row: PalMessageApiRow): Post {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    type: row.type === "encouragement" ? "encouragement" : "reflection",
    author_id: row.authorId?.trim() ?? "",
    recipient_id: row.recipientId?.trim() || undefined,
    body: (row.body ?? "").trim(),
    verse_reference: row.verseReference?.trim() || undefined,
    created_at: row.createdAt || new Date().toISOString()
  };
}

export async function getPalMessages(partnerId: string): Promise<Post[]> {
  const trimmedPartnerId = partnerId.trim();
  if (!trimmedPartnerId) return [];
  const raw = await apiFetch<{ messages?: PalMessageApiRow[] }>(
    `/api/pal-messages?partnerId=${encodeURIComponent(trimmedPartnerId)}`,
    palMessagesFetchOpts
  );
  return Array.isArray(raw.messages)
    ? raw.messages.map(normalizePalMessage).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];
}

export async function createPalMessage(payload: Partial<Post>): Promise<Post> {
  const recipientId = payload.recipient_id?.trim() ?? "";
  const rawBody = (payload.body ?? "").trim();
  if (rawBody.length < 6) {
    throw new RequestError(422, "Messages must be at least 6 characters long.");
  }
  if (!recipientId) {
    throw new RequestError(400, "Choose a linked pal before sending a message.");
  }

  const type = payload.type === "encouragement" ? "encouragement" : "reflection";
  const body = type === "encouragement" ? rawBody.replace(/^encouragement:\s*/i, "").trim() : rawBody;
  const raw = await apiFetch<{ message?: PalMessageApiRow }>(
    "/api/pal-messages",
    {
      ...palMessagesFetchOpts,
      method: "POST",
      body: JSON.stringify({
        partnerId: recipientId,
        type,
        body,
        verseReference: payload.verse_reference
      })
    }
  );

  return normalizePalMessage(raw.message ?? {});
}
