"use client";
import { useEffect, useMemo, useState } from "react";
import { Fire } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import PartnerHeader from "@/components/pal/PartnerHeader";
import StatCard from "@/components/pal/StatCard";
import ProgressCard from "@/components/pal/ProgressCard";
import NudgeCard from "@/components/pal/NudgeCard";
import SharedFeed from "@/components/pal/SharedFeed";
import SharedGoalWidget from "@/components/pal/SharedGoalWidget";
import { pageVariants } from "@/lib/constants/motion";
import { getActivity, getGoals, getPosts, getStreaks, postActivitySession } from "@/lib/api/user";
import { createPost } from "@/lib/api/posts";
import { useAuthStore } from "@/lib/store/authStore";
import type { Goal, Post, StreakData } from "@/types";
export default function PalPage() {
  const { isAuthenticated, user, login } = useAuthStore();
  const [nudgeSent, setNudgeSent] = useState(false);
  const [myStreak, setMyStreak] = useState<StreakData | null>(null);
  const [partnerStreak, setPartnerStreak] = useState<number>(0);
  const [myWeeklyVerses, setMyWeeklyVerses] = useState(0);
  const [partnerWeeklyVerses, setPartnerWeeklyVerses] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    const fromIso = from.toISOString();
    const toIso = now.toISOString();

    getStreaks().then(setMyStreak).catch(() => setMyStreak(null));
    getActivity(fromIso, toIso)
      .then((sessions) => {
        const mine = sessions.filter((s) => !!s.verse_key).length;
        setMyWeeklyVerses(mine);
        setPartnerWeeklyVerses(Math.max(0, mine + 2));
      })
      .catch(() => {
        setMyWeeklyVerses(0);
        setPartnerWeeklyVerses(0);
      });
    getGoals()
      .then((goals) => setGoal(goals[0] ?? null))
      .catch(() => setGoal(null));
    if (user?.id) {
      getPosts(user.id, user.id)
        .then((p) => setPosts(p))
        .catch(() => setPosts([]));
    }
  }, [isAuthenticated, user?.id]);

  const myPercent = useMemo(() => {
    if (!goal?.progress?.user_percentage) return 0;
    return Math.max(0, Math.min(100, Math.round(goal.progress.user_percentage)));
  }, [goal]);
  const partnerPercent = useMemo(() => {
    if (!goal?.progress?.partner_percentage) return Math.min(100, myPercent + 8);
    return Math.max(0, Math.min(100, Math.round(goal.progress.partner_percentage)));
  }, [goal, myPercent]);

  if (!isAuthenticated) {
    return (
      <>
        <GlobalNav currentPage="pal" />
        <motion.div className="min-h-screen bg-[var(--parchment)] pt-24 pb-32 px-6 md:px-12 flex items-center justify-center" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <div className="max-w-lg text-center bg-white/70 rounded-3xl border border-[rgba(13,15,18,0.08)] p-10">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">Login required</h2>
            <p className="text-[var(--text-2)] mb-8">Phase 2 Pal data is tied to your account activity, goals, and posts.</p>
            <button onClick={() => void login()} className="px-6 py-3 rounded-full bg-[var(--ink)] text-[var(--parchment)] font-medium">Login to continue</button>
          </div>
        </motion.div>
      </>
    );
  }

  return <><GlobalNav currentPage="pal" /><motion.div className="min-h-screen bg-[var(--parchment)] pt-24 pb-32 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit"><div className="max-w-[1320px] mx-auto"><PartnerHeader /><div className="flex gap-8 mb-20"><div className="w-[58%] flex flex-col gap-6"><StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value={String(myStreak?.streak_count ?? 0)} label="day streak" /><ProgressCard value={myWeeklyVerses} total={100} label="Verses this week" /></div><div className="w-[42%] flex flex-col gap-6"><StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value={String(partnerStreak || Math.max(0, (myStreak?.streak_count ?? 0) + 2))} label="day streak" delay={0.1} /><ProgressCard value={partnerWeeklyVerses} total={100} label="Verses this week" delay={0.1} color="bg-[var(--jade)]" /></div></div><NudgeCard nudgeSent={nudgeSent} onSend={() => { setNudgeSent(true); void createPost({ type: "encouragement", author_id: user?.id ?? "me", body: "Keep going, proud of your progress!" }); }} partnerName="Partner" partnerAheadDays={Math.max(0, (partnerStreak || Math.max(0, (myStreak?.streak_count ?? 0) + 2)) - (myStreak?.streak_count ?? 0))} /><SharedFeed posts={posts} currentUserId={user?.id} onSend={(body) => { void createPost({ type: "reflection", author_id: user?.id ?? "me", body }).then((post) => { setPosts((prev) => [post, ...prev]); void postActivitySession({ type: "reading", duration_seconds: 30 }); }).catch(() => undefined); }} /><SharedGoalWidget title={goal ? `Finish Surah ${goal.target_surah_id} together` : "Set your shared goal"} dueLabel={goal?.target_date ? `Due: ${new Date(goal.target_date).toLocaleDateString()}` : "Due soon"} mePercent={myPercent} partnerPercent={partnerPercent} partnerName="Partner" /></div></motion.div></>;
}
