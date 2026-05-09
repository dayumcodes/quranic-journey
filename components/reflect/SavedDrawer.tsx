"use client";
import { useEffect, useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { getCollections } from "@/lib/api/user";
import { useAuthStore } from "@/lib/store/authStore";
export default function SavedDrawer() {
  const { isAuthenticated } = useAuthStore();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; verse_key: string; saved_at?: string }>>([]);
  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    getCollections()
      .then((collections) => {
        const total = collections.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);
        setCount(total);
        setItems(collections.flatMap((c) => c.items ?? []).map((i) => ({ id: i.id, verse_key: i.verse_key, saved_at: i.saved_at })));
      })
      .catch(() => setCount(0));
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      <motion.button onClick={() => setOpen(true)} whileHover={{ scale: 1.05 }} className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-5 py-3 shadow-2xl"><BookmarkSimple weight="regular" size={20} className="text-[var(--gold)]" /><div className="w-5 h-5 rounded-full bg-[var(--gold)] text-[var(--ink)] font-mono text-[10px] flex items-center justify-center font-bold">{count}</div></motion.button>
      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-[#0b1117] border-l border-white/10 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Saved Bookmarks</h3>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">Close</button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-white/60">No saved verses yet.</p>
            ) : (
              <div className="space-y-3">
                {items.map((i) => (
                  <a key={i.id} href={`/reflect`} className="block rounded-lg border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/5">
                    Verse {i.verse_key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
