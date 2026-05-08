"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
export default function NudgeCard({ nudgeSent, onSend }: { nudgeSent: boolean; onSend: () => void }) {
  return <AnimatePresence>{!nudgeSent && <motion.div initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 18 }} className="bg-amber-50 border border-amber-200/60 rounded-[1.5rem] p-8 mb-20 flex items-center justify-between shadow-card-resting"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center"><Sparkle weight="regular" size={24} className="text-amber-500" /></div><p className="font-sans font-medium text-[var(--ink)]">Amara is 2 days ahead — send them a word of encouragement!</p></div><motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSend} className="bg-[var(--ink)] text-[var(--parchment)] px-6 py-3 rounded-full font-sans font-medium text-sm relative">Send Nudge</motion.button></motion.div>}</AnimatePresence>;
}
