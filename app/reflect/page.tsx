"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import ReflectCanvasMesh from "@/components/reflect/ReflectCanvasMesh";
import LocationDetector from "@/components/reflect/LocationDetector";
import ReflectVerseSkeleton from "@/components/reflect/ReflectVerseSkeleton";
import VerseReflectionCard from "@/components/reflect/VerseReflectionCard";
import VerseDots from "@/components/reflect/VerseDots";
import SavedDrawer from "@/components/reflect/SavedDrawer";
import { semanticSearch } from "@/lib/api/mcp";
import { useLocation } from "@/lib/hooks/useLocation";
import { pageVariants } from "@/lib/constants/motion";
import type { MCPSearchResult } from "@/types";

const MCP_FALLBACK: MCPSearchResult = {
  verse_key: "21:83",
  text_arabic: "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُ أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
  translation: "And [mention] Job, when he called to his Lord, \"Indeed, adversity has touched me, and You are the most merciful of the merciful.\"",
  surah_name: "Al-Anbiya",
  ayah_number: 83,
  relevance_score: 0
};

export default function ReflectPage() {
  const { state, classification } = useLocation();
  const [mcpLoading, setMcpLoading] = useState(false);
  const [results, setResults] = useState<MCPSearchResult[]>([]);
  const [verseIndex, setVerseIndex] = useState(0);

  const loadVersesForContext = useCallback(async () => {
    if (!classification?.keywords || state !== "DETECTED") return;
    setMcpLoading(true);
    try {
      const found = await semanticSearch(classification.keywords, 5);
      const valid = found.filter((r) => typeof r.verse_key === "string" && /^\d+:\d+$/.test(r.verse_key));
      const list = valid.length > 0 ? valid.slice(0, 5) : [MCP_FALLBACK];
      setResults(list);
      setVerseIndex(0);
    } finally {
      setMcpLoading(false);
    }
  }, [classification?.keywords, state]);

  useEffect(() => {
    if (state === "DETECTED" && classification?.keywords) {
      loadVersesForContext();
    } else if (state !== "DETECTED") {
      setResults([]);
      setVerseIndex(0);
      setMcpLoading(false);
    }
  }, [state, classification?.keywords, loadVersesForContext]);

  const current = results[verseIndex];

  const goPrev = () => setVerseIndex((i) => Math.max(0, i - 1));
  const goNext = () => setVerseIndex((i) => Math.min(results.length - 1, i + 1));

  return (
    <>
      <GlobalNav currentPage="reflect" />
      <motion.div className="min-h-screen bg-[var(--void)] text-white pt-32 pb-40 px-6 relative" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <ReflectCanvasMesh />
        <div className="absolute inset-0 grain-overlay" />
        <div className="relative z-10 max-w-[1320px] mx-auto flex flex-col items-center">
          <LocationDetector state={state} classification={classification} />
          <p className="mt-4 text-[13px] text-[var(--text-3)] underline cursor-pointer hover:text-white transition-colors">Enter context manually →</p>
          {state === "DETECTED" ? (
            mcpLoading ? (
              <ReflectVerseSkeleton />
            ) : (
              <>
                {current?.verse_key ? <VerseReflectionCard verseKey={current.verse_key} meta={current} /> : null}
                {results.length > 0 ? <VerseDots count={results.length} activeIndex={verseIndex} onPrev={goPrev} onNext={goNext} /> : null}
              </>
            )
          ) : null}
        </div>
        <SavedDrawer />
      </motion.div>
    </>
  );
}
