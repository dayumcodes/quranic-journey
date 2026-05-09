"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

interface OAuthTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface UserInfoResponse {
  sub?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
}

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  const a = words[0]?.[0] ?? "";
  const b = words.length > 1 ? words[1]?.[0] ?? "" : "";
  return `${a}${b}`.toUpperCase() || "U";
}

function AuthCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { setTokens } = useAuthStore();

  useEffect(() => {
    const code = params.get("code");
    const verifier = sessionStorage.getItem("pkce_verifier");
    if (!code || !verifier) {
      router.push("/");
      return;
    }
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "",
      client_id: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "",
      code_verifier: verifier
    });
    const oauthBase = (process.env.NEXT_PUBLIC_OAUTH_BASE_URL ?? "https://oauth2.quran.foundation").replace(/\/+$/, "");

    const run = async () => {
      const tokenRes = await fetch(`${oauthBase}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      const tokenData = (await tokenRes.json()) as OAuthTokenResponse;
      if (process.env.NODE_ENV !== "production") {
        console.info("[auth/callback] token exchange response", {
          oauthBase,
          status: tokenRes.status,
          ok: tokenRes.ok,
          error: tokenData.error,
          error_description: tokenData.error_description
        });
      }
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
      }

      const userInfoEndpoints = [`${oauthBase}/openid/userinfo`, `${oauthBase}/oauth2/userinfo`];
      let info: UserInfoResponse | null = null;

      for (const endpoint of userInfoEndpoints) {
        try {
          const r = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
          });
          if (!r.ok) continue;
          info = (await r.json()) as UserInfoResponse;
          break;
        } catch {
          continue;
        }
      }

      const displayName = info?.name || info?.preferred_username || [info?.given_name, info?.family_name].filter(Boolean).join(" ") || "You";
      const email = info?.email || "unknown@quran.foundation";
      const id = info?.sub || email || "me";
      setTokens(tokenData.access_token, {
        id,
        name: displayName,
        email,
        avatar_initials: initialsFromName(displayName)
      });
    };

    run()
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth/callback] login flow failed", {
            oauthBase,
            message: err instanceof Error ? err.message : String(err)
          });
        }
        sessionStorage.removeItem("access_token");
      })
      .finally(() => router.push("/"));
  }, [params, router, setTokens]);

  return <div className="min-h-screen flex items-center justify-center">Signing you in...</div>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Signing you in...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
