"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fire, Plus } from "@phosphor-icons/react";
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
import PalChatSidebar from "@/components/pal/PalChatSidebar";
import PalSharedReadingPanel from "@/components/pal/PalSharedReadingPanel";
import { pageVariants } from "@/lib/constants/motion";
import { RequestError } from "@/lib/api/client";
import { acceptPal, getPals, removePal as removePalApi } from "@/lib/api/pals";
import { createPost } from "@/lib/api/posts";
import { usePalInvitePrompt } from "@/lib/hooks/usePalInvitePrompt";
import { useAuthStore } from "@/lib/store/authStore";
import { usePalEncouragementToastStore } from "@/lib/store/palEncouragementToastStore";
import { getPalProgress, putPalProgress } from "@/lib/api/palProgress";
import { getChapters } from "@/lib/api/quran";
import { fetchPartnerDisplayName, getActivity, getGoals, getPosts, getStreaks, postActivitySession, postGoal } from "@/lib/api/user";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";
import {
  establishMutualPalLink,
  loadActiveThreadId,
  migrateLegacyPartnerIntoThreads,
  removeMirroredPalLink,
  renamePalThread,
  saveActiveThreadId,
  savePalThreads,
  syncThreadsFromGoals,
  type PalThread
} from "@/lib/utils/palThreadsStorage";
import type { Chapter, Goal, PalReadingSnapshot, Post, StreakData } from "@/types";

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
  const setEncouragementPeek = usePalEncouragementToastStore((s) => s.setEncouragementPeek);
  const lastToastPostId = useRef<string | null>(null);

  const [nudgeSent, setNudgeSent] = useState(false);
  const [myStreak, setMyStreak] = useState<StreakData | null>(null);
  const [myWeeklyVerses, setMyWeeklyVerses] = useState(0);
  const [partnerWeeklyVerses, setPartnerWeeklyVerses] = useState(0);
  const [partnerWeeklyKnown, setPartnerWeeklyKnown] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [threads, setThreads] = useState<PalThread[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [showAddPalPanel, setShowAddPalPanel] = useState(false);
  const [palSidebarOpen, setPalSidebarOpen] = useState(true);
  const [inviteNick, setInviteNick] = useState("");
  const [postsError, setPostsError] = useState<string | null>(null);
  const [goalBusy, setGoalBusy] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [palProgressData, setPalProgressData] = useState<{
    self: PalReadingSnapshot | null;
    partner: PalReadingSnapshot | null;
  } | null>(null);
  const [palProgressFailed, setPalProgressFailed] = useState(false);
  const [palSaving, setPalSaving] = useState(false);

  const threadPartnerIds = useMemo(() => threads.map((t) => t.partnerId), [threads]);
  const { pendingInvitePartnerId, dismissPendingInvite } = usePalInvitePrompt(user?.id, invitePartnerIdFromUrl, threadPartnerIds);

  const partnerId = selectedPartnerId;
  const hasPartner = !!partnerId;
  const activeThread = useMemo(() => threads.find((t) => t.partnerId === partnerId) ?? null, [threads, partnerId]);
  const partnerDisplayName = activeThread?.displayName ?? "Partner";

  const sharedGoalWithPartner = useMemo(
    () => goals.find((g) => g.type === "shared" && g.partner_id === partnerId),
    [goals, partnerId]
  );
  const activeGoal = sharedGoalWithPartner ?? goals[0] ?? null;

  const refreshGoals = useCallback(() => {
    if (!isAuthenticated || !user?.id) return;
    void getGoals()
      .then((g) => setGoals(Array.isArray(g) ? g : []))
      .catch(() => setGoals([]));
  }, [isAuthenticated, user?.id]);

  const syncPalsFromServer = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    const { accessToken } = useAuthStore.getState();
    try {
      const { pals } = await getPals();
      const normalized = (Array.isArray(pals) ? pals : [])
        .filter((p) => isLikelyPartnerUserId(p.partnerId))
        .map((p) => ({
          partnerId: p.partnerId.trim(),
          displayName: p.displayName?.trim() || "Partner",
          updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : Date.now()
        }));
      if (!normalized.length) return;
      savePalThreads(user.id, normalized);
      setThreads(normalized);
    } catch (e) {
      const status = e instanceof RequestError ? e.status : undefined;
      console.warn("[pal] syncPalsFromServer failed (session not cleared — pals uses logoutOnUnauthorized: false)", {
        status,
        message: e instanceof Error ? e.message : String(e),
        clientUserIdSuffix: user.id.slice(-8),
        sentBearer: !!accessToken,
        hint401:
          status === 401
            ? "Server could not map Bearer to QF sub (check Vercel QF_CLIENT_ID/SECRET, QF_ENV/QF_AUTH_BASE_URL; see Vercel function logs for [pals-auth])."
            : undefined
      });
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const loadPalProgress = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !partnerId) {
      setPalProgressData(null);
      setPalProgressFailed(false);
      return;
    }
    try {
      setPalProgressFailed(false);
      const data = await getPalProgress(partnerId);
      setPalProgressData(data);
    } catch {
      setPalProgressData(null);
      setPalProgressFailed(true);
    }
  }, [isAuthenticated, user?.id, partnerId]);

  useEffect(() => {
    void loadPalProgress();
  }, [loadPalProgress]);

  useEffect(() => {
    if (!partnerId || !isAuthenticated) return;
    const id = window.setInterval(() => void loadPalProgress(), 45000);
    return () => window.clearInterval(id);
  }, [partnerId, isAuthenticated, loadPalProgress]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void getChapters()
      .then(setChapters)
      .catch(() => setChapters([]));
  }, [isAuthenticated]);

  useEffect(() => {
    void syncPalsFromServer();
  }, [syncPalsFromServer]);

  useEffect(() => {
    if (!user?.id) return;
    const next = syncThreadsFromGoals(user.id, goals);
    const withLegacy = next.length ? next : migrateLegacyPartnerIntoThreads(user.id);
    setThreads(withLegacy);
    if (!withLegacy.length) setShowAddPalPanel(true);
  }, [user?.id, goals]);

  useEffect(() => {
    if (!user?.id) return;
    const saved = loadActiveThreadId(user.id);
    if (saved && threads.some((t) => t.partnerId === saved)) {
      setSelectedPartnerId(saved);
      return;
    }
    if (threads[0]) {
      const first = threads[0]!.partnerId;
      setSelectedPartnerId(first);
      saveActiveThreadId(user.id, first);
    } else setSelectedPartnerId(null);
  }, [user?.id, threads]);

  const genericPalIdsKey = useMemo(() => {
    const ids = threads
      .filter((t) => {
        const n = t.displayName.trim();
        return n === "Partner" || n === "Pal";
      })
      .map((t) => t.partnerId);
    return [...new Set(ids)].sort().join("|");
  }, [threads]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid || !genericPalIdsKey.length) return;
    let cancelled = false;
    const pids = genericPalIdsKey.split("|").filter(Boolean);
    for (const pid of pids) {
      void fetchPartnerDisplayName(pid).then((label) => {
        if (!label || cancelled) return;
        setThreads((prev) => {
          const row = prev.find((x) => x.partnerId === pid);
          const n = row?.displayName.trim() ?? "";
          if (!row || (n !== "Partner" && n !== "Pal")) return prev;
          return renamePalThread(uid, pid, label);
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, genericPalIdsKey]);

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
        setMyWeeklyVerses(sessions.filter((s) => !!s.verse_key).length);
      })
      .catch(() => {
        if (!cancelled) setMyWeeklyVerses(0);
      });

    if (partnerId) {
      void getActivity(fromIso, toIso, partnerId)
        .then((sessions) => {
          if (cancelled) return;
          setPartnerWeeklyVerses(sessions.filter((s) => !!s.verse_key).length);
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

  const loadPosts = useCallback(async (options?: { silent?: boolean }) => {
    if (!isAuthenticated || !user?.id || !partnerId) {
      setPosts([]);
      if (!options?.silent) setPostsError(null);
      return;
    }
    if (!options?.silent) setPostsError(null);
    try {
      const nextPosts = await getPosts(user.id, partnerId);
      setPosts(nextPosts);
    } catch (err) {
      console.warn("[pal] loadPosts failed", {
        silent: !!options?.silent,
        status: err instanceof RequestError ? err.status : undefined,
        message: err instanceof Error ? err.message : String(err)
      });
      if (!options?.silent) {
        setPosts([]);
        setPostsError("Could not load shared posts. Confirm posts scope is approved for both accounts.");
      }
    }
  }, [isAuthenticated, user?.id, partnerId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !partnerId) return;

    // Refresh shared reflections so the linked pal sees new posts without a manual reload.
    const refresh = () => {
      void loadPosts({ silent: true });
    };

    const intervalId = window.setInterval(refresh, 15000);
    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isAuthenticated, user?.id, partnerId, loadPosts]);

  /** Encouragement toast: latest incoming nudge across all pal threads */
  useEffect(() => {
    if (!user?.id || threads.length === 0) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        const merged: Post[] = [];
        for (const th of threads) {
          try {
            const chunk = await getPosts(user.id, th.partnerId);
            merged.push(...chunk);
          } catch {
            /* ignore */
          }
        }
        if (cancelled) return;
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const incoming = merged.find(
          (p) => p.type === "encouragement" && p.recipient_id === user.id && p.author_id !== user.id
        );
        if (!incoming || lastToastPostId.current === incoming.id) return;
        lastToastPostId.current = incoming.id;
        const name =
          threads.find((x) => x.partnerId === incoming.author_id)?.displayName || `Pal ${incoming.author_id.slice(0, 8)}`;
        setEncouragementPeek({
          senderName: name,
          senderInitials: initialsFrom(name),
          sourceKey: incoming.id
        });
      })();
    }, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [user?.id, threads, setEncouragementPeek]);

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
    return new Date(
      theirs.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b), theirs[0]!).created_at
    );
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

  const palLoaded = palProgressData !== null && !palProgressFailed;
  const selfPalSnap = palProgressData?.self ?? null;
  const partnerPalSnap = palProgressData?.partner ?? null;

  const comparisonBadge = useMemo(() => {
    if (!partnerId) return undefined;
    if (palLoaded && selfPalSnap && partnerPalSnap) {
      if (partnerPalSnap.versesReadWeek > selfPalSnap.versesReadWeek) {
        return `+${partnerPalSnap.versesReadWeek - selfPalSnap.versesReadWeek} verses this week vs you`;
      }
      return undefined;
    }
    if (!partnerWeeklyKnown) return undefined;
    if (partnerWeeklyVerses > myWeeklyVerses) return `+${partnerWeeklyVerses - myWeeklyVerses} verses this week vs you`;
    return undefined;
  }, [
    partnerId,
    palLoaded,
    selfPalSnap,
    partnerPalSnap,
    partnerWeeklyKnown,
    partnerWeeklyVerses,
    myWeeklyVerses
  ]);

  const myStreakCardValue = palLoaded
    ? selfPalSnap?.streakActive === false
      ? "—"
      : String(selfPalSnap?.streakDays ?? 0)
    : String(myStreak?.streak_count ?? 0);
  const myStreakCardLabel = palLoaded && selfPalSnap?.streakActive === false ? "streak on hold" : "day streak";

  const partnerStreakCardValue =
    palLoaded && partnerPalSnap
      ? partnerPalSnap.streakActive === false
        ? "—"
        : String(partnerPalSnap.streakDays)
      : "—";
  const partnerStreakCardLabel =
    palLoaded && partnerPalSnap ? (partnerPalSnap.streakActive ? "day streak" : "streak on hold") : "pal streak";

  const myVersesVal = palLoaded ? (selfPalSnap?.versesReadWeek ?? 0) : myWeeklyVerses;
  const myVersesGoal = palLoaded ? (selfPalSnap?.weeklyGoal ?? 100) : 100;

  const partnerVersesKnown = palLoaded && partnerPalSnap != null ? true : partnerWeeklyKnown;
  const partnerVersesVal = palLoaded && partnerPalSnap ? partnerPalSnap.versesReadWeek : partnerWeeklyVerses;
  const partnerVersesGoal = palLoaded && partnerPalSnap ? partnerPalSnap.weeklyGoal : 100;

  const nudgeDynamicMessage = useMemo(() => {
    if (!hasPartner || !comparisonBadge) return undefined;
    return `${partnerDisplayName} is outpacing your weekly verses — send encouragement!`;
  }, [hasPartner, comparisonBadge, partnerDisplayName]);

  const globalReadingLine = useMemo(() => {
    const g = goals.find((x) => x.type === "shared") ?? goals[0];
    return g ? `Your focus (all chats): Surah ${g.target_surah_id}` : undefined;
  }, [goals]);

  const postPublishErrorMessage = useCallback((err: unknown) => {
    if (err instanceof RequestError) {
      if (err.status === 422) return err.message || "Posts must be at least 6 characters long.";
      if (err.status === 401 || err.status === 403) {
        return "Could not publish. Confirm your Quran Foundation post scopes are enabled for this account.";
      }
    }
    return "Could not publish. Check the post content and try again.";
  }, []);

  const meSide = useMemo(() => {
    const gFocus = goals[0];
    let readingLine: string | undefined;
    if (palLoaded && selfPalSnap) {
      const title = chapters.find((c) => c.id === selfPalSnap.targetSurahId)?.name_simple;
      readingLine = title
        ? `Reading: Surah ${selfPalSnap.targetSurahId} (${title})`
        : `Reading: Surah ${selfPalSnap.targetSurahId}`;
    } else if (gFocus) {
      readingLine = `Goal focus: Surah ${gFocus.target_surah_id}`;
    }
    return {
      avatarLetter: (user?.avatar_initials || initialsFrom(user?.name ?? "You")).slice(0, 3),
      displayName: "You",
      presenceLabel: "Active now",
      presenceVariant: "online" as const,
      readingLine,
      comparisonBadge: undefined
    };
  }, [user?.avatar_initials, user?.name, goals, palLoaded, selfPalSnap, chapters]);

  const partnerSide = useMemo(() => {
    if (!partnerId) return null;
    const nameForAvatar = partnerDisplayName.trim();
    const avatarLetter =
      nameForAvatar.length > 0 ? ([...nameForAvatar][0] ?? "?").toString() : partnerId.slice(0, 1).toUpperCase();
    let readingLine: string | undefined;
    if (palLoaded && partnerPalSnap) {
      const title = chapters.find((c) => c.id === partnerPalSnap.targetSurahId)?.name_simple;
      readingLine = title
        ? `Reading: Surah ${partnerPalSnap.targetSurahId} (${title})`
        : `Reading: Surah ${partnerPalSnap.targetSurahId}`;
    }
    return {
      avatarLetter,
      displayName: partnerDisplayName,
      presenceLabel: partnerPresenceLabel,
      presenceVariant: "offline" as const,
      readingLine,
      comparisonBadge
    };
  }, [partnerId, partnerDisplayName, partnerPresenceLabel, comparisonBadge, palLoaded, partnerPalSnap, chapters]);

  const selectThread = useCallback(
    (pid: string) => {
      setSelectedPartnerId(pid);
      if (user?.id) saveActiveThreadId(user.id, pid);
      setShowAddPalPanel(false);
    },
    [user?.id]
  );

  const removePal = useCallback(
    async (pid: string) => {
      if (!user?.id) return;
      try {
        await removePalApi(pid);
      } catch {
        /* still update local mirror */
      }
      const next = removeMirroredPalLink(user.id, pid);
      setThreads(next);
      if (selectedPartnerId === pid) {
        const nxt = next[0]?.partnerId ?? null;
        setSelectedPartnerId(nxt);
        saveActiveThreadId(user.id, nxt);
      }
      void syncPalsFromServer();
    },
    [user?.id, selectedPartnerId, syncPalsFromServer]
  );

  const addPartnerHandlers = useCallback(
    async (rawId: string, nickname?: string) => {
      if (!user?.id) return false;
      const pid = rawId.trim();
      if (!isLikelyPartnerUserId(pid) || pid === user.id) return false;
      const nick = nickname?.trim();
      const fromApi = nick ? null : await fetchPartnerDisplayName(pid).catch(() => null);
      const partnerDisplayName = nick || fromApi || "Partner";
      const myDisplayNameForPartner =
        user.name?.trim() || (typeof user.email === "string" ? user.email.split("@")[0]?.trim() : "") || "Pal";
      try {
        await acceptPal({
          partnerId: pid,
          partnerDisplayName,
          myDisplayNameForPartner
        });
      } catch {
        /* local fallback remains active */
      }
      const next = establishMutualPalLink({
        myUserId: user.id,
        partnerId: pid,
        partnerDisplayName,
        myDisplayNameForPartner
      });
      setThreads(next);
      selectThread(pid);
      setShowAddPalPanel(false);
      void syncPalsFromServer();
      return true;
    },
    [user, selectThread, syncPalsFromServer]
  );

  const clearQuery = () => {
    router.replace("/pal");
  };

  const handleInviteConfirm = () => {
    if (!pendingInvitePartnerId) return;
    void addPartnerHandlers(pendingInvitePartnerId, inviteNick.trim() || undefined).then((ok) => {
      if (!ok) return;
      dismissPendingInvite();
      setInviteNick("");
      clearQuery();
    });
  };

  const handleInviteDismiss = () => {
    dismissPendingInvite();
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

  if (!isAuthenticated || !user) {
    return (
      <>
        <GlobalNav currentPage="pal" />
        <motion.div
          className="min-h-screen bg-[var(--parchment)] pt-[5.5rem] sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 md:px-12 flex items-center justify-center"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="max-w-lg text-center bg-[var(--panel-muted)] rounded-3xl border border-[var(--panel-border)] p-6 sm:p-10 backdrop-blur-sm text-[var(--ink)]">
            <h2 className="font-display text-3xl mb-3">Login required</h2>
            <p className="text-[var(--text-2)] mb-8">Pal compares progress with linked pals using your Quran Foundation account.</p>
            <button type="button" onClick={() => void login()} className="px-6 py-3 rounded-full bg-[var(--ink)] text-[var(--parchment)] font-medium">
              Login to continue
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  const mainEmpty = !threads.length && !showAddPalPanel;

  return (
    <>
      <GlobalNav currentPage="pal" />
      <motion.div className="min-h-screen bg-[var(--parchment)] pt-[5.5rem] sm:pt-24 pb-20 sm:pb-32 px-3 sm:px-6 md:px-8 lg:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-6 md:gap-8 items-stretch md:items-start">
          {palSidebarOpen ? (
            <PalChatSidebar
              threads={threads}
              activePartnerId={selectedPartnerId}
              onSelect={(pid) => selectThread(pid)}
              onAddClick={() => setShowAddPalPanel(true)}
              onRemovePal={removePal}
              onClose={() => setPalSidebarOpen(false)}
              myReadingLine={globalReadingLine}
            />
          ) : (
            <button
              type="button"
              title="Open pals"
              aria-label="Open pals"
              onClick={() => setPalSidebarOpen(true)}
              className="order-2 md:order-1 shrink-0 w-full md:w-14 md:h-14 md:min-h-0 rounded-2xl md:rounded-full border border-[var(--panel-border)] bg-[var(--panel)] backdrop-blur-sm shadow-card-resting flex flex-row md:flex-col items-center justify-center gap-2 py-3 md:py-0 min-h-[3rem] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] hover:border-[var(--gold)]/35 transition-colors md:sticky md:top-28"
            >
              <Plus weight="bold" size={22} className="text-[var(--gold)] shrink-0" />
              <span className="text-sm font-medium text-[var(--text-2)] md:hidden">Open pals</span>
            </button>
          )}

          <div className="order-1 md:order-2 flex-1 min-w-0 w-full">
            {pendingInvitePartnerId ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 dark:bg-emerald-100/95 p-6 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-emerald-950">
                <div>
                  <p className="font-medium">Pal invite</p>
                  <p className="text-sm text-emerald-900/85 mt-1">
                    Link <span className="font-mono text-xs">{pendingInvitePartnerId.slice(0, 14)}…</span>?
                  </p>
                  <label className="block text-[11px] text-emerald-900/80 mt-3">
                    Nickname (optional)
                    <input
                      value={inviteNick}
                      onChange={(e) => setInviteNick(e.target.value)}
                      className="mt-1 block w-full max-w-xs rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]"
                    />
                  </label>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={handleInviteDismiss} className="px-4 py-2 rounded-full border border-[var(--panel-border)] text-sm text-[var(--ink)]">
                    Not now
                  </button>
                  <button type="button" onClick={handleInviteConfirm} className="px-5 py-2 rounded-full bg-[var(--ink)] text-[var(--parchment)] text-sm font-medium">
                    Add pal
                  </button>
                </div>
              </div>
            ) : null}

            {showAddPalPanel || threads.length === 0 ? (
              <PalPartnerOnboarding
                myUserId={user.id}
                onSavePartnerId={(id, nick) => addPartnerHandlers(id, nick)}
                onDismiss={threads.length > 0 ? () => setShowAddPalPanel(false) : undefined}
              />
            ) : null}

            {hasPartner ? (
              <>
                <PartnerHeader me={meSide} partner={partnerSide} partnerColumnPlaceholder="Select a pal" />

                <PalSharedReadingPanel
                  chapters={chapters}
                  partnerLabel={partnerDisplayName}
                  selfSnapshot={palProgressData?.self ?? null}
                  partnerSnapshot={palProgressData?.partner ?? null}
                  loadFailed={palProgressFailed}
                  saving={palSaving}
                  disabled={!hasPartner}
                  onSave={async (patch) => {
                    setPalSaving(true);
                    try {
                      await putPalProgress(patch);
                      await loadPalProgress();
                    } finally {
                      setPalSaving(false);
                    }
                  }}
                />

                <div className="flex flex-col lg:flex-row gap-8 mb-12">
                  <div className="flex-1 flex flex-col gap-6">
                    <StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value={myStreakCardValue} label={myStreakCardLabel} />
                    <ProgressCard value={myVersesVal} total={myVersesGoal} label="Verses this week" />
                  </div>
                  <div className="flex-1 flex flex-col gap-6">
                    <StatCard
                      icon={<Fire weight="regular" size={24} className="text-[#F97316]" />}
                      value={partnerStreakCardValue}
                      label={partnerStreakCardLabel}
                      delay={0.1}
                    />
                    <ProgressCard
                      value={partnerVersesVal}
                      total={partnerVersesGoal}
                      label="Verses this week"
                      delay={0.1}
                      color="bg-[var(--jade)]"
                      unknown={hasPartner ? !partnerVersesKnown : false}
                    />
                    {hasPartner && palProgressFailed && !partnerWeeklyKnown ? (
                      <p className="text-[10px] text-[var(--text-3)] font-sans px-2 leading-relaxed">
                        Pal verse totals from Quran Foundation require cross-user activity scopes. Shared Pal reading (above) works from this app&apos;s database when configured.
                      </p>
                    ) : null}
                    {hasPartner && palLoaded && !partnerPalSnap ? (
                      <p className="text-[10px] text-[var(--text-3)] font-sans px-2 leading-relaxed">
                        {partnerDisplayName} hasn&apos;t saved their Pal reading stats yet — encourage them to tap Save on their Pal page.
                      </p>
                    ) : null}
                  </div>
                </div>

                {postsError ? <p className="text-sm text-amber-700 mb-4 max-w-xl">{postsError}</p> : null}

                <NudgeCard
                  nudgeSent={nudgeSent}
                  onSend={() => {
                    if (!user?.id || !partnerId) return;
                    setNudgeSent(true);
                    setPostsError(null);
                    console.info("[pal] sending encouragement", {
                      bodyLength: "Encouragement: keep going — your consistency inspires me.".length,
                      hasPartner: !!partnerId
                    });
                    void createPost({
                      type: "encouragement",
                      author_id: user.id,
                      recipient_id: partnerId,
                      body: `Encouragement: keep going — your consistency inspires me.`
                    })
                      .then(() => loadPosts({ silent: true }))
                      .catch((err) => {
                        console.error("[pal] encouragement publish failed", {
                          message: err instanceof Error ? err.message : String(err)
                        });
                        setNudgeSent(false);
                        setPostsError(postPublishErrorMessage(err));
                      });
                  }}
                  partnerName={partnerDisplayName}
                  partnerAheadDays={
                    nudgeDynamicMessage
                      ? 0
                      : comparisonBadge
                        ? Math.min(7, Math.max(1, Math.ceil((partnerWeeklyVerses - myWeeklyVerses) / 15))) || 1
                        : 0
                  }
                  message={nudgeDynamicMessage}
                />

                <SharedFeed
                  posts={posts}
                  currentUserId={user?.id}
                  partnerLinked={hasPartner}
                  myInitials={initialsFrom(user?.name ?? "You")}
                  partnerInitials={initialsFrom(partnerDisplayName)}
                  composerDisabled={false}
                  onSend={(body) => {
                    if (!user?.id || !partnerId) return;
                    console.info("[pal] sending reflection", {
                      bodyLength: body.trim().length,
                      hasPartner: !!partnerId
                    });
                    void createPost({
                      type: "reflection",
                      author_id: user.id,
                      recipient_id: partnerId,
                      body
                    })
                      .then((post) => {
                        setPostsError(null);
                        setPosts((prev) => [post, ...prev.filter((item) => item.id !== post.id)]);
                        void loadPosts({ silent: true });
                        void postActivitySession({ type: "reading", duration_seconds: 30 });
                      })
                      .catch((err) => {
                        console.error("[pal] reflection publish failed", {
                          message: err instanceof Error ? err.message : String(err)
                        });
                        setPostsError(postPublishErrorMessage(err));
                      });
                  }}
                />

                {!sharedGoalWithPartner && hasPartner ? (
                  <PalSharedGoalStarter partnerLabel={partnerDisplayName} onCreate={handleGoalCreate} busy={goalBusy} />
                ) : null}

                <SharedGoalWidget
                  title={activeGoal ? `Finish Surah ${activeGoal.target_surah_id}${sharedGoalWithPartner ? " together" : ""}` : "Set your shared goal"}
                  dueLabel={activeGoal?.target_date ? `Due: ${new Date(activeGoal.target_date).toLocaleDateString()}` : "due date from Quran Foundation"}
                  mePercent={myPercent}
                  partnerPercent={partnerPercent}
                  partnerName={partnerDisplayName}
                />
              </>
            ) : (
              <p className="text-sm text-[var(--text-3)] py-12">Choose a pal from the list.</p>
            )}
          </div>
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
