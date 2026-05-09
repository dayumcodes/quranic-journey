"use client";

import { create } from "zustand";
import { generateCodeChallenge, generateCodeVerifier } from "@/lib/auth/pkce";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
  setTokens: (access: string, user: User) => void;
}

const SCOPE =
  "openid profile email read:collections write:collections read:goals write:goals read:activity write:activity read:posts write:posts read:streaks";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null,
  isAuthenticated: typeof window !== "undefined" ? !!sessionStorage.getItem("access_token") : false,
  login: async () => {
    const verifier = generateCodeVerifier();
    sessionStorage.setItem("pkce_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);
    const oauthBase = process.env.NEXT_PUBLIC_OAUTH_BASE_URL ?? "https://oauth2.quran.foundation";
    const authorizePath = process.env.NEXT_PUBLIC_OAUTH_AUTHORIZE_PATH ?? "/oauth2/auth";
    const authUrl = new URL(`${oauthBase.replace(/\/+$/, "")}${authorizePath.startsWith("/") ? authorizePath : `/${authorizePath}`}`);
    authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "");
    authUrl.searchParams.set("redirect_uri", process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", SCOPE);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    if (process.env.NODE_ENV !== "production") {
      // Safe debug log for local diagnosis (no verifier/code/token logged).
      console.info("[auth] redirecting to oauth", {
        oauthBase,
        authorizePath,
        redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "",
        clientIdSuffix: (process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "").slice(-8),
        fullAuthorizeUrl: authUrl.toString()
      });
    }
    window.location.href = authUrl.toString();
  },
  logout: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("pkce_verifier");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  setTokens: (access, user) => {
    sessionStorage.setItem("access_token", access);
    set({ accessToken: access, user, isAuthenticated: true });
  }
}));
