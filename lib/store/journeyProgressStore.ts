"use client";

import { create } from "zustand";

export const GATES_TOTAL = 30;

function persistToCookie(slice: { gatesLitThisCycle: number; gateCycleIndex: number }) {
  if (typeof window === "undefined") return;
  void fetch("/api/journey/gates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slice),
    keepalive: true
  }).catch(() => {});
}

interface JourneyProgressState {
  /** Count of quizzes passed this gate cycle → lights `gatesLitThisCycle` circles (0 … GATES_TOTAL-1 displayed) */
  gatesLitThisCycle: number;
  gateCycleIndex: number;
  /** Apply values from `/api/journey/gates` (httpOnly cookie) on app load */
  hydrateFromCookie: (p: Partial<Pick<JourneyProgressState, "gatesLitThisCycle" | "gateCycleIndex">>) => void;
  advanceGateAfterQuizPass: () => void;
}

export const useJourneyProgressStore = create<JourneyProgressState>((set) => ({
  gatesLitThisCycle: 0,
  gateCycleIndex: 0,
  hydrateFromCookie: (partial) =>
    set((s) => ({
      gatesLitThisCycle: typeof partial.gatesLitThisCycle === "number" ? partial.gatesLitThisCycle : s.gatesLitThisCycle,
      gateCycleIndex: typeof partial.gateCycleIndex === "number" ? partial.gateCycleIndex : s.gateCycleIndex
    })),
  advanceGateAfterQuizPass: () => {
    set((s) => {
      const next = s.gatesLitThisCycle + 1;
      if (next >= GATES_TOTAL) {
        const patch = { gatesLitThisCycle: 0, gateCycleIndex: s.gateCycleIndex + 1 };
        persistToCookie(patch);
        return patch;
      }
      const patch = { gatesLitThisCycle: next, gateCycleIndex: s.gateCycleIndex };
      persistToCookie(patch);
      return patch;
    });
  }
}));
