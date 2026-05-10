"use client";

import { motion } from "framer-motion";

/** Cream goal card — same surface in light/dark app theme; copy stays dark for contrast. */
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
    <div className="mt-32 rounded-[2rem] p-12 relative overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10 shadow-2xl bg-[#EDE8DF] dark:bg-[#E5E0D6] border border-[rgba(13,15,18,0.1)] text-[#0D0F12]">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, #0D0F12 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
      />
      <div className="relative z-10 w-full lg:w-1/2 lg:pr-12">
        <h3 className="font-display font-semibold text-2xl mb-2">{title}</h3>
        <p className="font-sans text-sm text-[#0D0F12]/65">{dueLabel}</p>
      </div>
      <div className="relative z-10 w-full lg:w-1/2">
        <div className="flex justify-between mb-3 font-mono text-[11px] text-[#0D0F12]/75">
          <span>You: {mePercent}%</span>
          <span>
            {partnerName}: {partnerPercent}%
          </span>
        </div>
        <div className="w-full h-3 bg-[#0D0F12]/12 rounded-full flex overflow-hidden">
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
