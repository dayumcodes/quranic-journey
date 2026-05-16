"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "al_rihla_theme";

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export type ThemeTransitionRunner = (next: ThemeMode, originX: number, originY: number) => void;

let themeTransitionRunner: ThemeTransitionRunner | null = null;

export function registerThemeTransitionRunner(runner: ThemeTransitionRunner | null): void {
  themeTransitionRunner = runner;
}

function persistTheme(theme: ThemeMode, set: (partial: { theme: ThemeMode }) => void): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyThemeClass(theme);
  set({ theme });
}

export const useThemeStore = create<{
  theme: ThemeMode;
  isThemeTransitioning: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleThemeAt: (originX: number, originY: number) => void;
}>((set, get) => ({
  theme: "light",
  isThemeTransitioning: false,
  setTheme: (theme) => {
    persistTheme(theme, set);
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
  toggleThemeAt: (originX, originY) => {
    if (get().isThemeTransitioning) return;
    const next = get().theme === "dark" ? "light" : "dark";
    const runner = themeTransitionRunner;
    if (runner) {
      runner(next, originX, originY);
      return;
    }
    get().setTheme(next);
  }
}));

export function beginThemeTransition(): void {
  useThemeStore.setState({ isThemeTransitioning: true });
}
