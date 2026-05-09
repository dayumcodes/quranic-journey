"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [manualPanelOpen, setManualPanelOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [manualSearching, setManualSearching] = useState(false);
  const [manualContextActive, setManualContextActive] = useState(false);
  /** After a manual search while geolocation is DETECTED, skip overwriting with location-based verses. */
  const preferManualVersesRef = useRef(false);

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

  const runManualSearch = useCallback(async () => {
    const q = manualQuery.trim();
    if (!q) return;
    setManualSearching(true);
    try {
      const found = await semanticSearch(q, 5);
      const valid = found.filter((r) => typeof r.verse_key === "string" && /^\d+:\d+$/.test(r.verse_key));
      const list = valid.length > 0 ? valid.slice(0, 5) : fallbackForKeywords(q);
      preferManualVersesRef.current = true;
      setResults(list);
      setVerseIndex(0);
      setManualContextActive(true);
      setManualPanelOpen(false);
    } finally {
      setManualSearching(false);
    }
  }, [manualQuery]);

  useEffect(() => {
    if (deepLinkValid && deepVerseRaw) {
      preferManualVersesRef.current = false;
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
      if (!preferManualVersesRef.current) {
        setManualContextActive(false);
        loadVersesForContext();
      }
    } else if (state !== "DETECTED" && !manualContextActive) {
      preferManualVersesRef.current = false;
      setResults([]);
      setVerseIndex(0);
      setMcpLoading(false);
    }
  }, [deepLinkValid, state, classification?.keywords, loadVersesForContext, manualContextActive]);

  const current = results[verseIndex];

  const goPrev = () => setVerseIndex((i) => Math.max(0, i - 1));
  const goNext = () => setVerseIndex((i) => Math.min(results.length - 1, i + 1));

  const showVerseBlock = useMemo(() => {
    if (deepLinkValid) return results.length > 0;
    if (manualContextActive && results.length > 0) return true;
    return state === "DETECTED";
  }, [deepLinkValid, manualContextActive, results.length, state]);

  return (
    <>
      <GlobalNav currentPage="reflect" />
      <motion.div className="min-h-screen bg-[var(--void)] text-white pt-32 pb-40 px-6 relative" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <ReflectCanvasMesh />
        <div className="absolute inset-0 grain-overlay" />
        <div className="relative z-10 max-w-[1320px] mx-auto flex flex-col items-center">
          <LocationDetector state={state} classification={classification} />
          <button
            type="button"
            aria-expanded={manualPanelOpen}
            onClick={() => setManualPanelOpen((o) => !o)}
            className="mt-4 text-[13px] text-[var(--text-3)] underline cursor-pointer hover:text-white transition-colors text-center"
          >
            Enter context manually →
          </button>
          {manualPanelOpen ? (
            <div className="mt-5 w-full max-w-lg mx-auto rounded-2xl border border-white/12 bg-white/[0.04] backdrop-blur-md p-5 space-y-3">
              <label htmlFor="reflect-manual-context" className="block text-left text-[12px] font-medium text-white/80">
                Describe your mood, situation, or what you are seeking reflection on
              </label>
              <textarea
                id="reflect-manual-context"
                value={manualQuery}
                onChange={(e) => setManualQuery(e.target.value)}
                rows={4}
                placeholder="e.g. patience during difficulty, gratitude, family..."
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-sm text-white placeholder:text-white/35 resize-y min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]/40"
              />
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setManualPanelOpen(false);
                    setManualQuery("");
                  }}
                  className="px-4 py-2 text-[13px] rounded-full border border-white/15 text-white/70 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={manualSearching || !manualQuery.trim()}
                  onClick={() => void runManualSearch()}
                  className="px-5 py-2 text-[13px] rounded-full bg-[var(--gold)] text-[var(--ink)] font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {manualSearching ? "Searching…" : "Find verses"}
                </button>
              </div>
            </div>
          ) : null}
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
