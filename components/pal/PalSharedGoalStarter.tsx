"use client";

import { useEffect, useMemo, useState } from "react";

type GoalDraft = {
  targetSurahId: number;
  versesPerDay: number;
  daysPerWeek: number;
  targetDate: string;
};

export default function PalSharedGoalStarter({
  partnerLabel,
  onCreate,
  busy,
  initialGoal,
  triggerLabel,
  submitLabel,
  open: controlledOpen,
  onOpenChange
}: {
  partnerLabel: string;
  onCreate: (targetSurahId: number, versesPerDay: number, daysPerWeek: number, targetDate?: string) => void;
  busy?: boolean;
  initialGoal?: Partial<GoalDraft>;
  triggerLabel?: string;
  submitLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [surah, setSurah] = useState(initialGoal?.targetSurahId ?? 2);
  const [vpd, setVpd] = useState(initialGoal?.versesPerDay ?? 1);
  const [dpw, setDpw] = useState(initialGoal?.daysPerWeek ?? 7);
  const [targetDate, setTargetDate] = useState(initialGoal?.targetDate ?? "");

  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const defaultLabel = useMemo(
    () => (initialGoal ? `Update the shared reading goal with ${partnerLabel}` : `Start a shared reading goal with ${partnerLabel}`),
    [initialGoal, partnerLabel]
  );

  useEffect(() => {
    setSurah(initialGoal?.targetSurahId ?? 2);
    setVpd(initialGoal?.versesPerDay ?? 1);
    setDpw(initialGoal?.daysPerWeek ?? 7);
    setTargetDate(initialGoal?.targetDate ?? "");
  }, [initialGoal?.targetSurahId, initialGoal?.versesPerDay, initialGoal?.daysPerWeek, initialGoal?.targetDate]);

  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="mt-12 max-w-2xl mx-auto text-center">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-[var(--ink)] underline decoration-[var(--gold)] hover:text-[var(--gold)]"
        >
          {triggerLabel ?? defaultLabel}
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
          <label className="text-[11px] text-[var(--text-2)] flex flex-col gap-1">
            Finish by
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)]"
            />
          </label>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-2 rounded-full border border-[var(--panel-border)] text-[var(--ink)]">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onCreate(surah, vpd, dpw, targetDate || undefined)}
              className="text-sm px-5 py-2 rounded-full bg-[var(--gold)] text-[var(--void)] font-medium disabled:opacity-40"
            >
              {busy ? "Saving…" : submitLabel ?? (initialGoal ? "Update goal" : "Create goal")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
