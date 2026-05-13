"use client";

import { useState } from "react";
import { Check, Copy, LinkSimple, UserCircle } from "@phosphor-icons/react";
import { copyTextToClipboard } from "@/lib/utils/copyToClipboard";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export default function PalPartnerOnboarding({
  myUserId,
  onSavePartnerId,
  onCopied,
  onDismiss
}: {
  myUserId: string;
  onSavePartnerId: (uuid: string, nickname?: string) => boolean | Promise<boolean>;
  onCopied?: () => void;
  /** When user already has threads and opened “Add pal” */
  onDismiss?: () => void;
}) {
  const [pasteId, setPasteId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const copyInvite = async () => {
    const ok = await copyTextToClipboard(myUserId.trim());
    if (ok) {
      setInviteCopied(true);
      onCopied?.();
      window.setTimeout(() => setInviteCopied(false), 2500);
    }
  };

  const submitPartner = () => {
    setError(null);
    if (!isLikelyPartnerUserId(pasteId)) {
      setError("Enter a valid partner account ID. It cannot be your own.");
      return;
    }
    setSaveBusy(true);
    void Promise.resolve(onSavePartnerId(pasteId.trim(), nickname.trim() || undefined))
      .then((ok) => {
        if (!ok) setError("Enter a valid partner account ID. It cannot be your own.");
      })
      .catch(() => setError("Could not save partner. Try again."))
      .finally(() => setSaveBusy(false));
  };

  return (
    <div className="rounded-[1.5rem] border border-[var(--panel-border)] bg-[var(--panel-muted)] backdrop-blur-sm p-5 sm:p-8 mb-6 sm:mb-8 shadow-card-resting max-w-2xl mx-auto md:mx-0 text-[var(--ink)]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <UserCircle weight="regular" size={28} className="text-[var(--gold)]" />
          <h3 className="font-display font-semibold text-xl">Add a pal</h3>
        </div>
        {onDismiss ? (
          <button type="button" onClick={onDismiss} className="text-[12px] text-[var(--text-3)] hover:text-[var(--ink)] underline">
            Close
          </button>
        ) : null}
      </div>
      <p className="font-sans text-sm text-[var(--text-2)] mb-6 leading-relaxed">
        Pal compares progress and keeps shared messages between two Quran Foundation accounts. Share your account ID so your partner can connect, or paste their account ID once they send it to you.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => void copyInvite()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ink)] text-[var(--parchment)] text-sm font-medium hover:opacity-90"
        >
          {inviteCopied ? <Check weight="bold" size={18} /> : <Copy weight="regular" size={18} />}
          {inviteCopied ? "Copied!" : "Copy account ID"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] self-center px-2">
          <LinkSimple weight="regular" size={14} /> Both of you stay signed in for messages and goals to sync.
        </span>
      </div>

      <div className="space-y-3 border-t border-[var(--panel-border)] pt-6">
        <label className="block text-[12px] font-medium text-[var(--text-2)]">Partner&apos;s account ID</label>
        <input
          type="text"
          value={pasteId}
          onChange={(e) => setPasteId(e.target.value)}
          placeholder="Paste your partner's account ID"
          className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm font-mono text-[var(--ink)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--gold)]"
        />
        <label className="block text-[12px] font-medium text-[var(--text-2)]">Nickname (optional)</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="What you call them in the dashboard"
          className="w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--text-3)] outline-none focus:border-[var(--gold)]"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submitPartner}
          disabled={!isLikelyPartnerUserId(pasteId) || saveBusy}
          className="px-5 py-2.5 rounded-full bg-[var(--gold)] text-[var(--void)] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saveBusy ? "Saving…" : "Save partner"}
        </button>
      </div>
    </div>
  );
}
