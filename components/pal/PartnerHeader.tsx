"use client";

import { motion } from "framer-motion";
import { BookOpen } from "@phosphor-icons/react";

export type PartnerHeaderSide = {
  avatarLetter: string;
  displayName: string;
  presenceLabel: string;
  presenceVariant?: "online" | "offline" | "neutral";
  readingLine?: string;
  /** e.g. comparative momentum ("Ahead this week"), not strictly days */
  comparisonBadge?: string;
};

export default function PartnerHeader({
  me,
  partner,
  partnerColumnPlaceholder
}: {
  me: PartnerHeaderSide;
  partner: PartnerHeaderSide | null;
  /** When partner not linked yet */
  partnerColumnPlaceholder?: string;
}) {
  const right = partner
    ? partner
    : ({
        avatarLetter: "—",
        displayName: partnerColumnPlaceholder ?? "Link your partner",
        presenceLabel: "",
        presenceVariant: "neutral" as const,
        readingLine: undefined,
        comparisonBadge: undefined
      } satisfies PartnerHeaderSide);

  const renderPresenceDot = (variant: PartnerHeaderSide["presenceVariant"]) => {
    if (!variant || variant === "neutral") return <div className="w-2 h-2 rounded-full bg-gray-300" />;
    if (variant === "online")
      return (
        <div className="w-2 h-2 rounded-full bg-emerald-400 relative">
          <motion.div
            animate={{ scale: [1, 1.8], opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-emerald-400"
          />
        </div>
      );
    return <div className="w-2 h-2 rounded-full bg-gray-300" />;
  };

  return (
    <div className="flex items-stretch min-h-[30vh] mb-20 relative">
      <div className="w-[55%] flex flex-col justify-center pr-12">
        <div className="flex items-center gap-6 mb-4">
          <div className="w-[72px] h-[72px] rounded-full bg-[var(--jade)]/20 border-2 border-[var(--jade)]/40 flex items-center justify-center font-arabic text-2xl text-[var(--jade)]">
            {me.avatarLetter}
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl text-[var(--ink)]">{me.displayName}</h2>
            {me.presenceLabel ? (
              <div className="flex items-center gap-2 mt-1">
                {renderPresenceDot(me.presenceVariant)}
                <span className="font-sans text-sm text-[var(--text-3)]">{me.presenceLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
        {me.readingLine ? (
          <div className="flex items-center gap-2 text-[var(--text-2)] font-medium text-sm pl-2">
            <BookOpen weight="regular" size={16} className="text-[var(--gold)]" />
            {me.readingLine}
          </div>
        ) : null}
      </div>

      <div className="absolute left-[55%] top-0 bottom-0 w-px -translate-x-1/2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--gold)]/20 to-transparent" />
        <motion.div
          animate={{ y: ["-100%", "400%"] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          className="w-1 h-16 bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent rounded-full -ml-[1.5px]"
        />
      </div>

      <div className="w-[45%] flex flex-col justify-center items-end text-right pl-12">
        <div className="flex items-center gap-6 mb-4 flex-row-reverse">
          <div
            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center font-arabic text-2xl ${
              partner ? "bg-orange-100 border-2 border-orange-200 text-orange-600" : "bg-[rgba(13,15,18,0.06)] border border-[rgba(13,15,18,0.1)] text-[var(--text-3)]"
            }`}
          >
            {right.avatarLetter}
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl text-[var(--ink)]">{right.displayName}</h2>
            <div className="flex items-center justify-end gap-2 mt-1 flex-wrap">
              {right.comparisonBadge ? (
                <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs px-3 py-0.5">
                  {right.comparisonBadge}
                </span>
              ) : null}
              {right.presenceLabel ? (
                <>
                  {renderPresenceDot(right.presenceVariant)}
                  <span className="font-sans text-sm text-[var(--text-3)]">{right.presenceLabel}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {right.readingLine ? (
          <div className="flex items-center justify-end gap-2 text-[var(--text-2)] font-medium text-sm pr-2">
            {right.readingLine}
            <BookOpen weight="regular" size={16} className="text-[var(--gold)]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
