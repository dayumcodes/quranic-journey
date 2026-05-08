"use client";
import { useStreak } from "@/lib/hooks/useStreak";
export default function StreakTracker() {
  const { data } = useStreak();
  return <div className="hidden">{data?.streak_count ?? 0}</div>;
}
