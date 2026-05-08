"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import ParticleBurst from "@/components/shared/ParticleBurst";

const panelBaseClasses = "bg-white/60 backdrop-blur-sm border border-[rgba(13,15,18,0.08)] rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden shadow-card-resting";
export default function JourneyQuiz({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const handleSelect = (idx: number) => { setSelected(idx); if (idx === 1) setTimeout(onComplete, 1500); };
  return <motion.div layoutId="panelContent" className={panelBaseClasses}><span className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-3)] font-medium mb-4 block">Quick Question</span><h2 className="font-display font-semibold text-xl text-[var(--ink)] max-w-[38ch] mb-8">What does "An-Nas" mean in English?</h2><div className="flex flex-col gap-3 flex-1">{["The Dawn","Mankind","The Daybreak","The Sincerity"].map((ans, idx) => { const isSelected = selected === idx; const isCorrect = idx === 1; const showState = selected !== null; let stateClasses = "border border-[rgba(13,15,18,0.1)] hover:bg-[rgba(184,148,63,0.08)] hover:border-[var(--gold)]/40"; if (showState && isSelected && !isCorrect) stateClasses = "bg-red-50 border-red-200 text-red-700 animate-shake"; if (showState && isCorrect) stateClasses = "bg-[#2A6B5E]/10 border-[var(--jade)] border-l-4"; return <motion.button key={idx} onClick={() => !showState && handleSelect(idx)} className={`text-left px-6 py-4 rounded-2xl font-sans font-medium transition-all duration-300 relative ${stateClasses}`} animate={showState && isSelected && !isCorrect ? { x: [0,-8,8,-6,6,-3,3,0] } : {}} transition={{ duration: 0.4 }}>{showState && isCorrect && isSelected && <ParticleBurst trigger={true} color="rgba(42,107,94)" count={80} />}{ans}</motion.button>; })}</div><div className="flex justify-center gap-2 mt-8">{[0,1,2,3,4].map(i => <div key={i} className={`w-2 h-2 rounded-full ${i===2 ? "bg-[var(--gold)]" : "border border-[rgba(13,15,18,0.2)]"}`} />)}</div></motion.div>;
}
