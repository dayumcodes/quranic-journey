"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import ParticleBurst from "@/components/shared/ParticleBurst";
import { buildJourneyQuizQuestion } from "@/lib/quiz/generateJourneyQuiz";

const panelBaseClasses =
  "bg-white/85 dark:bg-white/70 backdrop-blur-sm border border-[rgba(13,15,18,0.08)] rounded-[2.5rem] p-10 h-full flex flex-col relative overflow-hidden shadow-card-resting text-[#0D0F12]";

interface Props {
  chapterId: number;
  /** English title e.g. "The Opener" */
  englishTitle: string;
  /** Surah roman name e.g. "Al-Fatihah" */
  nameSimple: string;
  sampleTranslation: string;
  gateCycleIndex: number;
  gatesLitThisCycle: number;
  /** Seeds random template mix for this quiz instance */
  quizSessionKey: number;
  onCompletePassed: () => void;
}

export default function JourneyQuiz({
  chapterId,
  englishTitle,
  nameSimple,
  sampleTranslation,
  gateCycleIndex,
  gatesLitThisCycle,
  quizSessionKey,
  onCompletePassed
}: Props) {
  const question = useMemo(
    () =>
      buildJourneyQuizQuestion({
        chapterId,
        nameSimple,
        englishTitle,
        sampleTranslation,
        gateCycleIndex,
        gatesLitThisCycle,
        sessionNonce: quizSessionKey
      }),
    [chapterId, englishTitle, gateCycleIndex, gatesLitThisCycle, nameSimple, quizSessionKey, sampleTranslation]
  );

  const [selected, setSelected] = useState<number | null>(null);
  /** After correct answer, lock UI until Journey advances */
  const [lockedCorrect, setLockedCorrect] = useState(false);

  useEffect(() => {
    setSelected(null);
    setLockedCorrect(false);
  }, [question.prompt, quizSessionKey]);

  return (
    <motion.div layoutId="panelContent" className={panelBaseClasses}>
      <span className="text-[10px] tracking-[0.2em] uppercase text-[#0D0F12]/55 font-medium mb-4 block">Quick Question</span>
      <h2 className="font-display font-semibold text-xl text-[#0D0F12] leading-snug whitespace-pre-wrap max-w-[42ch] mb-8">{question.prompt}</h2>
      <div className="flex flex-col gap-3 flex-1">
        {question.choices.map((ans, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === question.correctIndex;
          const showReveal = lockedCorrect;
          let stateClasses = "border border-[rgba(13,15,18,0.1)] hover:bg-[rgba(184,148,63,0.08)] hover:border-[var(--gold)]/40";
          if (showReveal && isCorrect) stateClasses = "bg-[#2A6B5E]/10 border-[var(--jade)] border-l-4";
          else if (showReveal && !isCorrect) stateClasses = "opacity-55 border-[rgba(13,15,18,0.08)]";
          else if (!lockedCorrect && isSelected && !isCorrect)
            stateClasses = "bg-red-50 border-red-200 text-red-700 animate-shake";

          const handlePick = () => {
            if (lockedCorrect) return;
            setSelected(idx);
            if (idx !== question.correctIndex) return;
            setLockedCorrect(true);
            window.setTimeout(() => {
              onCompletePassed();
            }, 950);
          };

          return (
            <motion.button
              key={`${quizSessionKey}-${idx}-${ans.slice(0, 24)}`}
              type="button"
              onClick={handlePick}
              disabled={lockedCorrect && !isCorrect}
              className={`text-left px-6 py-4 rounded-2xl font-sans font-medium transition-all duration-300 relative leading-snug ${stateClasses}`}
              animate={isSelected && !isCorrect && !lockedCorrect ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {lockedCorrect && isCorrect && <ParticleBurst trigger={true} color="rgba(42,107,94)" count={72} />}
              {ans}
            </motion.button>
          );
        })}
      </div>
      <p className="font-sans text-xs text-[#0D0F12]/60 mt-6 text-center leading-relaxed flex items-center justify-center gap-3">
        <CaretLeft aria-hidden weight="regular" />
        Quiz mix changes each time you finish listening and varies with your gate cycle
        <CaretRight aria-hidden weight="regular" />
      </p>
    </motion.div>
  );
}
