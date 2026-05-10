"use client";

import { useState } from "react";

export default function PalSharedGoalStarter({
  partnerLabel,
  onCreate,
  busy
}: {
  partnerLabel: string;
  onCreate: (targetSurahId: number, versesPerDay: number, daysPerWeek: number) => void;
  busy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [surah, setSurah] = useState(2);
  const [vpd, setVpd] = useState(1);
  const [dpw, setDpw] = useState(7);

  return (
    <div className="mt-12 max-w-2xl mx-auto text-center">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-[var(--ink)] underline decoration-[var(--gold)] hover:text-[var(--gold)]"
        >
          Start a shared reading goal with {partnerLabel}
        </button>
      ) : (
        <div className="rounded-2xl border border-[rgba(13,15,18,0.1)] bg-white dark:bg-white/90 p-6 text-left space-y-4 text-[#0D0F12]">
          <h4 className="font-display font-semibold text-lg">Shared goal</h4>
          <p className="text-xs text-[#0D0F12]/70">Creates a Quran Foundation shared goal pointing at both accounts. Tune numbers to match how you practice.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-[11px] text-[#0D0F12]/75 flex flex-col gap-1">
              Target surah (id)
              <input
                type="number"
                min={1}
                max={114}
                value={surah}
                onChange={(e) => setSurah(Number(e.target.value))}
                className="rounded-lg border px-3 py-2 text-sm text-[#0D0F12]"
              />
            </label>
            <label className="text-[11px] text-[#0D0F12]/75 flex flex-col gap-1">
              Verses / day
              <input type="number" min={1} max={286} value={vpd} onChange={(e) => setVpd(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm text-[#0D0F12]" />
            </label>
            <label className="text-[11px] text-[#0D0F12]/75 flex flex-col gap-1">
              Days / week
              <input type="number" min={1} max={7} value={dpw} onChange={(e) => setDpw(Number(e.target.value))} className="rounded-lg border px-3 py-2 text-sm text-[#0D0F12]" />
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-full border border-[rgba(13,15,18,0.12)] text-[#0D0F12]">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onCreate(surah, vpd, dpw)}
              className="text-sm px-5 py-2 rounded-full bg-[var(--gold)] text-[#0D0F12] font-medium disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create goal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
