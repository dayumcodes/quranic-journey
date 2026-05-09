import { getQfServerConfig } from "./config";

/** Re-fetch before canonical 3600s expiry ([token management](https://api-docs.quran.foundation/docs/quickstart/token-management)). */
const CACHE_TTL_MS = 55 * 60 * 1000;

type TokenCache = { token: string; expiresAt: number };

let cache: TokenCache | null = null;
let inflightPromise: Promise<string> | null = null;

export function invalidateQfContentTokenCache(): void {
  cache = null;
}

async function exchangeClientCredentials(): Promise<string> {
  const { authBaseUrl, clientId, clientSecret } = getQfServerConfig();

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const url = `${authBaseUrl.replace(/\/+$/, "")}/oauth2/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content"
    }).toString(),
    cache: "no-store"
  });

  if (!res.ok) {
    let detail = "";
    try {
      const raw = await res.json();
      detail = typeof raw === "object" && raw !== null && "message" in raw ? String((raw as { message: unknown }).message) : JSON.stringify(raw);
    } catch {
      detail = await res.text();
    }
    throw new Error(`QF OAuth token exchange failed (${res.status}): ${detail || res.statusText}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("QF OAuth token response missing access_token.");
  }

  return data.access_token;
}

/** Returns a cached Content API bearer (client_credentials); coalesces concurrent refresh. */
export async function getQfContentAccessToken(): Promise<string> {
  const now = Date.now();
  if (cache && now < cache.expiresAt) {
    return cache.token;
  }

  if (!inflightPromise) {
    inflightPromise = (async () => {
      const token = await exchangeClientCredentials();
      cache = { token, expiresAt: Date.now() + CACHE_TTL_MS };
      return token;
    })().finally(() => {
      inflightPromise = null;
    });
  }

  return inflightPromise;
}
