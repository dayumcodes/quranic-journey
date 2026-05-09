import type { MCPSearchResult } from "@/types";

const MCP_URL = "https://mcp.quran.ai/";
/** Upstream requires both application/json and text/event-stream; a lone wildcard Accept is rejected. */
const MCP_ACCEPT = "application/json, text/event-stream";

function parseSseDataLines(raw: string): unknown[] {
  const messages: unknown[] = [];
  const blocks = raw.split(/\r?\n\r?\n/);
  for (const block of blocks) {
    const line = block
      .split("\n")
      .map((l) => l.trimEnd())
      .find((l) => l.startsWith("data:"));
    if (!line) continue;
    const jsonPart = line.replace(/^data:\s*/, "").trim();
    if (!jsonPart) continue;
    try {
      messages.push(JSON.parse(jsonPart));
    } catch {
      /* skip non-JSON */
    }
  }
  return messages;
}

async function postMcp(
  sessionId: string | undefined,
  body: Record<string, unknown>
): Promise<{ sessionId: string; text: string; status: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: MCP_ACCEPT
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store"
  });

  const sid =
    res.headers.get("mcp-session-id")?.trim() || sessionId || "";
  const text = await res.text();

  return { sessionId: sid, text, status: res.status };
}

function mapMcpResultToSearchResults(structured: unknown, limit: number): MCPSearchResult[] {
  if (!structured || typeof structured !== "object") return [];
  const rec = structured as Record<string, unknown>;
  const results = rec.results;
  if (!Array.isArray(results)) return [];

  const out: MCPSearchResult[] = [];
  for (const row of results) {
    if (out.length >= limit) break;
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const key = typeof r.ayah_key === "string" ? r.ayah_key.replace("_", ":") : "";
    if (!/^\d+:\d+$/.test(key)) continue;
    const surahNum = typeof r.surah === "number" ? r.surah : Number(String(key).split(":")[0]);
    const ayahNum = typeof r.ayah === "number" ? r.ayah : Number(String(key).split(":")[1]);
    let translation = "";
    const tr = r.translations;
    if (Array.isArray(tr) && tr.length > 0) {
      const first = tr[0];
      if (first && typeof first === "object" && "text" in first && typeof (first as { text?: unknown }).text === "string")
        translation = (first as { text: string }).text;
      else if (typeof first === "string") translation = first;
    }
    const arabic = typeof r.text === "string" ? r.text : "";

    const rel = typeof r.relevance_score === "number" ? r.relevance_score : 0;

    out.push({
      verse_key: key,
      text_arabic: arabic,
      translation,
      surah_name: Number.isFinite(surahNum) ? `Surah ${surahNum}` : "",
      ayah_number: Number.isFinite(ayahNum) ? ayahNum : 0,
      relevance_score: rel
    });
  }

  return out;
}

/** Run semantic Quran search via official MCP HTTP transport (JSON-RPC over SSE). */
export async function mcpSearchQuranViaHttp(query: string, limit = 5): Promise<MCPSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  let init = await postMcp(undefined, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "al-rihla-reflect", version: "1.0.0" }
    }
  });

  if (!init.sessionId || init.status >= 400) return [];

  await postMcp(init.sessionId, {
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {}
  });

  const call = await postMcp(init.sessionId, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "search_quran",
      arguments: { query: q }
    }
  });

  if (call.status >= 400) return [];

  const messages = parseSseDataLines(call.text);
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const m = msg as { id?: unknown; result?: unknown; error?: unknown };
    if (m.error) continue;
    if (m.id !== 2 || !m.result) continue;

    const result = m.result as Record<string, unknown>;
    const structured = result.structuredContent;
    if (structured) {
      return mapMcpResultToSearchResults(structured, limit);
    }

    const content = result.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (!block || typeof block !== "object") continue;
        const b = block as { type?: string; text?: string };
        if (b.type !== "text" || typeof b.text !== "string") continue;
        try {
          const parsed = JSON.parse(b.text) as { results?: unknown };
          const mapped = mapMcpResultToSearchResults(parsed, limit);
          if (mapped.length) return mapped;
        } catch {
          /* next */
        }
      }
    }
  }

  return [];
}
