import type { MCPSearchResult } from "@/types";

export async function semanticSearch(query: string, limit = 5): Promise<MCPSearchResult[]> {
  const response = await fetch(typeof window !== "undefined" ? "/api/mcp-search" : "https://mcp.quran.ai/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream, */*"
    },
    body: JSON.stringify({ query, limit })
  });
  if (!response.ok) return [];
  try {
    const raw = await response.text();
    const data: unknown = JSON.parse(raw) as unknown;
    if (Array.isArray(data)) return data as MCPSearchResult[];
    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      const r = obj.results ?? obj.data ?? obj.matches;
      if (Array.isArray(r)) return r as MCPSearchResult[];
      if (r && typeof r === "object" && Array.isArray((r as { items?: unknown }).items))
        return (r as { items: MCPSearchResult[] }).items;
    }
  } catch {
    /* ignore malformed JSON */
  }
  return [];
}
