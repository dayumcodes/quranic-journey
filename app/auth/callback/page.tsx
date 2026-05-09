"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

interface OAuthTokenResponse {
  access_token?: string;
  user?: UserInfoResponse | null;
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
    const returnedState = params.get("state");
    const expectedState = sessionStorage.getItem("oauth_state");
    const verifier = sessionStorage.getItem("pkce_verifier");
    if (!code || !verifier || !returnedState || !expectedState || returnedState !== expectedState) {
      router.push("/");
      return;
    }
    sessionStorage.removeItem("oauth_state");
    const body = {
      code,
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "",
      code_verifier: verifier
    };

    const run = async () => {
      const tokenRes = await fetch("/api/auth/qf/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const tokenData = (await tokenRes.json()) as OAuthTokenResponse;
      if (process.env.NODE_ENV !== "production") {
        console.info("[auth/callback] token exchange response", {
          status: tokenRes.status,
          ok: tokenRes.ok,
          error: tokenData.error,
          error_description: tokenData.error_description
        });
      }
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed");
      }

      const info = tokenData.user ?? null;

      const displayName = info?.name || info?.preferred_username || [info?.given_name, info?.family_name].filter(Boolean).join(" ") || "You";
      const emailRaw = info?.email?.trim();
      const sub = info?.sub?.trim();
      const id = (sub || emailRaw || "").trim();
      if (!id) {
        throw new Error(
          "Quran Foundation login returned no user id (sub) or email. Confirm openid scope and userinfo access for your OAuth app."
        );
      }
      setTokens(tokenData.access_token, {
        id,
        sub: sub || undefined,
        name: displayName,
        email: emailRaw || "(email not shared — add email scope on OAuth app if needed)",
        avatar_initials: initialsFromName(displayName)
      });
    };

    run()
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[auth/callback] login flow failed", {
            message: err instanceof Error ? err.message : String(err)
          });
        }
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("al_rihla_user");
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
