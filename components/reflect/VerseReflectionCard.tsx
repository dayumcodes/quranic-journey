"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretDown, Copy, Pause, Play, ShareNetwork, ChatCircle } from "@phosphor-icons/react";
import AnimatedTextRTL from "@/components/shared/AnimatedTextRTL";
import SaveButton from "@/components/reflect/SaveButton";
import { getRecitationByAyah, getTafsirByAyah, getVerseByKey } from "@/lib/api/quran";
import { getCollections, postCollection } from "@/lib/api/user";
import { verseArabicDisplay, verseTranslationDisplay } from "@/lib/utils/quranVerse";
import { normalizeRecitationAudioUrl } from "@/lib/utils/audioUrl";
import { addLocalBookmark, hasLocalBookmark } from "@/lib/utils/reflectBookmarks";
import { copyTextToClipboard } from "@/lib/utils/copyToClipboard";
import { buildWhatsAppShareUrl } from "@/lib/utils/whatsappShare";
import { useVerseAudio } from "@/lib/hooks/useVerseAudio";
import { useAuthStore } from "@/lib/store/authStore";
import type { MCPSearchResult } from "@/types";

interface Props {
  verseKey: string;
  meta?: Pick<MCPSearchResult, "surah_name" | "ayah_number" | "text_arabic" | "translation"> | null;
}

function formatHeaderLabel(key: string, meta?: Props["meta"]): string {
  const parts = key.split(":");
  const ayNum = meta?.ayah_number ?? (parts[1] ? Number(parts[1]) : NaN);
  const ay = Number.isFinite(ayNum) ? ayNum : parts[1] ?? "?";
  if (meta?.surah_name) return `${meta.surah_name}, Ayah ${ay}`;
  return `Surah ${parts[0] ?? "?"}, Ayah ${ay}`;
}

/** Plain reflection text for copy / share — Arabic + English, no URLs. */
function formatReflectionShareText(headerLabel: string, arabic: string, translation: string, verseKey: string): string {
  const lines: string[] = [headerLabel.trim()];
  const ar = arabic.trim();
  if (ar) lines.push("", ar);
  const tr = translation.trim();
  if (tr) lines.push("", tr);
  lines.push("", verseKey.trim());
  return lines.join("\n").trim();
}

export default function VerseReflectionCard({ verseKey, meta }: Props) {
  const { isAuthenticated, login } = useAuthStore();
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [whatsAppHref, setWhatsAppHref] = useState<string | null>(null);
  const [arabic, setArabic] = useState(meta?.text_arabic ?? "");
  const [translation, setTranslation] = useState(meta?.translation ?? "");
  const [tafsirText, setTafsirText] = useState("");
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const headerLabel = formatHeaderLabel(verseKey, meta ?? undefined);
  const sharePlainText = formatReflectionShareText(headerLabel, arabic, translation, verseKey);

  useEffect(() => {
    if (!shareHint) return;
    const t = window.setTimeout(() => setShareHint(null), 3500);
    return () => window.clearTimeout(t);
  }, [shareHint]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWhatsAppHref(buildWhatsAppShareUrl(sharePlainText));
  }, [sharePlainText]);

  const { isPlaying, play, pause } = useVerseAudio(audioUrl);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setTafsirOpen(false);
      setTafsirText("");
      setAudioUrl(null);
      setSaveError(null);
      try {
        const [verse, rec] = await Promise.all([getVerseByKey(verseKey), getRecitationByAyah(verseKey)]);
        if (cancelled) return;
        setArabic(verseArabicDisplay(verse) || (meta?.text_arabic ?? ""));
        setTranslation(verseTranslationDisplay(verse, meta?.translation ?? ""));
        setAudioUrl(normalizeRecitationAudioUrl(rec.url));
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
      setIsSaved(hasLocalBookmark(verseKey));
      return;
    }
    getCollections()
      .then((collections) => {
        const apiSaved = collections.some((c) => (c.items ?? []).some((i) => i.verse_key === verseKey));
        setIsSaved(apiSaved || hasLocalBookmark(verseKey));
      })
      .catch(() => {
        setIsSaved(hasLocalBookmark(verseKey));
      });
  }, [isAuthenticated, verseKey]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: headerLabel, text: sharePlainText });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    const ok = await copyTextToClipboard(sharePlainText);
    setShareHint(ok ? "Copied to clipboard" : "Copy failed — use the WhatsApp or Copy button");
  };

  const openSms = () => {
    window.location.href = `sms:?&body=${encodeURIComponent(sharePlainText)}`;
  };

  const copyShare = async () => {
    const ok = await copyTextToClipboard(sharePlainText);
    setShareHint(ok ? "Copied to clipboard" : "Could not copy this text — try Messages or WhatsApp link");
  };

  if (loading) {
    return (
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }} whileHover={{ y: -4 }} className="w-full max-w-[680px] mt-16 bg-[var(--reflect-glass)] backdrop-blur-[24px] border border-[var(--reflect-glass-border)] rounded-[2.5rem] p-8 md:p-14 shadow-[0_32px_64px_-16px_rgba(13,15,18,0.1)] transition-shadow duration-500 hover:shadow-[0_36px_72px_-12px_rgba(13,15,18,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_-16px_rgba(0,0,0,0.5)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_36px_80px_-12px_rgba(0,0,0,0.58)]">
        <div className="h-3 w-32 reflect-loading-shimmer rounded-full" />
        <div className="h-28 w-full reflect-loading-shimmer rounded-xl mt-10" />
        <div className="h-4 w-full reflect-loading-shimmer rounded-full mt-8" />
        <div className="h-4 w-3/4 reflect-loading-shimmer rounded-full mt-2 ml-auto" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }}
      whileHover={{ y: -4 }}
      className="w-full max-w-[680px] mt-16 text-[var(--reflect-fg)] bg-[var(--reflect-glass)] backdrop-blur-[24px] border border-[var(--reflect-glass-border)] rounded-[2.5rem] p-8 md:p-14 shadow-[0_32px_64px_-16px_rgba(13,15,18,0.1)] transition-shadow duration-500 hover:shadow-[0_36px_72px_-12px_rgba(13,15,18,0.14)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_-16px_rgba(0,0,0,0.5)] dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_36px_80px_-12px_rgba(0,0,0,0.58)]"
    >
      <div className="flex flex-wrap items-center gap-4 justify-between mb-6">
        <span className="font-sans text-[11px] tracking-[0.18em] uppercase text-[var(--reflect-fg-soft)]">{headerLabel}</span>
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            disabled={!audioUrl}
            title={audioUrl ? (isPlaying ? "Pause audio" : "Listen to this ayah") : "Audio unavailable"}
            onClick={() => {
              if (!audioUrl) return;
              if (isPlaying) pause();
              else play();
            }}
            className="flex items-center gap-2 rounded-full border border-[var(--reflect-ui-border)] bg-[var(--reflect-ui-bg)] px-3 py-2 text-[12px] font-medium text-[var(--reflect-fg)] hover:bg-black/[0.06] dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying ? <Pause weight="fill" size={16} /> : <Play weight="fill" size={16} />}
            Listen
          </motion.button>
        </div>
      </div>

      {arabic ? <AnimatedTextRTL text={arabic} delay={0.5} /> : null}
      <hr className="border-[var(--reflect-ui-border)] my-8 opacity-60" />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="font-sans text-base text-[var(--reflect-fg-soft)] italic text-right max-w-[52ch] ml-auto leading-relaxed">
        {translation ? `"${translation}"` : null}
      </motion.p>
      <div className="mt-10 pt-6 border-t border-[var(--reflect-ui-border)] opacity-90">
        <button type="button" onClick={() => setTafsirOpen(!tafsirOpen)} className="flex items-center gap-2 text-[13px] font-medium text-[var(--reflect-fg-soft)] hover:text-[var(--reflect-fg)] transition-colors w-full">
          View Tafsir <CaretDown weight="regular" size={14} className={`transform transition-transform ${tafsirOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {tafsirOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div
                className="font-sans text-[13px] text-[var(--reflect-fg-soft)] leading-[1.9] pt-4 space-y-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
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

      <div className="flex flex-col gap-4 mt-12 pt-6 border-t border-[var(--reflect-ui-border)] opacity-90">
        <div className="flex flex-wrap gap-2 items-center">
          <button type="button" onClick={handleShare} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--reflect-fg-soft)] hover:text-[var(--reflect-fg)] transition-colors rounded-full hover:bg-black/[0.04] dark:hover:bg-white/5">
            <ShareNetwork weight="regular" size={16} /> Share reflection
          </button>
          {whatsAppHref ? (
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              title="Open WhatsApp with this reflection"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-full border border-emerald-600/35 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-200/90 hover:bg-emerald-500/10"
            >
              WhatsApp
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-full border border-emerald-600/25 text-emerald-800/40 dark:border-emerald-500/20 dark:text-emerald-200/40">
              WhatsApp
            </span>
          )}
          <button type="button" onClick={openSms} title="Messages / SMS" className="flex items-center gap-1 px-3 py-2 text-sm rounded-full border border-[var(--reflect-ui-border)] text-[var(--reflect-fg-soft)] hover:bg-black/[0.04] dark:hover:bg-white/5">
            <ChatCircle weight="regular" size={16} /> Message
          </button>
          <button type="button" onClick={copyShare} title="Copy to clipboard" className="flex items-center gap-1 px-3 py-2 text-sm rounded-full border border-[var(--reflect-ui-border)] text-[var(--reflect-fg-soft)] hover:bg-black/[0.04] dark:hover:bg-white/5">
            <Copy weight="regular" size={16} /> Copy
          </button>
        </div>
        {shareHint ? <p className="text-xs text-emerald-700 dark:text-emerald-200/90">{shareHint}</p> : null}
        {saveError ? <p className="text-xs text-amber-800 dark:text-amber-200/90">{saveError}</p> : null}
        <div className="flex justify-end">
          <SaveButton
            isSaved={isSaved}
            onSave={() => {
              if (isSaved) return;
              setSaveError(null);
              if (!isAuthenticated) {
                void login();
                return;
              }
              postCollection({
                name: "Saved Reflections",
                items: [{ verse_key: verseKey }]
              })
                .then(() => {
                  addLocalBookmark(verseKey);
                  setIsSaved(true);
                })
                .catch(() => {
                  addLocalBookmark(verseKey);
                  setIsSaved(true);
                  setSaveError("Saved on this device.");
                });
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
