"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { User } from "@phosphor-icons/react";
import { SPRINGS } from "@/lib/constants/motion";
import { useAuthStore } from "@/lib/store/authStore";
import { usePalEncouragementToastStore } from "@/lib/store/palEncouragementToastStore";

interface Props {
  currentPage: "home" | "journey" | "reflect" | "pal" | "profile";
}

export default function GlobalNav({ currentPage }: Props) {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const encouragementPeek = usePalEncouragementToastStore((s) => s.peek);
  const setEncouragementPeek = usePalEncouragementToastStore((s) => s.setEncouragementPeek);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  /** Pal page pushes real encouragement payloads; auto-clear toast */
  useEffect(() => {
    if (currentPage !== "pal" || !encouragementPeek) return;
    const t = window.setTimeout(() => setEncouragementPeek(null), 6200);
    return () => window.clearTimeout(t);
  }, [currentPage, encouragementPeek, setEncouragementPeek]);

  /** Leaving Pal clears dangling peek */
  useEffect(() => {
    if (currentPage !== "pal") setEncouragementPeek(null);
  }, [currentPage, setEncouragementPeek]);
  const isDark = currentPage === "reflect";
  const inactiveTabTone = currentPage === "profile" ? "text-[var(--text-2)] hover:text-black" : isDark ? "text-[var(--text-3)] hover:text-white" : "text-[var(--text-2)] hover:text-black";
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
      <div className="flex-none relative flex flex-col items-center pt-1">
        <motion.div layoutId="dynamicIslandTabs" className={`flex p-1 rounded-full border ${isDark ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.06)]" : "bg-[rgba(13,15,18,0.05)] border-[rgba(13,15,18,0.06)]"}`}>
          {["journey", "reflect", "pal"].map((tab) => {
            const isActive = currentPage === tab;
            return (
              <Link key={tab} href={`/${tab === "journey" ? "journey" : tab}`} className={`relative px-5 py-1.5 text-sm font-sans font-medium rounded-full transition-colors z-10 ${isActive ? "text-[var(--ink)]" : inactiveTabTone}`}>
                {isActive && (
                  <motion.div layoutId="activePill" transition={{ type: "spring", stiffness: 300, damping: 26 }} className="absolute inset-0 bg-[var(--gold)] rounded-full -z-10 shadow-[0_2px_8px_rgba(184,148,63,0.3)]" />
                )}
                <span className="capitalize relative z-20">{tab}</span>
              </Link>
            );
          })}
        </motion.div>
        <AnimatePresence>
          {currentPage === "pal" && encouragementPeek ? (
            <motion.div
              key={encouragementPeek.sourceKey}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={SPRINGS.SNAPPY}
              className={`pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap flex items-center gap-3 px-4 py-2 rounded-full shadow-lg ${isDark ? "bg-white/10 text-white border border-white/10" : "bg-white text-black border border-[rgba(13,15,18,0.12)]"} backdrop-blur-xl max-w-[min(92vw,480px)]`}
            >
              <div className="w-6 h-6 rounded-full bg-[var(--jade)]/20 border border-[var(--jade)] flex items-center justify-center text-[10px] font-semibold text-[var(--jade)]">
                {encouragementPeek.senderInitials.slice(0, 2)}
              </div>
              <span className="font-sans text-sm font-medium truncate">
                {encouragementPeek.senderName} sent you encouragement
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="flex-1 flex justify-end">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!isAuthenticated) {
                void login();
                return;
              }
              setMenuOpen((v) => !v);
            }}
            title={isAuthenticated ? "Profile menu" : "Login"}
            className="w-9 h-9 rounded-full ring-1 ring-[var(--gold)]/60 overflow-hidden relative group bg-[var(--parchment)]"
          >
            {isAuthenticated ? (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-[var(--ink)]">
                {user?.avatar_initials ?? "U"}
              </span>
            ) : (
              <User weight="regular" size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--ink)] opacity-50" />
            )}
          </motion.button>
          {isAuthenticated && menuOpen ? (
            <div className="absolute right-0 mt-3 min-w-[180px] rounded-xl border border-white/10 bg-black/80 text-white backdrop-blur-md p-2 z-50 shadow-xl">
              <div className="px-3 py-2 text-xs text-white/70 truncate">Signed in as {user?.name ?? "User"}</div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.nav>
  );
}
