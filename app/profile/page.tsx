"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "@phosphor-icons/react";
import GlobalNav from "@/components/nav/GlobalNav";
import { pageVariants } from "@/lib/constants/motion";
import { useAuthStore } from "@/lib/store/authStore";
import { updateMyProfile } from "@/lib/api/profile";
import { RequestError } from "@/lib/api/client";
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
  const { user, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.name]);

  const nextInitials = useMemo(() => {
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return user?.avatar_initials ?? "U";
    const first = words[0]?.[0] ?? "";
    const second = words.length > 1 ? words[1]?.[0] ?? "" : "";
    return `${first}${second}`.toUpperCase() || "U";
  }, [displayName, user?.avatar_initials]);

  return (
    <>
      <GlobalNav currentPage="profile" />
      <motion.main className="min-h-screen bg-[var(--parchment)] pt-[5.75rem] sm:pt-28 pb-12 sm:pb-16 px-4 sm:px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-lg mx-auto">
          {!isAuthenticated || !user ? (
            <div className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-muted)] p-6 sm:p-10 text-center backdrop-blur-sm">
              <h1 className="font-display text-2xl text-[var(--ink)] mb-4">Your profile</h1>
              <p className="text-[var(--text-2)] mb-8">Sign in to see account details synced with Quran Foundation.</p>
              <button type="button" onClick={() => void login()} className="rounded-full bg-[var(--ink)] text-[var(--parchment)] px-6 py-3 font-medium">
                Sign in
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 sm:p-10 shadow-card-resting backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[var(--gold)]/20 border-2 border-[var(--gold)]/60 flex items-center justify-center font-bold text-xl text-[var(--ink)]">
                  {user.avatar_initials}
                </div>
                <div>
                  <h1 className="font-display text-2xl text-[var(--ink)]">{user.name}</h1>
                  <p className="text-sm text-[var(--text-3)]">{user.email}</p>
                </div>
              </div>

              {process.env.NODE_ENV !== "production" ? (
                <p className="text-[12px] text-[var(--text-3)] leading-relaxed mb-6 bg-amber-50/90 dark:bg-amber-950/35 border border-amber-100 dark:border-amber-800/50 rounded-xl px-4 py-3">
                  For Pal links, chat, and other Quran Foundation-backed features, the login must return a unique <strong className="font-medium text-[var(--ink)]">sub</strong>. Goals, streaks, and collections still depend on approved Quran Foundation scopes. If two logins show the same id, open the{" "}
                  <a className="underline text-[var(--ink)]" href="https://docs.google.com/forms/d/1iYYHrU3AOM9OIaDi_nWdtBpHUSaliQgdwzzwcK_wGTw/viewform" target="_blank" rel="noopener noreferrer">
                    Quran.Foundation API access form
                  </a>{" "}
                  and ensure your OAuth app requests <strong className="font-medium">openid</strong> (and <strong className="font-medium">email</strong> if you want it shown here).
                </p>
              ) : null}
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-[var(--text-3)] font-medium uppercase tracking-wider text-[11px]">Display name</dt>
                  <dd className="mt-2">
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setSaveMessage(null);
                        }}
                        placeholder="How your name should appear"
                        className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--parchment)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)]"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={saveBusy || displayName.trim().length < 2 || displayName.trim() === (user.name ?? "").trim()}
                          onClick={() => {
                            const trimmed = displayName.trim();
                            if (trimmed.length < 2) {
                              setSaveMessage("Name must be at least 2 characters.");
                              return;
                            }
                            setSaveBusy(true);
                            setSaveMessage(null);
                            void updateMyProfile(trimmed)
                              .then(() => {
                                updateUser({
                                  name: trimmed,
                                  avatar_initials: nextInitials
                                });
                                setSaveMessage("Name updated.");
                              })
                              .catch((err) => {
                                if (err instanceof RequestError && err.message) setSaveMessage(err.message);
                                else setSaveMessage("Could not update name.");
                              })
                              .finally(() => setSaveBusy(false));
                          }}
                          className="rounded-full bg-[var(--ink)] text-[var(--parchment)] px-5 py-2.5 text-sm font-medium disabled:opacity-40"
                        >
                          {saveBusy ? "Saving..." : "Save name"}
                        </button>
                        {saveMessage ? <span className="text-sm text-[var(--text-2)]">{saveMessage}</span> : null}
                      </div>
                    </div>
                  </dd>
                </div>
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
