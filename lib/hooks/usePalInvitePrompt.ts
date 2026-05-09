"use client";

import { useCallback, useEffect, useState } from "react";
import { isLikelyPartnerUserId } from "@/lib/utils/palPartnerStorage";

export type UsePalInvitePromptResult = {
  pendingInvitePartnerId: string | null;
  dismissPendingInvite: () => void;
};

/** URL invite (?partner=id) handling — threading/persistence handled by caller */
export function usePalInvitePrompt(
  userId: string | undefined,
  invitePartnerIdFromUrl: string | null,
  knownPartnerIds: string[]
): UsePalInvitePromptResult {
  const [pendingInvitePartnerId, setPendingInvitePartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !invitePartnerIdFromUrl) return;
    const pid = invitePartnerIdFromUrl.trim();
    if (!isLikelyPartnerUserId(pid) || pid === userId) return;
    if (knownPartnerIds.includes(pid)) return;
    setPendingInvitePartnerId(pid);
  }, [userId, invitePartnerIdFromUrl, knownPartnerIds]);

  const dismissPendingInvite = useCallback(() => {
    setPendingInvitePartnerId(null);
  }, []);

  return {
    pendingInvitePartnerId,
    dismissPendingInvite
  };
}
