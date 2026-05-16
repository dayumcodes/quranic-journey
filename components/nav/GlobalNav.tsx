"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { List, Moon, Sun, User, X } from "@phosphor-icons/react";
import { deletePushSubscription, getPushSubscriptionConfig, savePushSubscription } from "@/lib/api/palNotifications";
import { SPRINGS } from "@/lib/constants/motion";
import { getMyProfile } from "@/lib/api/profile";
import {
  ensureNotificationPermission,
  getNotificationPermissionState,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from "@/lib/push/browser";
import { useAuthStore } from "@/lib/store/authStore";
import { usePalNotificationStore } from "@/lib/store/palNotificationStore";
import { useThemeStore } from "@/lib/store/themeStore";

interface Props {
  currentPage: "home" | "journey" | "reflect" | "pal" | "profile";
}

const MAIN_TABS = ["journey", "reflect", "pal"] as const;

export default function GlobalNav({ currentPage }: Props) {
  const { isAuthenticated, user, login, logout, updateUser } = useAuthStore();
  const theme = useThemeStore((s) => s.theme);
  const isThemeTransitioning = useThemeStore((s) => s.isThemeTransitioning);
  const toggleThemeAt = useThemeStore((s) => s.toggleThemeAt);
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const notificationPeek = usePalNotificationStore((s) => s.peek);
  const setNotificationPeek = usePalNotificationStore((s) => s.setPeek);
  const unreadTotal = usePalNotificationStore((s) => s.summary.totalUnread);
  const pushSupported = usePalNotificationStore((s) => s.pushSupported);
  const pushConfigured = usePalNotificationStore((s) => s.pushConfigured);
  const pushEnabled = usePalNotificationStore((s) => s.pushEnabled);
  const permission = usePalNotificationStore((s) => s.permission);
  const setPushState = usePalNotificationStore((s) => s.setPushState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileLinksOpen, setMobileLinksOpen] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileLinksOpen(false);
  }, [currentPage]);

  useEffect(() => {
    if (!mobileLinksOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileLinksOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileLinksOpen]);

  useEffect(() => {
    if (!notificationPeek) return;
    const t = window.setTimeout(() => setNotificationPeek(null), 6200);
    return () => window.clearTimeout(t);
  }, [notificationPeek, setNotificationPeek]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let cancelled = false;
    void getMyProfile()
      .then(({ profile }) => {
        if (!profile?.displayName || cancelled) return;
        if (profile.displayName.trim() === (user.name ?? "").trim()) return;
        const words = profile.displayName.trim().split(/\s+/).filter(Boolean);
        const avatarInitials = `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase() || user.avatar_initials || "U";
        updateUser({
          name: profile.displayName.trim(),
          avatar_initials: avatarInitials
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.name, user?.avatar_initials, updateUser]);

  const inactiveTabTone =
    currentPage === "profile"
      ? "text-[var(--text-2)] hover:text-[var(--ink)]"
      : "text-[var(--text-2)] hover:text-[var(--ink)] dark:text-[var(--text-3)] dark:hover:text-[var(--ink)]";
  const navBg = "bg-[#F4EFE6]/80 dark:bg-[#080A0E]/80";
  const navBorder = "border-[rgba(13,15,18,0.06)] dark:border-[rgba(255,255,255,0.06)]";
  const palUnreadLabel = unreadTotal > 99 ? "99+" : String(unreadTotal);
  const notificationStatusText = !pushSupported
      ? "This browser does not support push notifications."
      : !pushConfigured
        ? "Push notifications are not configured on this deployment yet."
        : permission === "denied"
          ? "Notifications are blocked in your browser settings."
          : pushEnabled
            ? "Notifications are on for this browser."
            : "Turn notifications on for message alerts when Al-Rihla is closed.";

  async function handleNotificationToggle() {
    if (!isAuthenticated || notificationBusy) return;
    setNotificationBusy(true);
    try {
      if (pushEnabled) {
        const endpoint = await unsubscribeFromPushNotifications();
        if (endpoint) {
          await deletePushSubscription(endpoint).catch(() => undefined);
        }
        setPushState({
          pushEnabled: false,
          permission: getNotificationPermissionState()
        });
        return;
      }

      const permissionResult = await ensureNotificationPermission();
      if (permissionResult !== "granted") {
        setPushState({
          pushEnabled: false,
          permission: permissionResult
        });
        return;
      }

      const config = await getPushSubscriptionConfig();
      if (!config.configured || !config.publicKey) {
        setPushState({
          pushSupported: true,
          pushConfigured: false,
          pushEnabled: false,
          permission: "granted"
        });
        return;
      }

      const subscription = await subscribeToPushNotifications(config.publicKey);
      await savePushSubscription(subscription);
      setPushState({
        pushSupported: true,
        pushConfigured: true,
        pushEnabled: true,
        permission: "granted"
      });
    } catch (err) {
      console.warn("[nav] notification toggle failed", {
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setNotificationBusy(false);
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)]">
      <div className="relative">
        <motion.nav
          transition={SPRINGS.DEFAULT}
          className={`relative z-10 flex flex-row items-center justify-between gap-2 px-3 sm:px-6 md:px-12 py-2 md:py-2.5 min-h-[52px] md:min-h-[56px] border-b backdrop-blur-md ${navBg} ${navBorder} ${
            scrolled ? "shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)]" : ""
          }`}
        >
          <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0 min-w-0 md:flex-1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`shrink-0 ${theme === "dark" ? "drop-shadow-[0_0_8px_rgba(184,148,63,0.4)]" : ""}`}
            >
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-display font-bold text-base sm:text-lg text-[var(--gold)] truncate">Al-Rihla</span>
          </Link>

          <div className="hidden md:flex flex-1 justify-center pt-1 min-w-0">
            <motion.div
              layoutId="dynamicIslandTabs"
              className="relative flex p-1 rounded-full border bg-[rgba(13,15,18,0.05)] border-[rgba(13,15,18,0.06)] dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.06)]"
            >
              {MAIN_TABS.map((tab) => {
                const isActive = currentPage === tab;
                const showUnread = tab === "pal" && unreadTotal > 0;
                return (
                  <Link
                    key={tab}
                    href={`/${tab === "journey" ? "journey" : tab}`}
                    className={`relative shrink-0 px-5 py-1.5 text-sm font-sans font-medium rounded-full transition-colors z-10 ${isActive ? "text-[var(--ink)]" : inactiveTabTone}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activePill"
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                        className="absolute inset-0 bg-[var(--gold)] rounded-full -z-10 shadow-[0_2px_8px_rgba(184,148,63,0.3)]"
                      />
                    )}
                    <span className="relative z-20 inline-flex items-center gap-2 capitalize">
                      {tab}
                      {showUnread ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--jade)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                          {palUnreadLabel}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
              <AnimatePresence>
                {notificationPeek ? (
                  <motion.div
                    key={notificationPeek.sourceKey}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={SPRINGS.SNAPPY}
                    className="pointer-events-none absolute top-full left-1/2 z-50 mt-3 flex w-max max-w-[min(92vw,480px)] -translate-x-1/2 items-center gap-2 rounded-full border border-[rgba(13,15,18,0.12)] bg-white px-3 py-2 text-[var(--ink)] shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white sm:gap-3 sm:px-4"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--jade)] bg-[var(--jade)]/20 text-[10px] font-semibold text-[var(--jade)]">
                      {notificationPeek.senderInitials.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-sans text-xs font-medium sm:text-sm">
                        {notificationPeek.senderName} sent you{" "}
                        {notificationPeek.messageType === "encouragement" ? "encouragement" : "a new message"}
                      </div>
                      {notificationPeek.preview ? (
                        <div className="line-clamp-1 max-w-[min(58vw,280px)] text-[11px] text-[var(--text-2)] dark:text-white/70">
                          {notificationPeek.preview}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 md:flex-1 md:justify-end">
            <motion.button
              ref={themeToggleRef}
              type="button"
              whileHover={{ scale: isThemeTransitioning ? 1 : 1.05 }}
              whileTap={{ scale: isThemeTransitioning ? 1 : 0.95 }}
              disabled={isThemeTransitioning}
              onClick={(e) => {
                const rect = themeToggleRef.current?.getBoundingClientRect();
                const x = rect ? rect.left + rect.width / 2 : e.clientX;
                const y = rect ? rect.top + rect.height / 2 : e.clientY;
                toggleThemeAt(x, y);
              }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-[var(--parchment)] p-0 leading-none text-[var(--ink)] ring-1 ring-inset ring-[var(--gold)]/50 disabled:opacity-90 dark:bg-white/10 dark:text-[var(--ink)] dark:ring-white/20"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex items-center justify-center"
                >
                  {theme === "dark" ? (
                    <Sun weight="regular" size={18} className="text-amber-200" />
                  ) : (
                    <Moon weight="regular" size={18} />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <div className="relative inline-flex h-9 shrink-0 items-center justify-center align-middle">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isAuthenticated) {
                    void login();
                    return;
                  }
                  setMenuOpen((v) => !v);
                  setMobileLinksOpen(false);
                }}
                title={isAuthenticated ? "Profile menu" : "Login"}
                className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-[var(--parchment)] p-0 leading-none ring-1 ring-inset ring-[var(--gold)]/50 group dark:bg-white/10 dark:ring-white/20"
              >
                {isAuthenticated ? (
                  <span className="text-[11px] font-bold leading-none text-[var(--ink)]">{user?.avatar_initials ?? "U"}</span>
                ) : (
                  <User weight="regular" size={18} className="text-[var(--ink)] opacity-50" />
                )}
              </motion.button>
              {isAuthenticated && menuOpen ? (
                <div className="absolute right-0 top-full z-[70] mt-2 w-48 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] p-2 text-[var(--ink)] shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/85 dark:text-white">
                  <div className="truncate px-3 py-2 text-xs text-[var(--text-2)] dark:text-white/70">Signed in as {user?.name ?? "User"}</div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleNotificationToggle();
                    }}
                    disabled={notificationBusy || permission === "denied" || (!pushSupported && !pushEnabled) || (!pushConfigured && !pushEnabled)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-white/10"
                  >
                    {notificationBusy ? "Updating notifications..." : pushEnabled ? "Turn off notifications" : "Turn on notifications"}
                  </button>
                  <div className="px-3 pb-2 pt-1 text-[11px] leading-relaxed text-[var(--text-3)] dark:text-white/65">{notificationStatusText}</div>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[0.06] dark:hover:bg-white/10"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/[0.06] dark:hover:bg-white/10"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[var(--parchment)] p-0 leading-none text-[var(--ink)] ring-1 ring-inset ring-[var(--gold)]/50 dark:bg-white/10 md:hidden dark:ring-white/20"
              aria-expanded={mobileLinksOpen}
              aria-controls="mobile-main-nav"
              aria-label={mobileLinksOpen ? "Close menu" : "Open menu"}
              onClick={() => {
                setMobileLinksOpen((v) => !v);
                setMenuOpen(false);
              }}
            >
              {mobileLinksOpen ? <X weight="bold" size={20} /> : <List weight="bold" size={20} />}
            </motion.button>
          </div>
        </motion.nav>

        <AnimatePresence>
          {mobileLinksOpen ? (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-0 bottom-0 z-40 bg-black/45 backdrop-blur-[2px] md:hidden"
                style={{ top: "max(3.5rem, calc(env(safe-area-inset-top, 0px) + 3.25rem))" }}
                onClick={() => setMobileLinksOpen(false)}
              />
              <motion.div
                id="mobile-main-nav"
                role="dialog"
                aria-modal="true"
                aria-label="Main navigation"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={SPRINGS.SNAPPY}
                className="absolute left-0 right-0 top-full z-50 border-b border-[var(--panel-border)] bg-[#F4EFE6]/95 px-4 py-3 shadow-lg backdrop-blur-xl dark:bg-[#080A0E]/95 md:hidden"
              >
                <div className="mx-auto flex max-w-lg flex-col gap-1 pb-[env(safe-area-inset-bottom,0px)]">
                  {MAIN_TABS.map((tab) => {
                    const isActive = currentPage === tab;
                    const showUnread = tab === "pal" && unreadTotal > 0;
                    return (
                      <Link
                        key={tab}
                        href={`/${tab === "journey" ? "journey" : tab}`}
                        onClick={() => setMobileLinksOpen(false)}
                        className={`rounded-xl px-4 py-3.5 font-sans text-base font-medium capitalize transition-colors ${
                          isActive
                            ? "bg-[var(--gold)] text-[var(--ink)] shadow-[0_2px_8px_rgba(184,148,63,0.25)]"
                            : "text-[var(--text-2)] hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {tab}
                          {showUnread ? (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--jade)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                              {palUnreadLabel}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Pal notification — mobile only (desktop toast lives under nav tabs) */}
      <AnimatePresence>
        {notificationPeek ? (
          <motion.div
            key={`mobile-${notificationPeek.sourceKey}`}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={SPRINGS.SNAPPY}
            className="pointer-events-none fixed left-4 right-4 z-[60] mx-auto mt-2 flex max-w-[min(92vw,480px)] items-center gap-2 rounded-full border border-[rgba(13,15,18,0.12)] bg-white px-3 py-2 text-[var(--ink)] shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white sm:gap-3 sm:px-4 md:hidden"
            style={{ top: "max(3.75rem, calc(env(safe-area-inset-top, 0px) + 3.25rem))" }}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--jade)] bg-[var(--jade)]/20 text-[10px] font-semibold text-[var(--jade)]">
              {notificationPeek.senderInitials.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="font-sans text-xs font-medium sm:text-sm">
                {notificationPeek.senderName} sent you{" "}
                {notificationPeek.messageType === "encouragement" ? "encouragement" : "a new message"}
              </div>
              {notificationPeek.preview ? (
                <div className="line-clamp-1 text-[11px] text-[var(--text-2)] dark:text-white/70">{notificationPeek.preview}</div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
