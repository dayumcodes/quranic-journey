"use client";

import { Plus, User, X } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import type { PalThread } from "@/lib/utils/palThreadsStorage";

export default function PalChatSidebar({
  threads,
  activePartnerId,
  onSelect,
  onAddClick,
  onRemovePal,
  myReadingLine
}: {
  threads: PalThread[];
  activePartnerId: string | null;
  onSelect: (partnerId: string) => void;
  onAddClick: () => void;
  onRemovePal?: (partnerId: string) => void;
  /** Same reading focus across all threads (your global goal / journey) */
  myReadingLine?: string;
}) {
  return (
    <aside className="w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col rounded-2xl border border-[rgba(13,15,18,0.08)] bg-white/80 backdrop-blur-sm overflow-hidden shadow-card-resting min-h-[420px] max-h-[calc(100vh-8rem)] md:sticky md:top-28">
      <div className="p-4 border-b border-[rgba(13,15,18,0.06)]">
        <h2 className="font-display font-semibold text-lg text-[var(--ink)]">Pals</h2>
        {myReadingLine ? <p className="text-[11px] text-[var(--text-3)] mt-1 leading-snug">{myReadingLine}</p> : null}
      </div>
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="p-6 text-sm text-[var(--text-3)] text-center">No pals yet — add someone to compete and share reflections.</div>
        ) : (
          threads.map((t) => {
            const active = t.partnerId === activePartnerId;
            const initial = t.displayName.trim().charAt(0) || t.partnerId.charAt(0);
            return (
              <motion.button
                key={t.partnerId}
                type="button"
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(t.partnerId)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-[rgba(13,15,18,0.04)] hover:bg-black/[0.03] transition-colors ${active ? "bg-[var(--gold)]/12 border-l-4 border-l-[var(--gold)] pl-3" : "border-l-4 border-l-transparent"}`}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--jade)]/15 border border-[var(--jade)]/30 flex items-center justify-center text-sm font-semibold text-[var(--jade)]">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-[var(--ink)] truncate">{t.displayName}</div>
                  <div className="font-mono text-[10px] text-[var(--text-3)] truncate">{t.partnerId.slice(0, 10)}…</div>
                </div>
                {onRemovePal ? (
                  <button
                    type="button"
                    title="Remove from list"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemovePal(t.partnerId);
                    }}
                    className="shrink-0 p-2 rounded-full text-[var(--text-3)] hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <X weight="bold" size={14} />
                  </button>
                ) : null}
              </motion.button>
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="m-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(13,15,18,0.15)] py-3 text-sm font-medium text-[var(--text-2)] hover:bg-black/[0.03] hover:border-[var(--gold)]/40"
      >
        <Plus weight="bold" size={18} className="text-[var(--gold)]" />
        Add pal
      </button>
      <div className="px-4 pb-3 flex items-center gap-2 text-[10px] text-[var(--text-3)]">
        <User weight="regular" size={14} />
        Your surah focus is the same in every chat — pick a pal to compare stats.
      </div>
    </aside>
  );
}
