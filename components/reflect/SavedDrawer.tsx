"use client";
import { BookmarkSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
export default function SavedDrawer() {
  return <motion.button whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl"><BookmarkSimple weight="regular" size={20} className="text-[var(--gold)]" /><div className="w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--ink)] font-mono text-[10px] flex items-center justify-center font-bold">3</div></motion.button>;
}
