"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import JannahMap, { MapNode, chaptersToNodes } from "@/components/journey/JannahMap";
import JourneyPlayer from "@/components/journey/JourneyPlayer";
import JourneyQuiz from "@/components/journey/JourneyQuiz";
import JourneyBadge from "@/components/journey/JourneyBadge";
import BadgeStrip from "@/components/journey/BadgeStrip";
import type { PanelState } from "@/types";
import { getChapters, getRecitationByAyah, getVerseByKey } from "@/lib/api/quran";
import { pageVariants } from "@/lib/constants/motion";

export default function JourneyPage() {
  const [panelState, setPanelState] = useState<PanelState>("PLAYER");
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [activeNode, setActiveNode] = useState<MapNode | null>(null);
  const [arabic, setArabic] = useState("قُلْ أَعُوذُ بِرَبِّ النَّاسِ");
  const [translation, setTranslation] = useState('Say, "I seek refuge in the Lord of mankind,"');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const chapters = await getChapters();
        const mapped = chaptersToNodes(chapters);
        setNodes(mapped);
        setActiveNode(mapped[3]);
        const verse = await getVerseByKey("114:1");
        setArabic(verse.text_uthmani);
        setTranslation(verse.translations[0]?.text ?? translation);
        const rec = await getRecitationByAyah("114:1");
        setAudioUrl(rec.url.startsWith("http") ? rec.url : `https://verses.quran.foundation/${rec.url}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return <><GlobalNav currentPage="journey" /><motion.div className="min-h-screen pt-24 pb-32 px-6 md:px-12 max-w-[1320px] mx-auto bg-[var(--parchment)]" variants={pageVariants} initial="initial" animate="animate" exit="exit"><div className="flex flex-col lg:flex-row gap-12"><JannahMap nodes={nodes} onSelect={setActiveNode} loading={loading} /><div className="w-full lg:w-[42%] h-[600px] sticky top-24"><AnimatePresence mode="wait">{panelState === "PLAYER" && <JourneyPlayer key="player" nodeName={activeNode?.name ?? "An-Nas"} arabic={arabic} translation={translation} audioUrl={audioUrl} loading={loading} onComplete={() => setPanelState("QUIZ")} />}{panelState === "QUIZ" && <JourneyQuiz key="quiz" onComplete={() => setPanelState("BADGE")} />}{panelState === "BADGE" && <JourneyBadge key="badge" onContinue={() => setPanelState("PLAYER")} />}</AnimatePresence></div></div><div className="mt-32"><h3 className="font-display font-semibold text-2xl text-[var(--ink)] mb-1">Your Collection</h3><p className="font-sans text-sm text-[var(--text-3)] mb-8">10 gates · 3 unlocked</p><BadgeStrip /></div></motion.div></>;
}
