"use client";

import { motion } from "framer-motion";
import { looksLikeArabicScript } from "@/lib/utils/arabicScript";

interface AnimatedTextRTLProps {
  text: string;
  delay?: number;
}

/**
 * Joined ayahs from `verseArabicDisplay` carry no spaces; a single flex “word” with `flex-row-reverse`
 * wrecked RTL rendering. Prefer a plain paragraph for one chunk; animate when there are multiple tokens.
 */
export default function AnimatedTextRTL({ text, delay = 0 }: AnimatedTextRTLProps) {
  const trimmed = text.trim();
  const chunks = trimmed ? trimmed.split(/\s+/) : [];
  const arabicHeavy = looksLikeArabicScript(trimmed);

  if (chunks.length <= 1) {
    return (
      <motion.p
        dir={arabicHeavy ? "rtl" : "ltr"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay, ease: [0.2, 0.65, 0.3, 0.9] }}
        className={`${arabicHeavy ? "font-arabic text-right" : "font-sans text-left"} text-2xl md:text-[1.85rem] leading-[2.05] tracking-normal break-words w-full min-w-0 whitespace-normal hyphens-none`}
      >
        {trimmed}
      </motion.p>
    );
  }

  return (
    <div dir="rtl" className="font-arabic flex flex-wrap gap-x-2 gap-y-4 justify-start text-right w-full min-w-0">
      {chunks.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
