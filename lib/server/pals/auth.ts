import type { NextRequest } from "next/server";
import { getQfServerConfig } from "@/lib/server/qf/config";

type AuthIdentity = {
  userId: string;
};

function getBearerToken(req: NextRequest): string | null {
  const raw = req.headers.get("authorization");
  if (!raw) return null;
  const [scheme, token] = raw.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

export async function resolveAuthenticatedUser(req: NextRequest): Promise<AuthIdentity | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  let cfg;
  try {
    cfg = getQfServerConfig();
  } catch {
    return null;
  }
  const userInfoEndpoints = [
    `${cfg.authBaseUrl.replace(/\/+$/, "")}/openid/userinfo`,
    `${cfg.authBaseUrl.replace(/\/+$/, "")}/oauth2/userinfo`
  ];
  for (const endpoint of userInfoEndpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!res.ok) continue;
      const payload = (await res.json()) as { sub?: string };
      const sub = payload.sub?.trim();
      if (sub) return { userId: sub };
    } catch {
      continue;
    }
  }
  return null;
}
