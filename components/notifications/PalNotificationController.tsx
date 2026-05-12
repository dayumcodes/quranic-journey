"use client";

import { useCallback, useEffect, useRef } from "react";
import { getPalNotificationSummary, getPushSubscriptionConfig, savePushSubscription } from "@/lib/api/palNotifications";
import { getExistingPushSubscription, getNotificationPermissionState, isPushSupported, registerPalServiceWorker } from "@/lib/push/browser";
import { useAuthStore } from "@/lib/store/authStore";
import { usePalNotificationStore } from "@/lib/store/palNotificationStore";

export default function PalNotificationController() {
  const { isAuthenticated, user } = useAuthStore();
  const setSummary = usePalNotificationStore((s) => s.setSummary);
  const setPeek = usePalNotificationStore((s) => s.setPeek);
  const setPushState = usePalNotificationStore((s) => s.setPushState);
  const clear = usePalNotificationStore((s) => s.clear);
  const lastPeekSourceKey = useRef<string | null>(null);
  const hasLoadedSummary = useRef(false);

  const syncPushState = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    const supported = isPushSupported();
    const permission = getNotificationPermissionState();
    if (!supported) {
      setPushState({
        pushSupported: false,
        pushConfigured: false,
        pushEnabled: false,
        permission
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
    if (configured && permission === "granted" && existing) {
      await savePushSubscription(existing).catch(() => undefined);
    }

    setPushState({
      pushSupported: true,
      pushConfigured: configured,
      pushEnabled: !!existing && permission === "granted",
      permission
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

  return null;
}
