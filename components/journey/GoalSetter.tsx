"use client";
import { useEffect } from "react";
import { getGoals } from "@/lib/api/user";
export default function GoalSetter() {
  useEffect(() => { getGoals().catch(() => null); }, []);
  return null;
}
