import type { NextRequest } from "next/server";
import { getQfServerConfig } from "@/lib/server/qf/config";
import { getQfContentAccessToken, invalidateQfContentTokenCache } from "@/lib/server/qf/contentToken";

export const dynamic = "force-dynamic";

function isSafePathSegment(seg: string): boolean {
  if (!seg.length) return false;
  return !seg.includes("..") && !seg.includes("\\") && !seg.includes("\0") && seg !== "";
}

async function upstreamGet(upstreamUrl: string, token: string, clientId: string): Promise<Response> {
  return fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-auth-token": token,
      "x-client-id": clientId
    },
    cache: "no-store"
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  let config;
  try {
    config = getQfServerConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Content API proxy not configured.";
    return Response.json({ message: msg }, { status: 503 });
  }

  const { path } = await context.params;
  if (!path?.length || !path.every(isSafePathSegment)) {
    return Response.json({ message: "Invalid path." }, { status: 400 });
  }

  const pathSuffix = path.join("/");
  const query = req.nextUrl.searchParams.toString();
  const base = config.apiBaseUrl.replace(/\/+$/, "");
  const upstreamUrl = `${base}/content/api/v4/${pathSuffix}${query ? `?${query}` : ""}`;

  try {
    let token = await getQfContentAccessToken();
    let res = await upstreamGet(upstreamUrl, token, config.clientId);

    if (res.status === 401) {
      invalidateQfContentTokenCache();
      token = await getQfContentAccessToken();
      res = await upstreamGet(upstreamUrl, token, config.clientId);
    }

    const contentType = res.headers.get("content-type") ?? "application/json";

    return new Response(res.body, {
      status: res.status,
      headers: contentType ? { "Content-Type": contentType } : undefined
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Content API proxy error.";
    return Response.json({ message: msg }, { status: 502 });
  }
}
