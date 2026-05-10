"use client";

import { motion } from "framer-motion";
import { CaretDoubleLeft, CaretDoubleRight, Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import AnimatedTextRTL from "@/components/shared/AnimatedTextRTL";
import { useVerseAudio } from "@/lib/hooks/useVerseAudio";

interface Props {
  nodeName: string;
  /** Current verse within the surah (1-based) */
  ayahNumber: number;
  ayahCount: number;
  arabic: string;
  translation: string;
  audioUrl: string | null;
  loading: boolean;
  playerError?: string | null;
  onRetryPlayer?: () => void;
  /** Fired when current ayah audio completes naturally */
  onAudioEnded?: () => void;
  /** Ayah stepping */
  onPreviousAyah?: () => void;
  onNextAyah?: () => void;
  disablePreviousAyah?: boolean;
  disableNextAyah?: boolean;
  /** Jump surah on the Journey map */
  onPreviousSurah?: () => void;
  onNextSurah?: () => void;
  disablePreviousSurah?: boolean;
  disableNextSurah?: boolean;
  onComplete: () => void;
}

/** Cream/frosted cards stay legible in app dark mode — do not use theme `--ink` / `--text-*` here. */
const panelBaseClasses =
  "bg-white/85 dark:bg-white/70 backdrop-blur-sm border border-[rgba(13,15,18,0.08)] rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden shadow-card-resting text-[#0D0F12]";

export default function JourneyPlayer({
  nodeName,
  ayahNumber,
  ayahCount,
  arabic,
  translation,
  audioUrl,
  loading,
  playerError,
  onRetryPlayer,
  onAudioEnded,
  onPreviousAyah,
  onNextAyah,
  disablePreviousAyah,
  disableNextAyah,
  onPreviousSurah,
  onNextSurah,
  disablePreviousSurah,
  disableNextSurah,
  onComplete
}: Props) {
  const { isPlaying, play, pause, progress, waveBars } = useVerseAudio(audioUrl, { onEnded: onAudioEnded });

  const ayahLabel =
    ayahCount > 0 ? (
      <p className="font-sans text-xs uppercase tracking-[0.15em] text-[#0D0F12]/55 mt-3">
        Ayah {ayahNumber} of {ayahCount}
      </p>
    ) : null;

  if (loading) {
    return (
      <div className={panelBaseClasses}>
        <div className="h-6 w-24 shimmer rounded-lg" />
        <div className="h-20 w-full shimmer rounded-xl mt-8" />
        <div className="h-16 w-full shimmer rounded-lg mt-8" />
        <div className="h-12 w-12 shimmer rounded-full mx-auto mt-6" />
      </div>
    );
  }
  if (playerError) {
    return (
      <motion.div layoutId="panelContent" className={`${panelBaseClasses} justify-center gap-6`}>
        <span className="text-[10px] tracking-[0.2em] uppercase text-[#0D0F12]/55 font-medium mb-4 block">Now Listening</span>
        <h2 className="font-display font-semibold text-2xl text-[#0D0F12]">{nodeName}</h2>
        {ayahLabel}
        <p className="font-sans text-sm text-[#0D0F12]/85">{playerError}</p>
        {onRetryPlayer ? (
          <motion.button
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onRetryPlayer}
            className="w-full py-4 rounded-full bg-[#0D0F12] text-[#F4EFE6] font-sans font-medium text-sm"
          >
            Retry
          </motion.button>
        ) : null}
      </motion.div>
    );
  }
  return (
    <motion.div layoutId="panelContent" className={panelBaseClasses}>
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#0D0F12]/55 font-medium mb-1 block">Now Listening</span>
      <h2 className="font-display font-semibold text-2xl text-[#0D0F12]">{nodeName}</h2>
      {ayahLabel}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] mt-6">
        <AnimatedTextRTL text={arabic} delay={0.2} />
        <p className="font-sans text-sm text-[#0D0F12]/90 italic text-right mt-6 max-w-[48ch] ml-auto">{translation}</p>
      </div>
      <hr className="border-[rgba(13,15,18,0.08)] my-8" />
      <div className="flex items-end gap-[3px] h-16 mb-4">
        {waveBars.map((v, i) => (
          <motion.div key={i} className="w-2 bg-[var(--gold)] rounded-full origin-bottom" animate={{ height: `${v}%` }} style={{ minHeight: "4px" }} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <button
          type="button"
          aria-label="Previous ayah"
          disabled={disablePreviousAyah || !onPreviousAyah}
          onClick={() => onPreviousAyah?.()}
          className="w-11 h-11 rounded-full border border-[rgba(13,15,18,0.1)] flex items-center justify-center text-[#0D0F12]/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.03]"
          title="Previous ayah"
        >
          <SkipBack weight="regular" size={20} />
        </button>

        <div className="relative flex-1 flex justify-center min-w-[120px]">
          <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] max-w-[88px] max-h-[88px] -rotate-90 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              stroke="var(--gold)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset={100 - progress * 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => (isPlaying ? pause() : play())}
            className="w-[52px] h-[52px] bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--ink)] shadow-md relative z-10 mx-auto"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause weight="regular" size={24} /> : <Play weight="regular" size={24} className="ml-1" />}
          </motion.button>
        </div>

        <button
          type="button"
          aria-label="Next ayah"
          disabled={disableNextAyah || !onNextAyah}
          onClick={() => onNextAyah?.()}
          className="w-11 h-11 rounded-full border border-[rgba(13,15,18,0.1)] flex items-center justify-center text-[#0D0F12]/80 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.03]"
          title="Next ayah"
        >
          <SkipForward weight="regular" size={20} />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(13,15,18,0.12)] px-4 py-2 text-xs font-sans font-medium text-[#0D0F12]/80 hover:bg-black/[0.03] disabled:opacity-35 disabled:pointer-events-none"
          disabled={disablePreviousSurah || !onPreviousSurah}
          onClick={() => onPreviousSurah?.()}
        >
          <CaretDoubleLeft weight="regular" size={14} aria-hidden /> Previous surah
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(13,15,18,0.12)] px-4 py-2 text-xs font-sans font-medium text-[#0D0F12]/80 hover:bg-black/[0.03] disabled:opacity-35 disabled:pointer-events-none"
          disabled={disableNextSurah || !onNextSurah}
          onClick={() => onNextSurah?.()}
        >
          Next surah <CaretDoubleRight weight="regular" size={14} aria-hidden />
        </button>
      </div>

      <motion.button
        whileHover={{ scale: 0.98 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        type="button"
        className="w-full py-4 rounded-full bg-[#0D0F12] text-[#F4EFE6] font-sans font-medium text-sm"
      >
        I finished listening
      </motion.button>
    </motion.div>
  );
}
