"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, ShareNetwork } from "@phosphor-icons/react";
import AnimatedTextRTL from "@/components/shared/AnimatedTextRTL";
import SaveButton from "@/components/reflect/SaveButton";
import { getTafsirByAyah, getVerseByKey } from "@/lib/api/quran";
import { getCollections, postCollection } from "@/lib/api/user";
import { verseArabicDisplay, verseTranslationDisplay } from "@/lib/utils/quranVerse";
import { useAuthStore } from "@/lib/store/authStore";
import type { MCPSearchResult } from "@/types";

interface Props {
  verseKey: string;
  /** Enriched label when MCP provided names */
  meta?: Pick<MCPSearchResult, "surah_name" | "ayah_number" | "text_arabic" | "translation"> | null;
}

function formatHeaderLabel(key: string, meta?: Props["meta"]): string {
  const parts = key.split(":");
  const ayNum = meta?.ayah_number ?? (parts[1] ? Number(parts[1]) : NaN);
  const ay = Number.isFinite(ayNum) ? ayNum : parts[1] ?? "?";
  if (meta?.surah_name) return `${meta.surah_name}, Ayah ${ay}`;
  return `Surah ${parts[0] ?? "?"}, Ayah ${ay}`;
}

export default function VerseReflectionCard({ verseKey, meta }: Props) {
  const { isAuthenticated, login } = useAuthStore();
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [arabic, setArabic] = useState(meta?.text_arabic ?? "");
  const [translation, setTranslation] = useState(meta?.translation ?? "");
  const [tafsirText, setTafsirText] = useState("");
  const [loading, setLoading] = useState(true);
  const headerLabel = formatHeaderLabel(verseKey, meta ?? undefined);
  const shareText = `${headerLabel}\n${translation}\n\nhttps://quranicjourney.vercel.app/reflect`;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setTafsirOpen(false);
      setTafsirText("");
      try {
        const verse = await getVerseByKey(verseKey);
        if (cancelled) return;
        setArabic(verseArabicDisplay(verse) || (meta?.text_arabic ?? ""));
        setTranslation(verseTranslationDisplay(verse, meta?.translation ?? ""));
        try {
          const tf = await getTafsirByAyah(verseKey);
          if (!cancelled) setTafsirText(tf?.text ?? "");
        } catch {
          if (!cancelled) setTafsirText("");
        }
      } catch {
        if (!cancelled) {
          setArabic(meta?.text_arabic ?? "");
          setTranslation(meta?.translation ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [verseKey, meta?.text_arabic, meta?.translation]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsSaved(false);
      return;
    }
    getCollections()
      .then((collections) => {
        const exists = collections.some((c) => (c.items ?? []).some((i) => i.verse_key === verseKey));
        setIsSaved(exists);
      })
      .catch(() => setIsSaved(false));
  }, [isAuthenticated, verseKey]);

  if (loading) {
    return (
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }} whileHover={{ y: -4 }} className="w-full max-w-[680px] mt-16 bg-white/[0.03] backdrop-blur-[24px] border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-shadow duration-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_32px_80px_-12px_rgba(0,0,0,0.6)]">
        <div className="h-3 w-32 shimmer-dark rounded-full" />
        <div className="h-28 w-full shimmer-dark rounded-xl mt-10" />
        <div className="h-4 w-full shimmer-dark rounded-full mt-8" />
        <div className="h-4 w-3/4 shimmer-dark rounded-full mt-2 ml-auto" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }}
      whileHover={{ y: -4 }}
      className="w-full max-w-[680px] mt-16 bg-white/[0.03] backdrop-blur-[24px] border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-shadow duration-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_32px_80px_-12px_rgba(0,0,0,0.6)]"
    >
      <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-[var(--text-3)] block mb-10">{headerLabel}</span>
      {arabic ? <AnimatedTextRTL text={arabic} delay={0.5} /> : null}
      <hr className="border-white/5 my-8" />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="font-sans text-base text-[var(--text-3)] italic text-right max-w-[52ch] ml-auto leading-relaxed">
        {translation ? `"${translation}"` : null}
      </motion.p>
      <div className="mt-10 pt-6 border-t border-white/5">
        <button type="button" onClick={() => setTafsirOpen(!tafsirOpen)} className="flex items-center gap-2 text-[13px] font-medium text-[var(--text-3)] hover:text-[var(--parchment)] transition-colors w-full">
          View Tafsir <CaretDown weight="regular" size={14} className={`transform transition-transform ${tafsirOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {tafsirOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div
                className="font-sans text-[13px] text-[var(--text-3)] leading-[1.9] pt-4 space-y-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{
                  __html:
                    tafsirText ||
                    "<p>This verse captures the profound patience of Prophet Ayyub (Job) during extreme physical illness and loss. Rather than complaining, his supplication is characterized by profound courtesy to Allah.</p>"
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={() => {
            if (navigator.share) {
              void navigator.share({ title: headerLabel, text: shareText });
              return;
            }
            const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(wa, "_blank", "noopener,noreferrer");
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-3)] hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <ShareNetwork weight="regular" size={16} /> Share Reflection
        </button>
        <SaveButton
          isSaved={isSaved}
          onSave={() => {
            if (isSaved) return;
            if (!isAuthenticated) {
              void login();
              return;
            }
            postCollection({
              name: "Saved Reflections",
              items: [{ verse_key: verseKey }]
            })
              .then(() => setIsSaved(true))
              .catch(() => setIsSaved(false));
          }}
        />
      </div>
    </motion.div>
  );
}
