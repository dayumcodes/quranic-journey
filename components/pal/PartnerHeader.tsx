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
    if (!variant || variant === "neutral") return <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/25" />;
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
    return <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-white/25" />;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-stretch md:min-h-[min(30vh,420px)] mb-12 sm:mb-16 md:mb-20 gap-8 md:gap-0 relative">
      <div className="w-full md:w-[55%] flex flex-col justify-center md:pr-8 lg:pr-12 min-w-0">
        <div className="flex items-center gap-4 sm:gap-6 mb-3 sm:mb-4">
          <div className="w-14 h-14 sm:w-[72px] sm:h-[72px] shrink-0 rounded-full bg-[var(--jade)]/20 border-2 border-[var(--jade)]/40 flex items-center justify-center font-arabic text-xl sm:text-2xl text-[var(--jade)]">
            {me.avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink)] truncate">{me.displayName}</h2>
            {me.presenceLabel ? (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {renderPresenceDot(me.presenceVariant)}
                <span className="font-sans text-xs sm:text-sm text-[var(--text-3)]">{me.presenceLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
        {me.readingLine ? (
          <div className="flex items-start gap-2 text-[var(--text-2)] font-medium text-xs sm:text-sm pl-0 sm:pl-2 break-words">
            <BookOpen weight="regular" size={16} className="text-[var(--gold)] shrink-0 mt-0.5" />
            <span>{me.readingLine}</span>
          </div>
        ) : null}
      </div>

      <div className="md:hidden h-px w-full bg-[var(--panel-border)] shrink-0" aria-hidden />

      <div className="hidden md:block absolute left-[55%] top-0 bottom-0 w-px -translate-x-1/2 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--gold)]/20 to-transparent" />
        <motion.div
          animate={{ y: ["-100%", "400%"] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          className="w-1 h-16 bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent rounded-full -ml-[1.5px]"
        />
      </div>

      <div className="w-full md:w-[45%] flex flex-col justify-center items-stretch md:items-end text-left md:text-right md:pl-8 lg:pl-12 min-w-0">
        <div className="flex items-center gap-4 sm:gap-6 mb-3 sm:mb-4 w-full md:flex-row-reverse md:justify-start">
          <div
            className={`w-14 h-14 sm:w-[72px] sm:h-[72px] shrink-0 rounded-full flex items-center justify-center font-arabic text-xl sm:text-2xl ${
              partner ? "bg-orange-100 dark:bg-[var(--gold)]/15 border-2 border-orange-200 dark:border-[var(--gold)]/35 text-orange-600 dark:text-[var(--gold-light)]" : "bg-[rgba(13,15,18,0.06)] dark:bg-white/[0.06] border border-[rgba(13,15,18,0.1)] dark:border-white/10 text-[var(--text-3)]"
            }`}
          >
            {right.avatarLetter}
          </div>
          <div className="min-w-0 flex-1 md:text-right">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink)] break-words">{right.displayName}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap md:justify-end">
              {right.comparisonBadge ? (
                <span className="bg-amber-50 dark:bg-[var(--gold)]/12 border border-amber-200 dark:border-[var(--gold)]/30 text-amber-800 dark:text-[var(--gold-light)] rounded-full text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 max-w-full break-words">
                  {right.comparisonBadge}
                </span>
              ) : null}
              {right.presenceLabel ? (
                <>
                  {renderPresenceDot(right.presenceVariant)}
                  <span className="font-sans text-xs sm:text-sm text-[var(--text-3)]">{right.presenceLabel}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        {right.readingLine ? (
          <div className="flex items-start gap-2 justify-start md:justify-end text-[var(--text-2)] font-medium text-xs sm:text-sm pr-0 sm:pr-2 break-words">
            <span className="break-words min-w-0 md:text-right">{right.readingLine}</span>
            <BookOpen weight="regular" size={16} className="text-[var(--gold)] shrink-0 mt-0.5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
