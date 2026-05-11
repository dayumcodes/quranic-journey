"use client";

import { create } from "zustand";
import { generateCodeChallenge, generateCodeVerifier } from "@/lib/auth/pkce";
import type { User } from "@/types";

const USER_STORAGE_KEY = "al_rihla_user";

function loadStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function initialSession(): Pick<AuthState, "user" | "accessToken" | "isAuthenticated"> {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, isAuthenticated: false };
  }
  const token = sessionStorage.getItem("access_token");
  const user = loadStoredUser();
  const ok = !!(token && user);
  return {
    accessToken: token,
    user: ok ? user : null,
    isAuthenticated: ok
  };
}

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

function randomState(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function suffix(value: string, count = 8): string {
  return value ? value.slice(-count) : "(missing)";
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialSession(),
  login: async () => {
    const verifier = generateCodeVerifier();
    sessionStorage.setItem("pkce_verifier", verifier);
    const challenge = await generateCodeChallenge(verifier);
    const oauthBase = process.env.NEXT_PUBLIC_OAUTH_BASE_URL ?? "https://oauth2.quran.foundation";
    const authorizePath = process.env.NEXT_PUBLIC_OAUTH_AUTHORIZE_PATH ?? "/oauth2/auth";
    const authUrl = new URL(`${oauthBase.replace(/\/+$/, "")}${authorizePath.startsWith("/") ? authorizePath : `/${authorizePath}`}`);
    const state = randomState(16);
    sessionStorage.setItem("oauth_state", state);
    const scope = process.env.NEXT_PUBLIC_OAUTH_SCOPE ?? SCOPE;
    authUrl.searchParams.set("client_id", process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? "");
    authUrl.searchParams.set("redirect_uri", process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    // Safe debug log for auth troubleshooting (no verifier, code, or tokens logged).
    console.info("[auth] redirecting to oauth", {
      oauthBase,
      authorizePath,
      redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "",
      clientIdSuffix: suffix(process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? ""),
      scopeList: scope.split(/\s+/).filter(Boolean),
      hasVerifier: !!verifier,
      codeChallengeMethod: "S256",
      stateSuffix: suffix(state),
      currentOrigin: typeof window !== "undefined" ? window.location.origin : "(server)"
    });
    window.location.href = authUrl.toString();
  },
  logout: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem("pkce_verifier");
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  setTokens: (access, user) => {
    sessionStorage.setItem("access_token", access);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    set({ accessToken: access, user, isAuthenticated: true });
  }
}));
