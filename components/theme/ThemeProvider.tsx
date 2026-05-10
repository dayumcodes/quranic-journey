"use client";

import { useLayoutEffect } from "react";
import { applyThemeClass, readStoredTheme, useThemeStore } from "@/lib/store/themeStore";

/** Keeps Zustand in sync with localStorage + `dark` class on `<html>` (script in layout sets class before paint). */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const stored = readStoredTheme();
    applyThemeClass(stored);
    useThemeStore.setState({ theme: stored });
  }, []);

  return children;
}
