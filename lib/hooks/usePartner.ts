"use client";

import { useEffect, useState } from "react";
import type { PartnerProfile } from "@/types";

export function usePartner() {
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  useEffect(() => {
    setPartner(null);
  }, []);
  return { partner };
}
