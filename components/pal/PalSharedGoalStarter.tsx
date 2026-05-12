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
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] backdrop-blur-sm p-6 text-left space-y-4 text-[var(--ink)]">
          <h4 className="font-display font-semibold text-lg">Shared goal</h4>
          <p className="text-xs text-[var(--text-3)]">Creates a shared goal for both linked pals in this app. Tune the numbers to match how you practice.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-[11px] text-[var(--text-2)] flex flex-col gap-1">
              Target surah (id)
              <input
                type="number"
                min={1}
                max={114}
                value={surah}
                onChange={(e) => setSurah(Number(e.target.value))}
                className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </label>
            <label className="text-[11px] text-[var(--text-2)] flex flex-col gap-1">
              Verses / day
              <input type="number" min={1} max={286} value={vpd} onChange={(e) => setVpd(Number(e.target.value))} className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]" />
            </label>
            <label className="text-[11px] text-[var(--text-2)] flex flex-col gap-1">
              Days / week
              <input type="number" min={1} max={7} value={dpw} onChange={(e) => setDpw(Number(e.target.value))} className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]" />
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-full border border-[var(--panel-border)] text-[var(--ink)]">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onCreate(surah, vpd, dpw)}
              className="text-sm px-5 py-2 rounded-full bg-[var(--gold)] text-[var(--void)] font-medium disabled:opacity-40"
            >
              {busy ? "Creating…" : "Create goal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
