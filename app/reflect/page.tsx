"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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

const FALLBACK_BY_THEME: Record<string, MCPSearchResult[]> = {
  healing: [
    MCP_FALLBACK,
    { verse_key: "2:286", text_arabic: "", translation: "Allah does not burden a soul beyond that it can bear.", surah_name: "Al-Baqarah", ayah_number: 286, relevance_score: 0 },
    { verse_key: "94:5", text_arabic: "", translation: "For indeed, with hardship comes ease.", surah_name: "Ash-Sharh", ayah_number: 5, relevance_score: 0 }
  ],
  worship: [
    { verse_key: "13:28", text_arabic: "", translation: "Verily, in the remembrance of Allah do hearts find rest.", surah_name: "Ar-Rad", ayah_number: 28, relevance_score: 0 },
    { verse_key: "2:152", text_arabic: "", translation: "So remember Me; I will remember you.", surah_name: "Al-Baqarah", ayah_number: 152, relevance_score: 0 },
    { verse_key: "20:14", text_arabic: "", translation: "Establish prayer for My remembrance.", surah_name: "Taha", ayah_number: 14, relevance_score: 0 }
  ],
  journey: [
    { verse_key: "29:69", text_arabic: "", translation: "Those who strive for Us - We will surely guide them to Our ways.", surah_name: "Al-Ankabut", ayah_number: 69, relevance_score: 0 },
    { verse_key: "65:3", text_arabic: "", translation: "Whoever relies upon Allah - then He is sufficient for him.", surah_name: "At-Talaq", ayah_number: 3, relevance_score: 0 },
    { verse_key: "2:153", text_arabic: "", translation: "Seek help through patience and prayer.", surah_name: "Al-Baqarah", ayah_number: 153, relevance_score: 0 }
  ],
  hereafter: [
    { verse_key: "3:185", text_arabic: "", translation: "Every soul will taste death.", surah_name: "Aal-Imran", ayah_number: 185, relevance_score: 0 },
    { verse_key: "57:20", text_arabic: "", translation: "The life of this world is only play, amusement and adornment.", surah_name: "Al-Hadid", ayah_number: 20, relevance_score: 0 },
    { verse_key: "67:2", text_arabic: "", translation: "He created death and life to test you.", surah_name: "Al-Mulk", ayah_number: 2, relevance_score: 0 }
  ],
  knowledge: [
    { verse_key: "20:114", text_arabic: "", translation: "My Lord, increase me in knowledge.", surah_name: "Taha", ayah_number: 114, relevance_score: 0 },
    { verse_key: "39:9", text_arabic: "", translation: "Are those who know equal to those who do not know?", surah_name: "Az-Zumar", ayah_number: 9, relevance_score: 0 },
    { verse_key: "96:1", text_arabic: "", translation: "Read in the name of your Lord who created.", surah_name: "Al-Alaq", ayah_number: 1, relevance_score: 0 }
  ],
  home: [
    { verse_key: "25:74", text_arabic: "", translation: "Our Lord, grant us in our spouses and offspring comfort to our eyes.", surah_name: "Al-Furqan", ayah_number: 74, relevance_score: 0 },
    { verse_key: "30:21", text_arabic: "", translation: "He placed between you affection and mercy.", surah_name: "Ar-Rum", ayah_number: 21, relevance_score: 0 },
    { verse_key: "59:23", text_arabic: "", translation: "He is Allah... the Source of Peace.", surah_name: "Al-Hashr", ayah_number: 23, relevance_score: 0 }
  ]
};

function fallbackForKeywords(keywords: string): MCPSearchResult[] {
  const k = keywords.toLowerCase();
  const bucket = k.includes("healing")
    ? FALLBACK_BY_THEME.healing
    : k.includes("worship")
      ? FALLBACK_BY_THEME.worship
      : k.includes("journey") || k.includes("travel")
        ? FALLBACK_BY_THEME.journey
        : k.includes("hereafter") || k.includes("death")
          ? FALLBACK_BY_THEME.hereafter
          : k.includes("knowledge")
            ? FALLBACK_BY_THEME.knowledge
            : FALLBACK_BY_THEME.home;
  const offset = new Date().getDate() % bucket.length;
  return [...bucket.slice(offset), ...bucket.slice(0, offset)];
}

function ReflectPageInner() {
  const searchParams = useSearchParams();
  const deepVerseRaw = searchParams.get("verse");
  const deepLinkValid = !!(deepVerseRaw && /^\d+:\d+$/.test(deepVerseRaw));

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
      const list = valid.length > 0 ? valid.slice(0, 5) : fallbackForKeywords(classification.keywords);
      setResults(list);
      setVerseIndex(0);
    } finally {
      setMcpLoading(false);
    }
  }, [classification?.keywords, state]);

  useEffect(() => {
    if (deepLinkValid && deepVerseRaw) {
      const parts = deepVerseRaw.split(":");
      const surahNum = Number(parts[0]);
      const ayNum = Number(parts[1]);
      setResults([
        {
          verse_key: deepVerseRaw,
          text_arabic: "",
          translation: "",
          surah_name: Number.isFinite(surahNum) ? `Surah ${surahNum}` : "",
          ayah_number: Number.isFinite(ayNum) ? ayNum : 0,
          relevance_score: 0
        }
      ]);
      setVerseIndex(0);
      setMcpLoading(false);
    }
  }, [deepLinkValid, deepVerseRaw]);

  useEffect(() => {
    if (deepLinkValid) return;
    if (state === "DETECTED" && classification?.keywords) {
      loadVersesForContext();
    } else if (state !== "DETECTED") {
      setResults([]);
      setVerseIndex(0);
      setMcpLoading(false);
    }
  }, [deepLinkValid, state, classification?.keywords, loadVersesForContext]);

  const current = results[verseIndex];

  const goPrev = () => setVerseIndex((i) => Math.max(0, i - 1));
  const goNext = () => setVerseIndex((i) => Math.min(results.length - 1, i + 1));

  const showVerseBlock = useMemo(() => {
    if (deepLinkValid) return results.length > 0;
    return state === "DETECTED";
  }, [deepLinkValid, results.length, state]);

  return (
    <>
      <GlobalNav currentPage="reflect" />
      <motion.div className="min-h-screen bg-[var(--void)] text-white pt-32 pb-40 px-6 relative" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <ReflectCanvasMesh />
        <div className="absolute inset-0 grain-overlay" />
        <div className="relative z-10 max-w-[1320px] mx-auto flex flex-col items-center">
          <LocationDetector state={state} classification={classification} />
          <p className="mt-4 text-[13px] text-[var(--text-3)] underline cursor-pointer hover:text-white transition-colors">Enter context manually →</p>
          {showVerseBlock ? (
            mcpLoading && !deepLinkValid ? (
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

export default function ReflectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--void)] text-white pt-32 flex justify-center">Loading reflect…</div>}>
      <ReflectPageInner />
    </Suspense>
  );
}
