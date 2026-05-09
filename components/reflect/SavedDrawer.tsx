"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookmarkSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { getCollections } from "@/lib/api/user";
import { useAuthStore } from "@/lib/store/authStore";
import { loadLocalBookmarks } from "@/lib/utils/reflectBookmarks";

type DrawerItem = {
  id: string;
  verse_key: string;
  saved_at?: string;
  source: "api" | "local";
};

export default function SavedDrawer() {
  const { isAuthenticated } = useAuthStore();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DrawerItem[]>([]);

  const refresh = useCallback(() => {
    const local = loadLocalBookmarks().map((b, i) => ({
      id: `local-${b.verse_key}-${i}`,
      verse_key: b.verse_key,
      saved_at: b.saved_at,
      source: "local" as const
    }));

    if (!isAuthenticated) {
      setItems(local);
      setCount(local.length);
      return;
    }

    getCollections()
      .then((collections) => {
        const apiItems = collections.flatMap((c, ci) =>
          (c.items ?? []).map((i) => ({
            id: `${c.id}:${i.id}`,
            verse_key: i.verse_key,
            saved_at: i.saved_at,
            source: "api" as const
          }))
        );
        const byKey = new Map<string, DrawerItem>();
        for (const it of [...apiItems, ...local]) {
          if (!byKey.has(it.verse_key)) byKey.set(it.verse_key, it);
        }
        const merged = Array.from(byKey.values());
        setItems(merged);
        setCount(merged.length);
      })
      .catch(() => {
        setItems(local);
        setCount(local.length);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onBookmarks = () => refresh();
    window.addEventListener("reflect-bookmarks-changed", onBookmarks);
    return () => window.removeEventListener("reflect-bookmarks-changed", onBookmarks);
  }, [refresh]);

  const ordered = useMemo(() => [...items].sort((a, b) => (b.saved_at ?? "").localeCompare(a.saved_at ?? "")), [items]);

  const showFab = isAuthenticated || ordered.length > 0;
  if (!showFab) return null;

  return (
    <>
      <motion.button type="button" onClick={() => setOpen(true)} whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl">
        <BookmarkSimple weight="regular" size={20} className="text-[var(--gold)]" />
        <div className="w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--ink)] font-mono text-[10px] flex items-center justify-center font-bold">{count}</div>
      </motion.button>
      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-[#0b1117] border-l border-white/10 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Saved bookmarks</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                Close
              </button>
            </div>
            {ordered.length === 0 ? (
              <p className="text-sm text-white/60">No saved verses yet. Tap Save on a reflection.</p>
            ) : (
              <div className="space-y-3">
                {ordered.map((i) => (
                  <Link key={i.id + i.source} href={`/reflect?verse=${encodeURIComponent(i.verse_key)}`} onClick={() => setOpen(false)} className="block rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/5">
                    <span className="font-mono text-[var(--gold)]">{i.verse_key}</span>
                    {i.source === "local" ? <span className="ml-2 text-[10px] uppercase tracking-wide text-white/40">device</span> : null}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
