"use client";
import { useEffect, useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { getCollections } from "@/lib/api/user";
import { useAuthStore } from "@/lib/store/authStore";
export default function SavedDrawer() {
  const { isAuthenticated } = useAuthStore();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    getCollections()
      .then((collections) => {
        const total = collections.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);
        setCount(total);
      })
      .catch(() => setCount(0));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return <motion.button whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl"><BookmarkSimple weight="regular" size={20} className="text-[var(--gold)]" /><div className="w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--ink)] font-mono text-[10px] flex items-center justify-center font-bold">{count}</div></motion.button>;
}
