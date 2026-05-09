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
  /** When API does not expose partner weekly verses */
  unknown?: boolean;
}) {
  const ratio = unknown ? 0 : Math.min(1, Math.max(0, total > 0 ? value / total : 0));

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: delay + 0.1 }}
      className="bg-white/70 backdrop-blur-sm border border-[rgba(13,15,18,0.07)] rounded-[1.5rem] p-7 shadow-card-resting"
    >
      <div className="flex justify-between items-end mb-4">
        <div className="font-sans text-sm text-[var(--text-3)]">{label}</div>
        <div className="font-mono font-semibold text-2xl text-[var(--ink)] leading-none">
          {unknown ? "—" : value}
          <span className="text-sm text-[var(--text-3)]">{unknown ? "" : `/${total}`}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[rgba(13,15,18,0.06)] rounded-full overflow-hidden">
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

