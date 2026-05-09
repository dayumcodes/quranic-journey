import { getQfServerConfig } from "@/lib/server/qf/config";

export const dynamic = "force-dynamic";

interface ExchangeBody {
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
  id_token?: string;
}

interface UserInfoResponse {
  sub?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let cfg;
  try {
    cfg = getQfServerConfig();
  } catch (err) {
    return Response.json({ message: err instanceof Error ? err.message : "QF config missing" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as ExchangeBody;
  if (!body.code || !body.redirect_uri || !body.code_verifier) {
    return Response.json({ message: "Missing code, redirect_uri, or code_verifier" }, { status: 400 });
  }

  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code: body.code,
    redirect_uri: body.redirect_uri,
    code_verifier: body.code_verifier
  });

  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const tokenRes = await fetch(`${cfg.authBaseUrl.replace(/\/+$/, "")}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`
    },
    body: tokenParams.toString(),
    cache: "no-store"
  });

  const tokenData = (await tokenRes.json().catch(() => ({}))) as OAuthTokenResponse;
  if (!tokenRes.ok || !tokenData.access_token) {
    return Response.json(
      {
        message: "Token exchange failed",
        status: tokenRes.status,
        error: tokenData.error,
        error_description: tokenData.error_description
      },
      { status: 401 }
    );
  }

  const userInfoEndpoints = [`${cfg.authBaseUrl.replace(/\/+$/, "")}/openid/userinfo`, `${cfg.authBaseUrl.replace(/\/+$/, "")}/oauth2/userinfo`];
  let user: UserInfoResponse | null = null;
  for (const endpoint of userInfoEndpoints) {
    try {
      const infoRes = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: "no-store"
      });
      if (!infoRes.ok) continue;
      user = (await infoRes.json()) as UserInfoResponse;
      break;
    } catch {
      continue;
    }
  }

  if (!user) {
    const idTokenPayload = decodeJwtPayload(tokenData.id_token);
    if (idTokenPayload) {
      user = {
        sub: typeof idTokenPayload.sub === "string" ? idTokenPayload.sub : undefined,
        name: typeof idTokenPayload.name === "string" ? idTokenPayload.name : undefined,
        email: typeof idTokenPayload.email === "string" ? idTokenPayload.email : undefined
      };
    }
  }

  const idPayload = decodeJwtPayload(tokenData.id_token);
  const atPayload = decodeJwtPayload(tokenData.access_token);
  const subFromJwt =
    (typeof idPayload?.sub === "string" ? idPayload.sub : undefined) ??
    (typeof atPayload?.sub === "string" ? atPayload.sub : undefined);

  if (subFromJwt?.trim()) {
    if (!user) user = { sub: subFromJwt.trim() };
    else if (!user.sub?.trim()) user = { ...user, sub: subFromJwt.trim() };
  }

  return Response.json({
    access_token: tokenData.access_token,
    user
  });
}
