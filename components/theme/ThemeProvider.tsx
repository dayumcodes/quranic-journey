"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/theme/themeTransition";
import { runThemeViewTransition } from "@/lib/theme/runThemeViewTransition";
import {
  applyThemeClass,
  beginThemeTransition,
  readStoredTheme,
  registerThemeTransitionRunner,
  useThemeStore,
  type ThemeMode
} from "@/lib/store/themeStore";

/** Keeps Zustand in sync with localStorage + `dark` class on `<html>` (script in layout sets class before paint). */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const transitioningRef = useRef(false);

  const runReveal = useCallback((next: ThemeMode, originX: number, originY: number) => {
    if (transitioningRef.current) return;

    transitioningRef.current = true;
    beginThemeTransition();

    const finish = () => {
      transitioningRef.current = false;
      useThemeStore.setState({ isThemeTransitioning: false });
    };

    if (prefersReducedMotion()) {
      useThemeStore.getState().setTheme(next);
      finish();
      return;
    }

    void runThemeViewTransition(next, originX, originY).finally(finish);
  }, []);

  useLayoutEffect(() => {
    const stored = readStoredTheme();
    applyThemeClass(stored);
    useThemeStore.setState({ theme: stored });
  }, []);

  useLayoutEffect(() => {
    registerThemeTransitionRunner(runReveal);
    return () => registerThemeTransitionRunner(null);
  }, [runReveal]);

  return children;
}
