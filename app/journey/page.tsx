"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import JannahMap, { chaptersToNodes, type MapNode } from "@/components/journey/JannahMap";
import JourneyPlayer from "@/components/journey/JourneyPlayer";
import JourneyQuiz from "@/components/journey/JourneyQuiz";
import JourneyBadge from "@/components/journey/JourneyBadge";
import BadgeStrip from "@/components/journey/BadgeStrip";
import type { Chapter, PanelState } from "@/types";
import { getChapters, getRecitationByAyah, getVerseByKey } from "@/lib/api/quran";
import { pageVariants } from "@/lib/constants/motion";
import { normalizeRecitationAudioUrl } from "@/lib/utils/audioUrl";
import { verseArabicDisplay, verseTranslationDisplay } from "@/lib/utils/quranVerse";
import { GATES_TOTAL, useJourneyProgressStore } from "@/lib/store/journeyProgressStore";

const DEFAULT_FALLBACK_ARABIC = "قُلْ أَعُوذُ بِرَبِّ النَّاسِ";
const DEFAULT_FALLBACK_TRANSLATION = "Say, \"I seek refuge in the Lord of mankind,\"";
const CHAPTER_TARGET = 114;

export default function JourneyPage() {
  interface AyahBundle {
    arabic: string;
    translation: string;
    audioUrl: string | null;
  }

  const [panelState, setPanelState] = useState<PanelState>("PLAYER");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [quizSessionKey, setQuizSessionKey] = useState(0);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [arabic, setArabic] = useState(DEFAULT_FALLBACK_ARABIC);
  const [translation, setTranslation] = useState(DEFAULT_FALLBACK_TRANSLATION);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [verseRetryKey, setVerseRetryKey] = useState(0);
  const ayahCacheRef = useRef<Map<string, AyahBundle>>(new Map());
  const ayahInflightRef = useRef<Map<string, Promise<AyahBundle>>>(new Map());

  const gatesLitThisCycle = useJourneyProgressStore((s) => s.gatesLitThisCycle);
  const gateCycleIndex = useJourneyProgressStore((s) => s.gateCycleIndex);
  const hydrateFromCookie = useJourneyProgressStore((s) => s.hydrateFromCookie);
  const advanceGateAfterQuizPass = useJourneyProgressStore((s) => s.advanceGateAfterQuizPass);
  const streakDays = gatesLitThisCycle === 0 ? GATES_TOTAL : gatesLitThisCycle;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/journey/gates", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { gatesLitThisCycle?: number; gateCycleIndex?: number };
        hydrateFromCookie({
          gatesLitThisCycle: data.gatesLitThisCycle,
          gateCycleIndex: data.gateCycleIndex
        });
      } catch {
        /* offline */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromCookie]);

  const fetchChapters = useCallback(async () => {
    setMapLoading(true);
    setMapError(null);
    setNodes([]);
    setActiveNode(null);
    setChapters([]);
    try {
      const list = await getChapters();
      setChapters(list);
      const mapped = chaptersToNodes(list);
      setNodes(mapped);
      const defaultNode = mapped[0] ?? null;
      setActiveNode(defaultNode);
      if (!defaultNode) setPlayerError("No chapters returned from API.");
    } catch (e) {
      const msg =
        typeof e === "object" && e !== null && "message" in e ? String((e as Error).message) : String(e ?? "Unable to load map.");
      const hint =
        msg.includes("Failed to fetch") || msg.includes("NetworkError")
          ? " Check network and that `.env.local` has QF_CLIENT_ID / QF_CLIENT_SECRET for the Content API proxy."
          : "";
      setMapError(`${msg}${hint}`);
    } finally {
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    setAyahNumber(1);
  }, [activeNode?.chapterId]);

  const versesInSurah = useMemo(() => {
    const c = chapters.find((x) => x.id === activeNode?.chapterId);
    return c?.verses_count ?? 0;
  }, [chapters, activeNode?.chapterId]);

  const englishTitle = useMemo(() => {
    const c = chapters.find((x) => x.id === activeNode?.chapterId);
    return c?.translated_name?.name ?? "";
  }, [chapters, activeNode?.chapterId]);

  const loadAyahBundle = useCallback(async (verseKey: string): Promise<AyahBundle> => {
    const cached = ayahCacheRef.current.get(verseKey);
    if (cached) return cached;

    const inflight = ayahInflightRef.current.get(verseKey);
    if (inflight) return inflight;

    const promise = (async () => {
      const [verse, rec] = await Promise.all([getVerseByKey(verseKey), getRecitationByAyah(verseKey)]);
      const bundle: AyahBundle = {
        arabic: verseArabicDisplay(verse) || DEFAULT_FALLBACK_ARABIC,
        translation: verseTranslationDisplay(verse, DEFAULT_FALLBACK_TRANSLATION),
        audioUrl: normalizeRecitationAudioUrl(rec.url)
      };
      ayahCacheRef.current.set(verseKey, bundle);
      return bundle;
    })().finally(() => {
      ayahInflightRef.current.delete(verseKey);
    });

    ayahInflightRef.current.set(verseKey, promise);
    return promise;
  }, []);

  const prefetchAyahBundle = useCallback(
    (chapterId: number, ayah: number) => {
      if (ayah < 1 || (versesInSurah > 0 && ayah > versesInSurah)) return;
      const key = `${chapterId}:${ayah}`;
      if (ayahCacheRef.current.has(key) || ayahInflightRef.current.has(key)) return;
      void loadAyahBundle(key);
    },
    [loadAyahBundle, versesInSurah]
  );

  useEffect(() => {
    const chapterId = activeNode?.chapterId;
    if (!chapterId || mapError || nodes.length === 0 || versesInSurah <= 0) return undefined;
    if (ayahNumber < 1 || ayahNumber > versesInSurah) return undefined;

    let cancelled = false;

    const run = async () => {
      const verseKey = `${chapterId}:${ayahNumber}`;
      const cached = ayahCacheRef.current.get(verseKey);
      if (!cached) setVerseLoading(true);
      setPlayerError(null);
      try {
        const bundle = await loadAyahBundle(verseKey);
        if (cancelled) return;
        setArabic(bundle.arabic);
        setTranslation(bundle.translation);
        setAudioUrl(bundle.audioUrl);
        prefetchAyahBundle(chapterId, ayahNumber + 1);
        prefetchAyahBundle(chapterId, ayahNumber - 1);
      } catch (err) {
        if (!cancelled) {
          const msg =
            typeof err === "object" && err !== null && "message" in err ? String((err as Error).message) : String(err ?? "Unable to load verse/audio.");
          setPlayerError(msg);
          setArabic(DEFAULT_FALLBACK_ARABIC);
          setTranslation(DEFAULT_FALLBACK_TRANSLATION);
          setAudioUrl(null);
        }
      } finally {
        if (!cancelled) setVerseLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeNode?.chapterId, ayahNumber, verseRetryKey, mapError, nodes.length, versesInSurah, loadAyahBundle, prefetchAyahBundle]);

  const displayNodes = nodes.map((n) => ({ ...n, active: activeNode !== null && n.chapterId === activeNode.chapterId }));

  const activeChapterIndex = useMemo(() => {
    if (!activeNode) return -1;
    return nodes.findIndex((n) => n.chapterId === activeNode.chapterId);
  }, [nodes, activeNode]);

  const playerLoading = !playerError && (mapLoading || (!audioUrl && !!activeNode && verseLoading));

  const onSelectNode = useCallback((n: MapNode) => {
    setActiveNode({ ...n, active: true });
  }, []);

  const onPreviousSurah = useCallback(() => {
    if (activeChapterIndex <= 0) return;
    setActiveNode({ ...nodes[activeChapterIndex - 1]!, active: true });
    setAyahNumber(1);
  }, [nodes, activeChapterIndex]);

  const onNextSurah = useCallback(() => {
    if (activeChapterIndex < 0 || activeChapterIndex >= nodes.length - 1) return;
    setActiveNode({ ...nodes[activeChapterIndex + 1]!, active: true });
    setAyahNumber(1);
  }, [nodes, activeChapterIndex]);

  const onPreviousAyah = useCallback(() => {
    setAyahNumber((a) => (a > 1 ? a - 1 : a));
  }, []);

  const onNextAyah = useCallback(() => {
    setAyahNumber((a) => {
      if (versesInSurah <= 0) return a;
      return a < versesInSurah ? a + 1 : a;
    });
  }, [versesInSurah]);

  const onRetryVerse = useCallback(() => {
    const chapterId = activeNode?.chapterId;
    if (chapterId) {
      const key = `${chapterId}:${ayahNumber}`;
      ayahCacheRef.current.delete(key);
      ayahInflightRef.current.delete(key);
    }
    setPlayerError(null);
    setVerseRetryKey((k) => k + 1);
  }, [activeNode?.chapterId, ayahNumber]);

  const shortMapNotice = chapters.length > 0 && chapters.length < CHAPTER_TARGET;

  return (
    <>
      <GlobalNav currentPage="journey" />
      <motion.div
        className="min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-[1320px] mx-auto bg-[var(--parchment)]"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {shortMapNotice ? (
          <p className="mb-8 font-sans text-sm text-amber-900/90 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 max-w-3xl">
            Your Content API credentials returned{" "}
            <strong>{chapters.length}</strong> chapter{chapters.length === 1 ? "" : "s"}. Demo keys are often capped;
            deploy with{" "}
            <code className="text-xs px-1.5 py-0.5 bg-white rounded">QF_ENV=production</code> and production keys from
            Quran Foundation when you need the full 114-surah catalog.
          </p>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-12">
          <JannahMap
            nodes={displayNodes}
            onSelect={onSelectNode}
            loading={mapLoading}
            mapError={mapError}
            onRetryMap={fetchChapters}
          />
          <div className="w-full lg:w-[42%] h-[600px] sticky top-24">
            <AnimatePresence mode="wait">
              {panelState === "PLAYER" && (
                <JourneyPlayer
                  key={`player-${activeNode?.chapterId ?? ""}:${ayahNumber}`}
                  nodeName={activeNode?.name ?? "—"}
                  ayahNumber={ayahNumber}
                  ayahCount={versesInSurah}
                  arabic={arabic}
                  translation={translation}
                  audioUrl={audioUrl}
                  loading={playerLoading}
                  playerError={playerError && !playerLoading ? playerError : null}
                  onRetryPlayer={onRetryVerse}
                  onPreviousAyah={onPreviousAyah}
                  onNextAyah={onNextAyah}
                  disablePreviousAyah={ayahNumber <= 1 || versesInSurah <= 0}
                  disableNextAyah={versesInSurah <= 0 || ayahNumber >= versesInSurah}
                  onPreviousSurah={onPreviousSurah}
                  onNextSurah={onNextSurah}
                  disablePreviousSurah={activeChapterIndex <= 0}
                  disableNextSurah={activeChapterIndex < 0 || activeChapterIndex >= nodes.length - 1}
                  onComplete={() => {
                    setQuizSessionKey((k) => k + 1);
                    setPanelState("QUIZ");
                  }}
                />
              )}
              {panelState === "QUIZ" && activeNode?.chapterId != null ? (
                <JourneyQuiz
                  key={`quiz-${activeNode.chapterId}:${quizSessionKey}`}
                  chapterId={activeNode.chapterId}
                  englishTitle={englishTitle || "—"}
                  nameSimple={activeNode.name}
                  sampleTranslation={translation}
                  gateCycleIndex={gateCycleIndex}
                  gatesLitThisCycle={gatesLitThisCycle}
                  quizSessionKey={quizSessionKey * 20_047 + activeNode.chapterId * 1_009 + gateCycleIndex * 17}
                  onCompletePassed={() => {
                    advanceGateAfterQuizPass();
                    setPanelState("BADGE");
                  }}
                />
              ) : null}
              {panelState === "BADGE" && (
                <JourneyBadge key="badge" streakDays={streakDays} onContinue={() => setPanelState("PLAYER")} />
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-32">
          <h3 className="font-display font-semibold text-2xl text-[var(--ink)] mb-1">Your Collection</h3>
          {process.env.NODE_ENV !== "production" ? (
            <p className="font-sans text-sm text-[var(--text-2)] mb-3 max-w-2xl">
              Thirty gates persist in an httpOnly cookie via <span className="font-mono text-xs px-1">/api/journey/gates</span>.
              Completing thirty quizzes rotates a new gate cycle—question seeds change so quizzes stay varied for the active surah mix.
            </p>
          ) : null}
          <p className="font-sans text-sm text-[var(--text-3)] mb-8">
            {gatesLitThisCycle} gates lit · {GATES_TOTAL} per cycle · round {gateCycleIndex + 1}
          </p>
          <BadgeStrip unlocked={gatesLitThisCycle} total={GATES_TOTAL} />
        </div>
      </motion.div>
    </>
  );
}
