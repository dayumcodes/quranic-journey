"use client";

import { motion } from "framer-motion";

/** Goal card uses theme panel surfaces (matches Profile in dark mode). */
export default function SharedGoalWidget({
  title = "Set your shared goal",
  dueLabel = "Due soon",
  mePercent = 0,
  partnerPercent = 0,
  partnerName = "Partner"
}: {
  title?: string;
  dueLabel?: string;
  mePercent?: number;
  partnerPercent?: number;
  partnerName?: string;
}) {
  return (
    <div className="mt-32 rounded-[2rem] p-12 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 shadow-card-resting bg-[var(--panel-muted)] backdrop-blur-sm border border-[var(--panel-border)] text-[var(--ink)]">
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none text-[var(--ink)]"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
      />
      <div className="relative z-10 w-full lg:w-1/2 lg:pr-12">
        <h3 className="font-display font-semibold text-2xl mb-2">{title}</h3>
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
      </div>
    </div>
  );
}
