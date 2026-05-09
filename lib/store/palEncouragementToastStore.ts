"use client";

import { create } from "zustand";

export type PalEncouragementPeek = {
  senderName: string;
  senderInitials: string;
  /** dedupe key e.g. post id */
  sourceKey: string;
};

type State = {
  peek: PalEncouragementPeek | null;
  setEncouragementPeek: (peek: PalEncouragementPeek | null) => void;
};

export const usePalEncouragementToastStore = create<State>((set) => ({
  peek: null,
  setEncouragementPeek: (peek) => set({ peek })
}));
