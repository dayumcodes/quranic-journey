"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { User } from "@phosphor-icons/react";
import { SPRINGS } from "@/lib/constants/motion";

interface Props {
  currentPage: "home" | "journey" | "reflect" | "pal";
}

export default function GlobalNav({ currentPage }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [nudgeActive, setNudgeActive] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useEffect(() => {
    if (currentPage === "pal") {
      setTimeout(() => setNudgeActive(true), 2000);
      setTimeout(() => setNudgeActive(false), 6000);
    }
  }, [currentPage]);
  const isDark = currentPage === "reflect";
  const navBg = isDark ? "bg-[#080A0E]/80" : "bg-[#F4EFE6]/80";
  const navBorder = isDark ? "border-[rgba(255,255,255,0.04)]" : "border-[rgba(13,15,18,0.06)]";

  return (
    <motion.nav
      animate={{ height: scrolled ? 52 : 64 }}
      transition={SPRINGS.DEFAULT}
      className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b ${navBg} ${navBorder} flex items-center px-6 md:px-12`}
    >
      <Link href="/" className="flex-1 flex items-center gap-2 cursor-pointer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={isDark ? "drop-shadow-[0_0_8px_rgba(184,148,63,0.4)]" : ""}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-display font-bold text-lg text-[var(--gold)]">Al-Rihla</span>
      </Link>
      <div className="flex-none relative">
        <AnimatePresence>
          {nudgeActive ? (
            <motion.div layoutId="dynamicIsland" initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={SPRINGS.SNAPPY} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap flex items-center gap-3 px-4 py-2 rounded-full ${isDark ? "bg-white/10 text-white" : "bg-black/5 text-black"} backdrop-blur-xl border border-[rgba(13,15,18,0.1)]`}>
              <div className="w-6 h-6 rounded-full bg-[var(--jade)]/20 border border-[var(--jade)] flex items-center justify-center text-[10px] font-arabic text-[var(--jade)]">A</div>
              <span className="font-sans text-sm font-medium">Amara sent you encouragement</span>
            </motion.div>
          ) : (
            <motion.div layoutId="dynamicIsland" className={`flex p-1 rounded-full border ${isDark ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.06)]" : "bg-[rgba(13,15,18,0.05)] border-[rgba(13,15,18,0.06)]"}`}>
              {["journey", "reflect", "pal"].map((tab) => {
                const isActive = currentPage === tab;
                return (
                  <Link key={tab} href={`/${tab === "journey" ? "journey" : tab}`} className={`relative px-5 py-1.5 text-sm font-sans font-medium rounded-full transition-colors z-10 ${isActive ? "text-[var(--ink)]" : isDark ? "text-[var(--text-3)] hover:text-white" : "text-[var(--text-2)] hover:text-black"}`}>
                    {isActive && <motion.div layoutId="activePill" transition={{ type: "spring", stiffness: 300, damping: 26 }} className="absolute inset-0 bg-[var(--gold)] rounded-full -z-10 shadow-[0_2px_8px_rgba(184,148,63,0.3)]" />}
                    <span className="capitalize relative z-20">{tab}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1 flex justify-end">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-full ring-1 ring-[var(--gold)]/60 overflow-hidden relative group bg-[var(--parchment)]">
          <User weight="regular" size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--ink)] opacity-50" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
