"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "@phosphor-icons/react";
import GlobalNav from "@/components/nav/GlobalNav";
import { pageVariants } from "@/lib/constants/motion";
import { useAuthStore } from "@/lib/store/authStore";
import { copyTextToClipboard } from "@/lib/utils/copyToClipboard";

function CopyIdRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <dd className="mt-1">
      <div className="flex items-start gap-2">
        <span className="font-mono text-[var(--ink)] break-all flex-1 min-w-0">{value}</span>
        <button
          type="button"
          onClick={() => {
            void copyTextToClipboard(value).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="shrink-0 p-1.5 rounded-lg border border-[var(--panel-border)] bg-[var(--parchment)] hover:bg-black/[0.04] dark:hover:bg-white/10 text-[var(--text-2)] hover:text-[var(--ink)] transition-colors"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
        >
          {copied ? <Check weight="bold" size={18} className="text-[var(--jade)]" /> : <Copy weight="regular" size={18} />}
        </button>
      </div>
    </dd>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  return (
    <>
      <GlobalNav currentPage="profile" />
      <motion.main className="min-h-screen bg-[var(--parchment)] pt-28 pb-16 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-lg mx-auto">
          {!isAuthenticated || !user ? (
            <div className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-muted)] p-10 text-center backdrop-blur-sm">
              <h1 className="font-display text-2xl text-[var(--ink)] mb-4">Your profile</h1>
              <p className="text-[var(--text-2)] mb-8">Sign in to see account details synced with Quran Foundation.</p>
              <button type="button" onClick={() => void login()} className="rounded-full bg-[var(--ink)] text-[var(--parchment)] px-6 py-3 font-medium">
                Sign in
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] p-10 shadow-card-resting backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[var(--gold)]/20 border-2 border-[var(--gold)]/60 flex items-center justify-center font-bold text-xl text-[var(--ink)]">
                  {user.avatar_initials}
                </div>
                <div>
                  <h1 className="font-display text-2xl text-[var(--ink)]">{user.name}</h1>
                  <p className="text-sm text-[var(--text-3)]">{user.email}</p>
                </div>
              </div>

              <p className="text-[12px] text-[var(--text-3)] leading-relaxed mb-6 bg-amber-50/90 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-800/50 rounded-xl px-4 py-3">
                For Pal links and API features (posts, goals, collections), Quran Foundation must return a unique <strong className="font-medium text-[var(--ink)]">sub</strong> and approved OAuth scopes. If two logins show the same id, open the{" "}
                <a className="underline text-[var(--ink)]" href="https://docs.google.com/forms/d/1iYYHrU3AOM9OIaDi_nWdtBpHUSaliQgdwzzwcK_wGTw/viewform" target="_blank" rel="noopener noreferrer">
                  Quran.Foundation API access form
                </a>{" "}
                and ensure your OAuth app requests <strong className="font-medium">openid</strong> (and <strong className="font-medium">email</strong> if you want it shown here).
              </p>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[var(--text-3)] font-medium uppercase tracking-wider text-[11px]">Account ID</dt>
                  <CopyIdRow label="Account ID" value={user.id} />
                </div>
                {user.sub ? (
                  <div>
                    <dt className="text-[var(--text-3)] font-medium uppercase tracking-wider text-[11px]">QF subject (sub)</dt>
                    <CopyIdRow label="QF subject (sub)" value={user.sub} />
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-3 mt-10">
                <Link href="/reflect" className="rounded-full border border-[var(--ink)]/20 px-5 py-2.5 text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/10">
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
