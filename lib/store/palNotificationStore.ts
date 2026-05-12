"use client";

import { create } from "zustand";
import type { PalNotificationPeek, PalNotificationSummary } from "@/types";

type PermissionState = NotificationPermission | "unsupported" | "unknown";

const EMPTY_SUMMARY: PalNotificationSummary = {
  totalUnread: 0,
  threads: [],
  latestUnread: null
};

type State = {
  summary: PalNotificationSummary;
  peek: PalNotificationPeek | null;
  pushSupported: boolean;
  pushConfigured: boolean;
  pushEnabled: boolean;
  permission: PermissionState;
  setSummary: (summary: PalNotificationSummary) => void;
  setPeek: (peek: PalNotificationPeek | null) => void;
  setPushState: (patch: Partial<Pick<State, "pushSupported" | "pushConfigured" | "pushEnabled" | "permission">>) => void;
  clear: () => void;
};

export const usePalNotificationStore = create<State>((set) => ({
  summary: EMPTY_SUMMARY,
  peek: null,
  pushSupported: false,
  pushConfigured: false,
  pushEnabled: false,
  permission: "unknown",
  setSummary: (summary) => set({ summary }),
  setPeek: (peek) => set({ peek }),
  setPushState: (patch) => set(patch),
  clear: () =>
    set({
      summary: EMPTY_SUMMARY,
      peek: null,
      pushSupported: false,
      pushConfigured: false,
      pushEnabled: false,
      permission: "unknown"
    })
}));
