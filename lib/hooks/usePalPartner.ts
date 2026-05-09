"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Goal } from "@/types";
import {
  clearStoredPartnerId,
  isLikelyPartnerUserId,
  loadStoredPartnerDisplayName,
  loadStoredPartnerId,
  partnerIdFromGoals,
  saveStoredPartnerDisplayName,
  saveStoredPartnerId
} from "@/lib/utils/palPartnerStorage";

export type UsePalPartnerResult = {
  partnerId: string | null;
  hasPartner: boolean;
  partnerDisplayName: string;
  /** Invite link target (not self); show confirm UI */
  pendingInvitePartnerId: string | null;
  confirmPendingPartner: (nickname?: string) => void;
  dismissPendingInvite: () => void;
  setPartnerFromInput: (rawId: string, nickname?: string) => boolean;
  clearPartner: () => void;
  setPartnerNickname: (name: string) => void;
};

export function usePalPartner(
  userId: string | undefined,
  goals: Goal[],
  invitePartnerIdFromUrl: string | null
): UsePalPartnerResult {
  const [storedRev, setStoredRev] = useState(0);
  const [pendingInvitePartnerId, setPendingInvitePartnerId] = useState<string | null>(null);
  const [nicknameState, setNicknameState] = useState<string | null>(null);

  const goalPartnerId = useMemo(() => partnerIdFromGoals(goals), [goals]);

  const storedPartnerId = useMemo(() => {
    void storedRev;
    return userId ? loadStoredPartnerId(userId) : null;
  }, [userId, storedRev]);

  const partnerId = goalPartnerId ?? storedPartnerId;

  const storedNick = useMemo(() => {
    void storedRev;
    return userId ? loadStoredPartnerDisplayName(userId) : null;
  }, [userId, storedRev]);

  const partnerDisplayName = nicknameState ?? storedNick ?? "Partner";

  useEffect(() => {
    setNicknameState(null);
  }, [userId]);

  useEffect(() => {
    if (!userId || !invitePartnerIdFromUrl) return;
    const pid = invitePartnerIdFromUrl.trim();
    if (!isLikelyPartnerUserId(pid) || pid === userId) return;
    const already =
      pid === partnerId || pid === goalPartnerId || pid === storedPartnerId;
    if (already) return;
    setPendingInvitePartnerId(pid);
  }, [userId, invitePartnerIdFromUrl, partnerId, goalPartnerId, storedPartnerId]);

  const bumpStorage = useCallback(() => setStoredRev((n) => n + 1), []);

  const confirmPendingPartner = useCallback(
    (nickname?: string) => {
      if (!userId || !pendingInvitePartnerId) return;
      saveStoredPartnerId(userId, pendingInvitePartnerId);
      if (nickname?.trim()) saveStoredPartnerDisplayName(userId, nickname.trim());
      setPendingInvitePartnerId(null);
      bumpStorage();
    },
    [userId, pendingInvitePartnerId, bumpStorage]
  );

  const dismissPendingInvite = useCallback(() => {
    setPendingInvitePartnerId(null);
  }, []);

  const setPartnerFromInput = useCallback(
    (rawId: string, nickname?: string): boolean => {
      if (!userId) return false;
      const pid = rawId.trim();
      if (!isLikelyPartnerUserId(pid) || pid === userId) return false;
      saveStoredPartnerId(userId, pid);
      if (nickname?.trim()) saveStoredPartnerDisplayName(userId, nickname.trim());
      bumpStorage();
      return true;
    },
    [userId, bumpStorage]
  );

  const clearPartner = useCallback(() => {
    if (!userId) return;
    clearStoredPartnerId(userId);
    bumpStorage();
  }, [userId, bumpStorage]);

  const setPartnerNickname = useCallback(
    (name: string) => {
      if (!userId || !partnerId) return;
      saveStoredPartnerDisplayName(userId, name);
      bumpStorage();
    },
    [userId, partnerId, bumpStorage]
  );

  return {
    partnerId,
    hasPartner: !!partnerId,
    partnerDisplayName,
    pendingInvitePartnerId,
    confirmPendingPartner,
    dismissPendingInvite,
    setPartnerFromInput,
    clearPartner,
    setPartnerNickname
  };
}
