export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const upstreamRes = await fetch("https://mcp.quran.ai/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream, */*"
    },
    body: typeof body === "object" && body !== null ? JSON.stringify(body) : "{}",
    cache: "no-store"
  });

  const text = await upstreamRes.text();
  return new Response(text, {
    status: upstreamRes.status,
    headers: {
      "Content-Type": upstreamRes.headers.get("content-type") ?? "application/json",
      ...(upstreamRes.headers.get("mcp-session-id")
        ? { "mcp-session-id": upstreamRes.headers.get("mcp-session-id")! }
        : {})
    }
  });
}
