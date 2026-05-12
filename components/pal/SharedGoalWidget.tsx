"use client";

import { motion } from "framer-motion";
import { PencilSimple } from "@phosphor-icons/react";

/** Goal card uses theme panel surfaces (matches Profile in dark mode). */
export default function SharedGoalWidget({
  title = "Set your shared goal",
  dueLabel = "Due soon",
  mePercent = 0,
  partnerPercent = 0,
  partnerName = "Partner",
  meDetail,
  partnerDetail,
  onEdit
}: {
  title?: string;
  dueLabel?: string;
  mePercent?: number;
  partnerPercent?: number;
  partnerName?: string;
  meDetail?: string;
  partnerDetail?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="mt-16 sm:mt-24 lg:mt-32 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 lg:p-12 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-10 shadow-card-resting bg-[var(--panel-muted)] backdrop-blur-sm border border-[var(--panel-border)] text-[var(--ink)]">
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none text-[var(--ink)]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
      />
      <div className="relative z-10 w-full lg:w-1/2 lg:pr-12">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-display font-semibold text-2xl">{title}</h3>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit shared goal"
              title="Edit shared goal"
              className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel)]/80 text-[var(--text-2)] hover:text-[var(--ink)] hover:border-[var(--gold)]/40 transition-colors"
            >
              <PencilSimple size={18} weight="regular" />
            </button>
          ) : null}
        </div>
        <p className="font-sans text-sm text-[var(--text-3)]">{dueLabel}</p>
      </div>
      <div className="relative z-10 w-full lg:w-1/2">
        <div className="flex justify-between mb-3 font-mono text-[11px] text-[var(--text-2)]">
          <span>You: {mePercent}%</span>
          <span>
            {partnerName}: {partnerPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-black/10 dark:bg-white/10 rounded-full flex overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${mePercent}%` }}
            transition={{ duration: 1.5, type: "spring", stiffness: 100, damping: 20 }}
            className="h-full bg-[var(--gold)]"
          />
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${partnerPercent}%` }}
            transition={{ duration: 1.5, type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
            className="h-full bg-[var(--jade)]"
          />
        </div>
        {(meDetail || partnerDetail) ? (
          <div className="mt-3 flex justify-between gap-4 font-mono text-[11px] text-[var(--text-3)]">
            <span>{meDetail ?? ""}</span>
            <span className="text-right">{partnerDetail ?? ""}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
