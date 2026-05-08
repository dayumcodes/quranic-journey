"use client";

import { useEffect, useState } from "react";
import { getStreaks } from "@/lib/api/user";
import type { StreakData } from "@/types";

export function useStreak() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getStreaks().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);
  return { data, loading };
}
