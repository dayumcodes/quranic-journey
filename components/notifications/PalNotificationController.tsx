"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPalNotificationSummary, getPushSubscriptionConfig, savePushSubscription } from "@/lib/api/palNotifications";
import {
  ensureNotificationPermission,
  getExistingPushSubscription,
  getNotificationPermissionState,
  isPushSupported,
  registerPalServiceWorker,
  subscribeToPushNotifications
} from "@/lib/push/browser";
import { useAuthStore } from "@/lib/store/authStore";
import { usePalNotificationStore } from "@/lib/store/palNotificationStore";

const INSTALL_DISMISSED_KEY = "al_rihla_install_toast_dismissed";
const NOTIFY_DISMISSED_KEY = "al_rihla_notify_toast_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = typeof navigator !== "undefined" && "standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone);
  return mediaStandalone || iosStandalone;
}

export default function PalNotificationController() {
  const { isAuthenticated, user } = useAuthStore();
  const setSummary = usePalNotificationStore((s) => s.setSummary);
  const setPeek = usePalNotificationStore((s) => s.setPeek);
  const setPushState = usePalNotificationStore((s) => s.setPushState);
  const pushSupported = usePalNotificationStore((s) => s.pushSupported);
  const pushConfigured = usePalNotificationStore((s) => s.pushConfigured);
  const pushEnabled = usePalNotificationStore((s) => s.pushEnabled);
  const permission = usePalNotificationStore((s) => s.permission);
  const clear = usePalNotificationStore((s) => s.clear);
  const lastPeekSourceKey = useRef<string | null>(null);
  const hasLoadedSummary = useRef(false);

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [notifyDismissed, setNotifyDismissed] = useState(false);
  const [installBusy, setInstallBusy] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);

  const syncPushState = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    const supported = isPushSupported();
    const permissionState = getNotificationPermissionState();
    if (!supported) {
      setPushState({
        pushSupported: false,
        pushConfigured: false,
        pushEnabled: false,
        permission: permissionState
      });
      return;
    }

    await registerPalServiceWorker().catch(() => null);

    let configured = false;
    let existing = null as PushSubscription | null;
    try {
      const config = await getPushSubscriptionConfig();
      configured = !!config.configured && !!config.publicKey;
    } catch {
      configured = false;
    }
    try {
      existing = await getExistingPushSubscription();
    } catch {
      existing = null;
    }
    if (configured && permissionState === "granted" && existing) {
      await savePushSubscription(existing).catch(() => undefined);
    }

    setPushState({
      pushSupported: true,
      pushConfigured: configured,
      pushEnabled: !!existing && permissionState === "granted",
      permission: permissionState
    });
  }, [isAuthenticated, user?.id, setPushState]);

  const refreshSummary = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const summary = await getPalNotificationSummary();
      setSummary(summary);

      if (!hasLoadedSummary.current) {
        hasLoadedSummary.current = true;
        lastPeekSourceKey.current = summary.latestUnread?.sourceKey ?? null;
        return;
      }

      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        summary.latestUnread &&
        summary.latestUnread.sourceKey !== lastPeekSourceKey.current
      ) {
        lastPeekSourceKey.current = summary.latestUnread.sourceKey;
        setPeek(summary.latestUnread);
      }
    } catch {
      /* ignore transient notification polling errors */
    }
  }, [isAuthenticated, user?.id, setPeek, setSummary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setInstallDismissed(window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "1");
    setNotifyDismissed(window.localStorage.getItem(NOTIFY_DISMISSED_KEY) === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
      setInstallDismissed(true);
      window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      hasLoadedSummary.current = false;
      lastPeekSourceKey.current = null;
      clear();
      return;
    }

    void syncPushState();
    void refreshSummary();

    const onFocus = () => {
      void syncPushState();
      void refreshSummary();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncPushState();
        void refreshSummary();
      }
    };
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshSummary();
      }
    }, 20000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [clear, isAuthenticated, refreshSummary, syncPushState, user?.id]);

  const enableNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id || notifyBusy) return;
    setNotifyBusy(true);
    try {
      const permissionResult = await ensureNotificationPermission();
      if (permissionResult !== "granted") {
        setPushState({ permission: permissionResult, pushEnabled: false });
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
      setNotifyDismissed(true);
      window.localStorage.setItem(NOTIFY_DISMISSED_KEY, "1");
    } catch (err) {
      console.warn("[pal-notifications] enable from toast failed", {
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setNotifyBusy(false);
    }
  }, [isAuthenticated, notifyBusy, setPushState, user?.id]);

  const dismissInstallToast = useCallback(() => {
    setInstallDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  }, []);

  const dismissNotifyToast = useCallback(() => {
    setNotifyDismissed(true);
    if (typeof window !== "undefined") window.localStorage.setItem(NOTIFY_DISMISSED_KEY, "1");
  }, []);

  const installVisible = !!installEvent && !installDismissed && !isStandaloneMode();
  const notifyVisible =
    !installVisible &&
    isAuthenticated &&
    !notifyDismissed &&
    pushSupported &&
    pushConfigured &&
    !pushEnabled &&
    permission === "default";

  const handleInstall = useCallback(async () => {
    if (!installEvent || installBusy) return;
    setInstallBusy(true);
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setInstallEvent(null);
        dismissInstallToast();
      }
    } catch (err) {
      console.warn("[pwa-install] install prompt failed", {
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setInstallBusy(false);
    }
  }, [dismissInstallToast, installBusy, installEvent]);

  if (!installVisible && !notifyVisible) return null;

  return (
    <div className="fixed left-1/2 top-[max(4.25rem,calc(env(safe-area-inset-top,0px)+3.5rem))] z-[80] w-[min(92vw,560px)] -translate-x-1/2">
      {installVisible ? (
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/85">
          <p className="text-sm font-medium text-[var(--ink)]">Install Al-Rihla for faster access and a full app experience.</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissInstallToast}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:bg-black/[0.05] dark:hover:bg-white/10"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => void handleInstall()}
              disabled={installBusy}
              className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-[var(--void)] disabled:opacity-60"
            >
              {installBusy ? "Opening..." : "Install app"}
            </button>
          </div>
        </div>
      ) : null}

      {notifyVisible ? (
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/85">
          <p className="text-sm font-medium text-[var(--ink)]">Turn on notifications to get Pal messages when the app is closed.</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissNotifyToast}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--text-2)] hover:bg-black/[0.05] dark:hover:bg-white/10"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => void enableNotifications()}
              disabled={notifyBusy}
              className="rounded-full bg-[var(--gold)] px-4 py-1.5 text-xs font-semibold text-[var(--void)] disabled:opacity-60"
            >
              {notifyBusy ? "Updating..." : "Turn on"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
