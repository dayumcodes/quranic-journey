"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import { pageVariants } from "@/lib/constants/motion";
import { useAuthStore } from "@/lib/store/authStore";

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return (
    <>
      <GlobalNav currentPage="profile" />
      <motion.main className="min-h-screen bg-[var(--parchment)] pt-28 pb-16 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-lg mx-auto">
          {!isAuthenticated || !user ? (
            <div className="rounded-3xl border border-[rgba(13,15,18,0.08)] bg-white/80 p-10 text-center">
              <h1 className="font-display text-2xl text-[var(--ink)] mb-4">Your profile</h1>
              <p className="text-[var(--text-2)] mb-8">Sign in to see account details synced with Quran Foundation.</p>
              <button type="button" onClick={() => void login()} className="rounded-full bg-[var(--ink)] text-[var(--parchment)] px-6 py-3 font-medium">
                Sign in
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-[rgba(13,15,18,0.08)] bg-white/90 p-10 shadow-card-resting">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[var(--gold)]/20 border-2 border-[var(--gold)]/60 flex items-center justify-center font-bold text-xl text-[var(--ink)]">
                  {user.avatar_initials}
                </div>
                <div>
                  <h1 className="font-display text-2xl text-[var(--ink)]">{user.name}</h1>
                  <p className="text-sm text-[var(--text-3)]">{user.email}</p>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[var(--text-3)] font-medium uppercase tracking-wider text-[11px]">Account ID</dt>
                  <dd className="font-mono text-[var(--ink)] break-all mt-1">{user.id}</dd>
                </div>
                {user.sub ? (
                  <div>
                    <dt className="text-[var(--text-3)] font-medium uppercase tracking-wider text-[11px]">QF subject (sub)</dt>
                    <dd className="font-mono text-[var(--ink)] break-all mt-1">{user.sub}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link href="/reflect" className="rounded-full border border-[var(--ink)]/20 px-5 py-2.5 text-sm font-medium hover:bg-black/5">
                  Go to Reflect
                </Link>
                <button type="button" onClick={() => logout()} className="rounded-full bg-[var(--ink)] text-[var(--parchment)] px-5 py-2.5 text-sm font-medium">
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
