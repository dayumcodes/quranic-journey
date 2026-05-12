import { RequestError, apiFetch } from "@/lib/api/client";
import { getUserApiBase } from "@/lib/api/userApiBase";
import type { Post } from "@/types";
import { normalizeQfPost } from "@/lib/api/user";

const USER_BASE = getUserApiBase();

function parseVerseReference(ref?: string): { chapterId: number; from: number; to: number }[] | undefined {
  if (!ref) return undefined;
  const [chapterPart, versePart] = ref.split(":");
  const chapterId = Number(chapterPart);
  const [fromPart, toPart = fromPart] = (versePart ?? "").split("-");
  const from = Number(fromPart);
  const to = Number(toPart);
  if (!Number.isFinite(chapterId) || !Number.isFinite(from) || !Number.isFinite(to)) return undefined;
  return [{ chapterId, from, to }];
}

export const createPost = async (payload: Partial<Post>): Promise<Post> => {
  const rawBody = (payload.body ?? "").trim();
  if (rawBody.length < 6) {
    throw new RequestError(422, "Posts must be at least 6 characters long.");
  }
  const authoredBody = payload.type === "encouragement" && !/^encouragement:/i.test(rawBody) ? `Encouragement: ${rawBody}` : rawBody;
  const references = parseVerseReference(payload.verse_reference);
  const raw = await apiFetch<{ data?: unknown }>(`${USER_BASE}/posts`, {
    method: "POST",
    body: JSON.stringify({
      body: authoredBody,
      ...(references ? { references } : {})
    })
  });
  const normalized = normalizeQfPost((raw?.data ?? raw) as never, payload.author_id, payload.recipient_id);
  return {
    ...normalized,
    type: payload.type ?? normalized.type,
    recipient_id: payload.recipient_id ?? normalized.recipient_id
  };
};
