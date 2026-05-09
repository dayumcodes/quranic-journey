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
  onSavePartnerId: (uuid: string, nickname?: string) => boolean;
  onCopied?: () => void;
  /** When user already has threads and opened “Add pal” */
  onDismiss?: () => void;
}) {
  const [pasteId, setPasteId] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/pal?partner=${encodeURIComponent(myUserId)}` : "";

  const copyInvite = async () => {
    const ok = await copyTextToClipboard(inviteLink);
    if (ok) {
      setInviteCopied(true);
      onCopied?.();
      window.setTimeout(() => setInviteCopied(false), 2500);
    }
  };

  const submitPartner = () => {
    setError(null);
    const ok = onSavePartnerId(pasteId.trim(), nickname.trim() || undefined);
    if (!ok) setError("Enter a valid partner user ID (UUID). It cannot be your own.");
  };

  return (
    <div className="rounded-[1.5rem] border border-[rgba(13,15,18,0.1)] bg-white/90 backdrop-blur-sm p-8 mb-8 shadow-card-resting max-w-2xl mx-auto md:mx-0">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <UserCircle weight="regular" size={28} className="text-[var(--gold)]" />
          <h3 className="font-display font-semibold text-xl text-[var(--ink)]">Add a pal</h3>
        </div>
        {onDismiss ? (
          <button type="button" onClick={onDismiss} className="text-[12px] text-[var(--text-3)] hover:text-[var(--ink)] underline">
            Close
          </button>
        ) : null}
      </div>
      <p className="font-sans text-sm text-[var(--text-3)] mb-6 leading-relaxed">
        Pal compares progress and merges reflections between two Quran Foundation accounts. Share your invite link so your partner can connect, or paste their account ID once they send it to you.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => void copyInvite()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--ink)] text-[var(--parchment)] text-sm font-medium hover:opacity-90"
        >
          {inviteCopied ? <Check weight="bold" size={18} /> : <Copy weight="regular" size={18} />}
          {inviteCopied ? "Copied!" : "Copy invite link"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] self-center px-2">
          <LinkSimple weight="regular" size={14} /> Both of you stay signed in for posts and goals to sync.
        </span>
      </div>

      <div className="space-y-3 border-t border-[rgba(13,15,18,0.08)] pt-6">
        <label className="block text-[12px] font-medium text-[var(--text-2)]">Partner&apos;s account ID</label>
        <input
          type="text"
          value={pasteId}
          onChange={(e) => setPasteId(e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full rounded-xl border border-[rgba(13,15,18,0.12)] px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]"
        />
        <label className="block text-[12px] font-medium text-[var(--text-2)]">Nickname (optional)</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="What you call them in the dashboard"
          className="w-full rounded-xl border border-[rgba(13,15,18,0.12)] px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={submitPartner}
          disabled={!isLikelyPartnerUserId(pasteId)}
          className="px-5 py-2.5 rounded-full bg-[var(--gold)] text-[var(--ink)] text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save partner
        </button>
      </div>
    </div>
  );
}
