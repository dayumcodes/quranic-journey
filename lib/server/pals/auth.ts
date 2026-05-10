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

/** Some access tokens are JWTs with `sub`; userinfo may fail if scopes/env mismatch. */
function subFromAccessTokenJwt(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as { sub?: string };
    const sub = typeof payload.sub === "string" ? payload.sub.trim() : "";
    return sub || null;
  } catch {
    return null;
  }
}

export async function resolveAuthenticatedUser(req: NextRequest): Promise<AuthIdentity | null> {
  const token = getBearerToken(req);
  if (!token) {
    console.warn("[pals-auth] missing Authorization Bearer");
    return null;
  }

  let cfg;
  try {
    cfg = getQfServerConfig();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[pals-auth] QF server config error", { message: msg });
    return null;
  }

  const userInfoAttempts: { path: string; status: number }[] = [];
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
      userInfoAttempts.push({ path: endpoint.includes("/openid/") ? "openid/userinfo" : "oauth2/userinfo", status: res.status });
      if (!res.ok) continue;
      const payload = (await res.json()) as { sub?: string };
      const sub = payload.sub?.trim();
      if (sub) return { userId: sub };
    } catch {
      userInfoAttempts.push({ path: endpoint.includes("/openid/") ? "openid/userinfo" : "oauth2/userinfo", status: -1 });
      continue;
    }
  }

  const jwtSub = subFromAccessTokenJwt(token);
  if (jwtSub) {
    console.info("[pals-auth] resolved sub from access_token JWT (userinfo had no sub)", {
      authEnv: cfg.env,
      userInfoAttempts
    });
    return { userId: jwtSub };
  }

  console.warn("[pals-auth] could not resolve user id", {
    authEnv: cfg.env,
    authBaseHost: (() => {
      try {
        return new URL(cfg.authBaseUrl).host;
      } catch {
        return "invalid-url";
      }
    })(),
    accessTokenLooksLikeJwt: token.split(".").length === 3,
    userInfoAttempts
  });
  return null;
}
