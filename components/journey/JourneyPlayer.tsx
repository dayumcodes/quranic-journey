"use client";

import { motion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import AnimatedTextRTL from "@/components/shared/AnimatedTextRTL";
import { useVerseAudio } from "@/lib/hooks/useVerseAudio";

interface Props {
  nodeName: string;
  arabic: string;
  translation: string;
  audioUrl: string | null;
  loading: boolean;
  onComplete: () => void;
}

const panelBaseClasses = "bg-white/60 backdrop-blur-sm border border-[rgba(13,15,18,0.08)] rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden shadow-card-resting";

export default function JourneyPlayer({ nodeName, arabic, translation, audioUrl, loading, onComplete }: Props) {
  const { isPlaying, play, pause, progress, waveBars } = useVerseAudio(audioUrl);
  if (loading) {
    return <div className={panelBaseClasses}><div className="h-6 w-24 shimmer rounded-lg" /><div className="h-20 w-full shimmer rounded-xl mt-8" /><div className="h-16 w-full shimmer rounded-lg mt-8" /><div className="h-12 w-12 shimmer rounded-full mx-auto mt-6" /></div>;
  }
  return (
    <motion.div layoutId="panelContent" className={panelBaseClasses}>
      <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-3)] font-medium mb-4 block">Now Listening</span>
      <h2 className="font-display font-semibold text-2xl text-[var(--ink)] mb-8">{nodeName}</h2>
      <div className="flex-1">
        <AnimatedTextRTL text={arabic} delay={0.2} />
        <p className="font-sans text-sm text-[var(--text-2)] italic text-right mt-6 max-w-[48ch] ml-auto">{translation}</p>
      </div>
      <hr className="border-[rgba(13,15,18,0.08)] my-8" />
      <div className="flex items-end gap-[3px] h-16 mb-8">{waveBars.map((v, i) => <motion.div key={i} className="w-2 bg-[var(--gold)] rounded-full origin-bottom" animate={{ height: `${v}%` }} style={{ minHeight: "4px" }} />)}</div>
      <div className="flex items-center justify-between mb-8">
        <button className="w-10 h-10 rounded-full border border-[rgba(13,15,18,0.1)] flex items-center justify-center text-[var(--text-2)]"><SkipBack weight="regular" size={18} /></button>
        <div className="relative">
          <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90">
            <circle cx="50%" cy="50%" r="48%" stroke="var(--gold)" strokeWidth="3" fill="none" strokeDasharray="100" strokeDashoffset={100 - progress * 100} className="transition-all duration-1000 ease-linear" />
          </svg>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.88 }} onClick={() => (isPlaying ? pause() : play())} className="w-[52px] h-[52px] bg-[var(--gold)] rounded-full flex items-center justify-center text-[var(--ink)] shadow-md relative z-10">
            {isPlaying ? <Pause weight="regular" size={24} /> : <Play weight="regular" size={24} className="ml-1" />}
          </motion.button>
        </div>
        <button className="w-10 h-10 rounded-full border border-[rgba(13,15,18,0.1)] flex items-center justify-center text-[var(--text-2)]"><SkipForward weight="regular" size={18} /></button>
      </div>
      <motion.button whileHover={{ scale: 0.98 }} whileTap={{ scale: 0.95 }} onClick={onComplete} className="w-full py-4 rounded-full bg-[var(--ink)] text-[var(--parchment)] font-sans font-medium text-sm">I finished listening</motion.button>
    </motion.div>
  );
}
