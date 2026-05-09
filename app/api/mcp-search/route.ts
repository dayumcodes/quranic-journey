export const dynamic = "force-dynamic";

import { mcpSearchQuranViaHttp } from "@/lib/server/quranMcpClient";

type BodyShape = { query?: unknown; limit?: unknown };

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as BodyShape;
  const query = typeof b.query === "string" ? b.query.trim() : "";
  if (!query) {
    return Response.json({ message: "Missing or empty query" }, { status: 400 });
  }

  const limitRaw = b.limit;
  const limit = typeof limitRaw === "number" && Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, Math.floor(limitRaw))) : 5;

  try {
    const results = await mcpSearchQuranViaHttp(query, limit);
    return Response.json(results);
  } catch {
    return Response.json([], { status: 200 });
  }
}
