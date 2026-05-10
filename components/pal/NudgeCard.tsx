"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PaperPlaneRight, Sparkle } from "@phosphor-icons/react";

export default function NudgeCard({
  nudgeSent,
  onSend,
  partnerName = "Partner",
  partnerAheadDays = 0,
  message
}: {
  nudgeSent: boolean;
  onSend: () => void;
  partnerName?: string;
  partnerAheadDays?: number;
  /** Full line; when set, overrides the default “X days ahead” copy */
  message?: string;
}) {
  const label =
    message ??
    (partnerAheadDays > 0
      ? `${partnerName} is ${partnerAheadDays} day${partnerAheadDays === 1 ? "" : "s"} ahead — send encouragement!`
      : `Send ${partnerName} a quick note of encouragement`);

  return (
    <AnimatePresence>
      {!nudgeSent && (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="bg-amber-50/95 dark:bg-[var(--panel-muted)] border border-amber-200/60 dark:border-[var(--panel-border)] rounded-[1.5rem] p-5 sm:p-8 mb-12 sm:mb-16 lg:mb-20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-card-resting"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-[var(--gold)]/15 flex items-center justify-center shrink-0">
              <Sparkle weight="regular" size={24} className="text-amber-500 dark:text-[var(--gold)]" />
            </div>
            <p className="font-sans font-medium text-[var(--ink)]">{label}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onSend}
            title="Send nudge"
            aria-label="Send nudge"
            className="w-12 h-12 shrink-0 rounded-full bg-[var(--gold)] text-[var(--void)] flex items-center justify-center shadow-md sm:ml-4 self-end sm:self-auto"
          >
            <PaperPlaneRight weight="bold" size={22} className="-translate-x-px" aria-hidden />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
