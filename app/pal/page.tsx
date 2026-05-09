"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fire } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import PartnerHeader from "@/components/pal/PartnerHeader";
import StatCard from "@/components/pal/StatCard";
import ProgressCard from "@/components/pal/ProgressCard";
import NudgeCard from "@/components/pal/NudgeCard";
import SharedFeed from "@/components/pal/SharedFeed";
import SharedGoalWidget from "@/components/pal/SharedGoalWidget";
import PalPartnerOnboarding from "@/components/pal/PalPartnerOnboarding";
import PalSharedGoalStarter from "@/components/pal/PalSharedGoalStarter";
import { pageVariants } from "@/lib/constants/motion";
import { createPost } from "@/lib/api/posts";
import { usePalPartner } from "@/lib/hooks/usePalPartner";
import { useAuthStore } from "@/lib/store/authStore";
import { getActivity, getGoals, getPosts, getStreaks, postActivitySession, postGoal } from "@/lib/api/user";
import { isLikelyPartnerUserId, loadStoredPartnerId } from "@/lib/utils/palPartnerStorage";
import type { Goal, Post, StreakData } from "@/types";

function initialsFrom(userName: string, fallback = "?"): string {
  const u = userName.trim();
  if (!u) return fallback.slice(0, 2).toUpperCase();
  const parts = u.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return u.slice(0, 2).toUpperCase();
}

function PalPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteRaw = searchParams.get("partner")?.trim() ?? "";
  const invitePartnerIdFromUrl = isLikelyPartnerUserId(inviteRaw) ? inviteRaw : null;

  const { isAuthenticated, user, login } = useAuthStore();
  const [nudgeSent, setNudgeSent] = useState(false);
  const [myStreak, setMyStreak] = useState<StreakData | null>(null);
  const [myWeeklyVerses, setMyWeeklyVerses] = useState(0);
  const [partnerWeeklyVerses, setPartnerWeeklyVerses] = useState(0);
  const [partnerWeeklyKnown, setPartnerWeeklyKnown] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [inviteNick, setInviteNick] = useState("");
  const [postsError, setPostsError] = useState<string | null>(null);
  const [goalBusy, setGoalBusy] = useState(false);

  const pal = usePalPartner(user?.id, goals, invitePartnerIdFromUrl);
  const partnerId = pal.partnerId;
  const hasPartner = pal.hasPartner;

  const sharedGoal = useMemo(() => goals.find((g) => g.type === "shared"), [goals]);
  const personalGoalFallback = goals[0] ?? null;
  const activeGoal = sharedGoal ?? personalGoalFallback;

  const refreshGoals = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;
    void getGoals()
      .then((g) => setGoals(Array.isArray(g) ? g : []))
      .catch(() => setGoals([]));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  useEffect(() => {
    setNudgeSent(false);
    setPostsError(null);
  }, [partnerId]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    getStreaks()
      .then(setMyStreak)
      .catch(() => setMyStreak(null));
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    const fromIso = from.toISOString();
    const toIso = now.toISOString();

    let cancelled = false;
    void getActivity(fromIso, toIso)
      .then((sessions) => {
        if (cancelled) return;
        const mine = sessions.filter((s) => !!s.verse_key).length;
        setMyWeeklyVerses(mine);
      })
      .catch(() => {
        if (cancelled) return;
        setMyWeeklyVerses(0);
      });

    if (partnerId) {
      void getActivity(fromIso, toIso, partnerId)
        .then((sessions) => {
          if (cancelled) return;
          const n = sessions.filter((s) => !!s.verse_key).length;
          setPartnerWeeklyVerses(n);
          setPartnerWeeklyKnown(true);
        })
        .catch(() => {
          if (cancelled) return;
          setPartnerWeeklyVerses(0);
          setPartnerWeeklyKnown(false);
        });
    } else {
      setPartnerWeeklyVerses(0);
      setPartnerWeeklyKnown(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, partnerId]);

  const loadPosts = useCallback(() => {
    if (!isAuthenticated || !user?.id || !partnerId) {
      setPosts([]);
      setPostsError(null);
      return;
    }
    setPostsError(null);
    void getPosts(user.id, partnerId)
      .then(setPosts)
      .catch(() => {
        setPosts([]);
        setPostsError("Could not load shared posts. Confirm posts scope is approved for both accounts.");
      });
  }, [isAuthenticated, user?.id, partnerId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const myPercent = useMemo(() => {
    const p = activeGoal?.progress?.user_percentage;
    if (typeof p !== "number" || Number.isNaN(p)) return 0;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [activeGoal]);

  const partnerPercent = useMemo(() => {
    const p = activeGoal?.progress?.partner_percentage;
    if (typeof p !== "number" || Number.isNaN(p)) return 0;
    return Math.max(0, Math.min(100, Math.round(p)));
  }, [activeGoal]);

  const partnerLastSeen = useMemo(() => {
    if (!partnerId || !posts.length) return null;
    const theirs = posts.filter((p) => p.author_id === partnerId);
    if (!theirs.length) return null;
    const latest = theirs.reduce((a, b) =>
      new Date(a.created_at) > new Date(b.created_at) ? a : b
    , theirs[0]!);
    return new Date(latest.created_at);
  }, [posts, partnerId]);

  const partnerPresenceLabel = useMemo(() => {
    if (!partnerId) return "";
    const now = Date.now();
    if (partnerLastSeen) {
      const diffMin = Math.floor((now - partnerLastSeen.getTime()) / 60000);
      if (diffMin < 45) return "Active recently";
      if (diffMin < 1440) return `Last activity ${partnerLastSeen.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      return `Last activity ${partnerLastSeen.toLocaleDateString()}`;
    }
    return "Sharing space — invite them to post!";
  }, [partnerId, partnerLastSeen]);

  const comparisonBadge = useMemo(() => {
    if (!partnerWeeklyKnown || partnerId == null) return undefined;
    if (partnerWeeklyVerses > myWeeklyVerses)
      return `+${partnerWeeklyVerses - myWeeklyVerses} verses this week vs you`;
    return undefined;
  }, [partnerWeeklyKnown, partnerId, partnerWeeklyVerses, myWeeklyVerses]);

  const nudgeDynamicMessage = useMemo(() => {
    if (!hasPartner || !comparisonBadge) return undefined;
    return `${pal.partnerDisplayName} is outpacing your weekly verses — send encouragement!`;
  }, [hasPartner, comparisonBadge, pal.partnerDisplayName]);

  const meSide = useMemo(() => {
    return {
      avatarLetter: (user?.avatar_initials || initialsFrom(user?.name ?? "You")).slice(0, 3),
      displayName: "You",
      presenceLabel: "Active now",
      presenceVariant: "online" as const,
      readingLine: activeGoal ? `Goal focus: Surah ${activeGoal.target_surah_id}` : undefined,
      comparisonBadge: undefined
    };
  }, [user?.avatar_initials, user?.name, activeGoal]);

  const partnerSide = useMemo(() => {
    if (!partnerId) return null;
    const nameForAvatar = pal.partnerDisplayName.trim();
    const avatarLetter =
      nameForAvatar.length > 0
        ? ([...nameForAvatar][0] ?? "?").toString()
        : partnerId.slice(0, 1).toUpperCase();
    return {
      avatarLetter,
      displayName: pal.partnerDisplayName,
      presenceLabel: partnerPresenceLabel,
      presenceVariant: "offline" as const,
      readingLine: undefined,
      comparisonBadge
    };
  }, [partnerId, pal.partnerDisplayName, partnerPresenceLabel, comparisonBadge]);

  const clearQuery = () => {
    router.replace("/pal");
  };

  const handleInviteConfirm = () => {
    pal.confirmPendingPartner(inviteNick.trim() || undefined);
    setInviteNick("");
    clearQuery();
  };

  const handleInviteDismiss = () => {
    pal.dismissPendingInvite();
    clearQuery();
  };

  const handleGoalCreate = (targetSurahId: number, versesPerDay: number, daysPerWeek: number) => {
    if (!user?.id || !partnerId) return;
    setGoalBusy(true);
    void postGoal({
      type: "shared",
      partner_id: partnerId,
      target_surah_id: Math.min(114, Math.max(1, Math.floor(targetSurahId))),
      verses_per_day: Math.max(1, Math.floor(versesPerDay)),
      days_per_week: Math.min(7, Math.max(1, Math.floor(daysPerWeek))),
      progress: { user_percentage: 0 }
    })
      .then(() => refreshGoals())
      .catch(() => undefined)
      .finally(() => setGoalBusy(false));
  };

  if (!isAuthenticated) {
    return (
      <>
        <GlobalNav currentPage="pal" />
        <motion.div
          className="min-h-screen bg-[var(--parchment)] pt-24 pb-32 px-6 md:px-12 flex items-center justify-center"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="max-w-lg text-center bg-white/70 rounded-3xl border border-[rgba(13,15,18,0.08)] p-10">
            <h2 className="font-display text-3xl text-[var(--ink)] mb-3">Login required</h2>
            <p className="text-[var(--text-2)] mb-8">Pal compares progress with a linked partner using your Quran Foundation account.</p>
            <button type="button" onClick={() => void login()} className="px-6 py-3 rounded-full bg-[var(--ink)] text-[var(--parchment)] font-medium">
              Login to continue
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <GlobalNav currentPage="pal" />
      <motion.div className="min-h-screen bg-[var(--parchment)] pt-24 pb-32 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-[1320px] mx-auto">
          {pal.pendingInvitePartnerId ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-[var(--ink)]">Partner invite</p>
                <p className="text-sm text-[var(--text-3)] mt-1">
                  Link <span className="font-mono text-xs">{pal.pendingInvitePartnerId.slice(0, 8)}…</span> as your accountability partner?
                </p>
                <label className="block text-[11px] text-[var(--text-3)] mt-3">
                  Nickname (optional)
                  <input value={inviteNick} onChange={(e) => setInviteNick(e.target.value)} className="mt-1 block w-full max-w-xs rounded-lg border border-[rgba(13,15,18,0.12)] px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={handleInviteDismiss} className="px-4 py-2 rounded-full border border-[rgba(13,15,18,0.15)] text-sm">
                  Not now
                </button>
                <button type="button" onClick={handleInviteConfirm} className="px-5 py-2 rounded-full bg-[var(--ink)] text-[var(--parchment)] text-sm font-medium">
                  Yes, link partner
                </button>
              </div>
            </div>
          ) : null}

          {!hasPartner ? <PalPartnerOnboarding myUserId={user!.id} onSavePartnerId={(id, nick) => pal.setPartnerFromInput(id, nick)} /> : null}

          {user?.id && partnerId && loadStoredPartnerId(user.id) === partnerId ? (
            <button
              type="button"
              onClick={() => pal.clearPartner()}
              className="block text-[11px] text-[var(--text-3)] underline mb-4 hover:text-[var(--ink)]"
            >
              Remove locally saved partner (shared Quran Foundation goals still link you until updated there)
            </button>
          ) : null}

          <PartnerHeader me={meSide} partner={partnerSide} partnerColumnPlaceholder="Link your partner" />

          <div className="flex gap-8 mb-20">
            <div className="w-[58%] flex flex-col gap-6">
              <StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value={String(myStreak?.streak_count ?? 0)} label="day streak" />
              <ProgressCard value={myWeeklyVerses} total={100} label="Verses this week" />
            </div>
            <div className="w-[42%] flex flex-col gap-6">
              <StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value="—" label="partner streak" delay={0.1} />
              <ProgressCard
                value={partnerWeeklyVerses}
                total={100}
                label="Verses this week"
                delay={0.1}
                color="bg-[var(--jade)]"
                unknown={hasPartner ? !partnerWeeklyKnown : false}
              />
              {hasPartner && !partnerWeeklyKnown ? (
                <p className="text-[10px] text-[var(--text-3)] font-sans px-2 leading-relaxed">
                  Partner totals show when the Quran Foundation activity API exposes cross-user reads for your scopes; otherwise verses this week stays at —.
                </p>
              ) : null}
            </div>
          </div>

          {postsError ? <p className="text-sm text-amber-700 mb-4 max-w-xl">{postsError}</p> : null}

          {hasPartner ? (
            <NudgeCard
              nudgeSent={nudgeSent}
              onSend={() => {
                if (!user?.id || !partnerId) return;
                setNudgeSent(true);
                void createPost({
                  type: "encouragement",
                  author_id: user.id,
                  recipient_id: partnerId,
                  body: `Encouragement: keep going — your consistency inspires me.`
                })
                  .then(() => loadPosts())
                  .catch(() => undefined);
              }}
              partnerName={pal.partnerDisplayName}
              partnerAheadDays={
                nudgeDynamicMessage
                  ? 0
                  : comparisonBadge
                    ? Math.min(7, Math.max(1, Math.ceil((partnerWeeklyVerses - myWeeklyVerses) / 15))) || 1
                    : 0
              }
              message={nudgeDynamicMessage}
            />
          ) : null}

          <SharedFeed
            posts={posts}
            currentUserId={user?.id}
            partnerLinked={hasPartner}
            myInitials={initialsFrom(user?.name ?? "You")}
            partnerInitials={initialsFrom(pal.partnerDisplayName)}
            composerDisabled={false}
            emptyHint={undefined}
            onSend={(body) => {
              if (!user?.id || !partnerId) return;
              void createPost({
                type: "reflection",
                author_id: user.id,
                recipient_id: partnerId,
                body
              })
                .then((post) => {
                  setPostsError(null);
                  setPosts((prev) => [post, ...prev]);
                  void postActivitySession({ type: "reading", duration_seconds: 30 });
                })
                .catch(() =>
                  setPostsError("Could not publish. Confirm write:posts scope is enabled for your OAuth client.")
                );
            }}
          />

          {!sharedGoal && hasPartner ? (
            <PalSharedGoalStarter partnerLabel={pal.partnerDisplayName} onCreate={handleGoalCreate} busy={goalBusy} />
          ) : null}

          <SharedGoalWidget
            title={activeGoal ? `Finish Surah ${activeGoal.target_surah_id}${sharedGoal ? " together" : ""}` : "Set your shared goal"}
            dueLabel={activeGoal?.target_date ? `Due: ${new Date(activeGoal.target_date).toLocaleDateString()}` : "due date from Quran Foundation"}
            mePercent={myPercent}
            partnerPercent={partnerPercent}
            partnerName={pal.partnerDisplayName}
          />
        </div>
      </motion.div>
    </>
  );
}

export default function PalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--parchment)] text-[var(--ink)] pt-32 flex justify-center font-sans">Loading Pal…</div>}>
      <PalPageInner />
    </Suspense>
  );
}
