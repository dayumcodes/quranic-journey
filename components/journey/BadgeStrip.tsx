"use client";
import { motion } from "framer-motion";
import { Lock, Sparkle } from "@phosphor-icons/react";
export default function BadgeStrip({ unlocked = 3 }: { unlocked?: number }) {
  return <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8">{[1,2,3,4,5,6,7].map((b, i) => { const isUnlocked = i < unlocked; return <motion.div key={i} initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.08 }} whileHover={isUnlocked ? { scale: 1.1 } : {}} className={`flex-none w-[88px] h-[88px] rounded-full flex items-center justify-center relative ${isUnlocked ? "bg-white border-2 border-[var(--gold)] shadow-card-resting cursor-pointer" : "bg-gray-200 opacity-45 grayscale cursor-not-allowed"}`}>{isUnlocked ? <Sparkle weight="regular" size={32} className="text-[var(--gold)]" /> : <Lock weight="regular" size={24} className="text-[var(--text-3)]" />}</motion.div>; })}</div>;
}
