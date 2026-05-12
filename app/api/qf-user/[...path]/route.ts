import type { NextRequest } from "next/server";
import { getQfServerConfig } from "@/lib/server/qf/config";

export const dynamic = "force-dynamic";

function isSafePathSegment(seg: string): boolean {
  return !!seg.length && !seg.includes("..") && !seg.includes("\\") && !seg.includes("\0");
}

function getBearerToken(req: NextRequest): string | null {
  const raw = req.headers.get("authorization");
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function getUpstreamPrefix(firstSegment: string | undefined): string {
  // QF routes Quran Reflect post endpoints through the quran-reflect gateway path.
  if (firstSegment === "posts") return "quran-reflect/v1";
  return "auth/v1";
}

async function proxy(req: NextRequest, method: "GET" | "POST", context: { params: Promise<{ path: string[] }> }) {
  let config;
  try {
    config = getQfServerConfig();
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : "User API proxy not configured." }, { status: 503 });
  }

  const token = getBearerToken(req);
  if (!token) {
    return Response.json({ message: "Missing bearer token." }, { status: 401 });
  }

  const { path } = await context.params;
  if (!path?.length || !path.every(isSafePathSegment)) {
    return Response.json({ message: "Invalid path." }, { status: 400 });
  }

  const pathSuffix = path.join("/");
  const query = req.nextUrl.searchParams.toString();
  const upstreamPrefix = getUpstreamPrefix(path[0]);
  const upstreamUrl = `${config.apiBaseUrl.replace(/\/+$/, "")}/${upstreamPrefix}/${pathSuffix}${query ? `?${query}` : ""}`;

  console.info("[qf-user/proxy] forwarding request", {
    method,
    env: config.env,
    upstreamPrefix,
    pathSuffix,
    hasQuery: !!query
  });

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-auth-token": token,
      "x-client-id": config.clientId,
      ...(req.headers.get("x-timezone") ? { "x-timezone": req.headers.get("x-timezone")! } : {})
    },
    body: method === "POST" ? await req.text() : undefined,
    cache: "no-store"
  });

  console.info("[qf-user/proxy] upstream response", {
    method,
    upstreamPrefix,
    pathSuffix,
    status: upstreamRes.status,
    ok: upstreamRes.ok
  });

  const contentType = upstreamRes.headers.get("content-type") ?? "application/json";
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: { "Content-Type": contentType }
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, "GET", context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, "POST", context);
}
