"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";

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
    fetch("https://auth.quran.foundation/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    })
      .then((r) => r.json())
      .then((d: { access_token: string }) =>
        setTokens(d.access_token, { id: "me", name: "You", email: "you@example.com", avatar_initials: "Y" })
      )
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
