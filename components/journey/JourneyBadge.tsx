"use client";
import { motion } from "framer-motion";
import { Fire, Sparkle } from "@phosphor-icons/react";
import ParticleBurst from "@/components/shared/ParticleBurst";
import { SPRINGS } from "@/lib/constants/motion";
export default function JourneyBadge({ onContinue, streakDays }: { onContinue: () => void; streakDays: number }) {
  const streakLabel = `${streakDays} day${streakDays === 1 ? "" : "s"} streak!`;
  const panelBaseClasses =
    "bg-[var(--panel-muted)] backdrop-blur-sm border border-[var(--panel-border)] rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden shadow-card-resting text-[var(--ink)]";
  return (
    <motion.div layoutId="panelContent" className={`${panelBaseClasses} items-center justify-center text-center`}>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display font-bold text-3xl text-[var(--ink)] mb-12">
        Mashallah!
        <br />
        Gate Unlocked
      </motion.h2>
      <div className="relative mb-6">
        <ParticleBurst trigger={true} color="rgba(184,148,63)" count={120} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1.3, 1] }}
          transition={SPRINGS.OVERSHOOT}
          className="w-[120px] h-[120px] rounded-full border-4 border-[var(--gold)] bg-[var(--panel-muted)] shadow-gold-glow flex items-center justify-center relative z-10"
        >
          <Sparkle weight="regular" size={48} className="text-[var(--gold)]" />
        </motion.div>
      </div>
      <h3 className="font-sans font-semibold text-lg text-[var(--text-2)] mb-8">Gate of Protection</h3>
      <div className="flex items-center gap-2 mb-12 bg-orange-50 dark:bg-[var(--gold)]/10 px-4 py-2 rounded-full border border-orange-100 dark:border-[var(--gold)]/25">
        <motion.div animate={{ y: [-3, 0, -3] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <Fire weight="regular" size={16} className="text-orange-500 dark:text-[var(--gold)]" />
        </motion.div>
        <span className="font-sans font-medium text-sm text-orange-700 dark:text-[var(--gold-light)]">{streakLabel}</span>
      </div>
      <motion.button
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full py-4 rounded-full bg-[var(--gold)] text-[var(--void)] font-sans font-bold text-sm shadow-md mt-auto"
      >
        Continue Journey
      </motion.button>
    </motion.div>
  );
}
