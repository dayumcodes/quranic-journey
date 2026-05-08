import type { MCPSearchResult } from "@/types";

export async function semanticSearch(query: string, limit = 5): Promise<MCPSearchResult[]> {
  const response = await fetch("https://mcp.quran.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit })
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: MCPSearchResult[] };
  return data.results ?? [];
}
