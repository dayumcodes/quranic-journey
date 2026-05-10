"use client";
import { motion } from "framer-motion";

export default function ProgressCard({
  value,
  total,
  label,
  color = "bg-[var(--gold)]",
  delay = 0,
  unknown = false
}: {
  value: number;
  total: number;
  label: string;
  color?: string;
  delay?: number;
  unknown?: boolean;
}) {
  const ratio = unknown ? 0 : Math.min(1, Math.max(0, total > 0 ? value / total : 0));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: delay + 0.1 }}
      className="bg-[var(--panel-muted)] backdrop-blur-sm border border-[var(--panel-border)] rounded-[1.5rem] p-7 shadow-card-resting text-[var(--ink)]"
    >
      <div className="flex justify-between items-end mb-4">
        <div className="font-sans text-sm text-[var(--text-3)]">{label}</div>
        <div className="font-mono font-semibold text-2xl leading-none">
          {unknown ? "—" : value}
          <span className="text-sm text-[var(--text-3)]">{unknown ? "" : `/${total}`}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: ratio }}
          transition={{ duration: 1.2, type: "spring", stiffness: 300, damping: 22 }}
          className={`h-full ${color} origin-left`}
        />
      </div>
    </motion.div>
  );
}
