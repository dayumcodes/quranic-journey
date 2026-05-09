"use client";

import { motion } from "framer-motion";
import { Lock, Sparkle } from "@phosphor-icons/react";

export default function BadgeStrip({ unlocked = 3, total = 10 }: { unlocked?: number; total?: number }) {
  return (
    <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8">
      {Array.from({ length: total }, (_, i) => {
        const isUnlocked = i < unlocked;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: Math.min(i, 14) * 0.06 }}
            whileHover={isUnlocked ? { scale: 1.06 } : {}}
            className={`flex-none w-[80px] h-[80px] rounded-full flex items-center justify-center relative shrink-0 ${
              isUnlocked
                ? "bg-white border-2 border-[var(--gold)] shadow-card-resting cursor-pointer"
                : "bg-gray-200/90 opacity-50 grayscale cursor-not-allowed"
            }`}
            title={isUnlocked ? `Gate ${i + 1} unlocked` : `Gate ${i + 1} — complete Journey milestones to unlock`}
          >
            {isUnlocked ? <Sparkle weight="regular" size={28} className="text-[var(--gold)]" /> : <Lock weight="regular" size={22} className="text-[var(--text-3)]" />}
          </motion.div>
        );
      })}
    </div>
  );
}
