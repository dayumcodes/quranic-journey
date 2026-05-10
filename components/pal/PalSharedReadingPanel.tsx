"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Chapter, PalReadingSnapshot } from "@/types";
import type { PalProgressPatch } from "@/lib/api/palProgress";

type Draft = {
  targetSurahId: number;
  versesReadWeek: number;
  weeklyGoal: number;
  streakDays: number;
  streakActive: boolean;
};

function snapshotToDraft(s: PalReadingSnapshot | null): Draft {
  return {
    targetSurahId: s?.targetSurahId ?? 1,
    versesReadWeek: s?.versesReadWeek ?? 0,
    weeklyGoal: s?.weeklyGoal ?? 100,
    streakDays: s?.streakDays ?? 0,
    streakActive: s?.streakActive ?? true
  };
}

function surahTitle(chapters: Pick<Chapter, "id" | "name_simple">[], id: number): string {
  const c = chapters.find((x) => x.id === id);
  return c ? `${c.id}. ${c.name_simple}` : `Surah ${id}`;
}

function PartnerReadingSummary({
  label,
  snapshot,
  chapters
}: {
  label: string;
  snapshot: PalReadingSnapshot | null;
  chapters: Pick<Chapter, "id" | "name_simple">[];
}) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--panel)]/50 px-5 py-6 text-sm text-[var(--text-3)]">
        <p className="font-medium text-[var(--text-2)] mb-1">{label}</p>
        <p>They haven&apos;t shared reading stats yet. Once they save their Pal reading goals, you&apos;ll see them here.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] px-5 py-6 space-y-3 text-sm">
      <p className="font-display font-semibold text-[var(--ink)]">{label}</p>
      <dl className="space-y-2 text-[var(--text-2)]">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-3)]">Surah</dt>
          <dd className="font-medium text-[var(--ink)] text-right">{surahTitle(chapters, snapshot.targetSurahId)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-3)]">Verses this week</dt>
          <dd className="font-mono text-[var(--ink)]">
            {snapshot.versesReadWeek}/{snapshot.weeklyGoal}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-3)]">Streak</dt>
          <dd className="text-[var(--ink)]">
            {snapshot.streakActive ? `${snapshot.streakDays} day${snapshot.streakDays === 1 ? "" : "s"}` : "On hold / broken"}
          </dd>
        </div>
        <div className="text-[10px] text-[var(--text-3)] pt-1">
          Updated {new Date(snapshot.updatedAt).toLocaleString()}
        </div>
      </dl>
    </div>
  );
}

export default function PalSharedReadingPanel({
  chapters,
  partnerLabel,
  selfSnapshot,
  partnerSnapshot,
  loadFailed,
  saving,
  onSave,
  disabled
}: {
  chapters: Pick<Chapter, "id" | "name_simple">[];
  partnerLabel: string;
  selfSnapshot: PalReadingSnapshot | null;
  partnerSnapshot: PalReadingSnapshot | null;
  loadFailed: boolean;
  saving: boolean;
  onSave: (patch: PalProgressPatch) => Promise<void>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => snapshotToDraft(selfSnapshot));

  useEffect(() => {
    setDraft(snapshotToDraft(selfSnapshot));
  }, [selfSnapshot]);

  const surahOptions = useMemo(
    () =>
      chapters.length > 0
        ? chapters.map((c) => ({ id: c.id, name_simple: c.name_simple }))
        : Array.from({ length: 114 }, (_, i) => ({ id: i + 1, name_simple: `Surah ${i + 1}` })),
    [chapters]
  );

  const canSubmit = useMemo(() => !disabled && !loadFailed, [disabled, loadFailed]);

  const handleSave = async () => {
    if (!canSubmit) return;
    await onSave({
      targetSurahId: draft.targetSurahId,
      versesReadWeek: draft.versesReadWeek,
      weeklyGoal: draft.weeklyGoal,
      streakDays: draft.streakDays,
      streakActive: draft.streakActive
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-muted)] backdrop-blur-sm p-6 shadow-card-resting">
        <h3 className="font-display font-semibold text-lg text-[var(--ink)] mb-1">Your reading</h3>
        <p className="text-xs text-[var(--text-3)] mb-5">Visible to your pal — update anytime.</p>

        {loadFailed ? (
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
            Could not load shared reading data. Confirm <code className="text-[11px]">DATABASE_URL</code> is set and migration{" "}
            <code className="text-[11px]">002_pal_reading_progress.sql</code> ran.
          </p>
        ) : null}

        <div className="space-y-4">
          <label className="block text-[11px] font-medium text-[var(--text-2)]">
            Surah
            <select
              disabled={!canSubmit || saving}
              value={draft.targetSurahId}
              onChange={(e) => setDraft((d) => ({ ...d, targetSurahId: Number(e.target.value) }))}
              className="mt-1 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
            >
              {surahOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}. {c.name_simple}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[11px] font-medium text-[var(--text-2)]">
              Verses this week
              <input
                type="number"
                min={0}
                disabled={!canSubmit || saving}
                value={draft.versesReadWeek}
                onChange={(e) => setDraft((d) => ({ ...d, versesReadWeek: Math.max(0, Number(e.target.value) || 0) }))}
                className="mt-1 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
              />
            </label>
            <label className="block text-[11px] font-medium text-[var(--text-2)]">
              Weekly goal
              <input
                type="number"
                min={1}
                max={500}
                disabled={!canSubmit || saving}
                value={draft.weeklyGoal}
                onChange={(e) => setDraft((d) => ({ ...d, weeklyGoal: Math.min(500, Math.max(1, Number(e.target.value) || 1)) }))}
                className="mt-1 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
              />
            </label>
          </div>

          <label className="block text-[11px] font-medium text-[var(--text-2)]">
            Streak length (days)
            <input
              type="number"
              min={0}
              disabled={!canSubmit || saving}
              value={draft.streakDays}
              onChange={(e) => setDraft((d) => ({ ...d, streakDays: Math.max(0, Number(e.target.value) || 0) }))}
              className="mt-1 w-full rounded-xl border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold)] disabled:opacity-50"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-[11px] font-medium text-[var(--text-2)]">Streak status</span>
            <div className="inline-flex rounded-full border border-[var(--panel-border)] p-0.5 bg-[var(--panel)]">
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={() => setDraft((d) => ({ ...d, streakActive: true }))}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  draft.streakActive ? "bg-[var(--gold)] text-[var(--void)]" : "text-[var(--text-2)] hover:text-[var(--ink)]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                disabled={!canSubmit || saving}
                onClick={() => setDraft((d) => ({ ...d, streakActive: false }))}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !draft.streakActive ? "bg-[var(--mist)] text-[var(--ink)]" : "text-[var(--text-2)] hover:text-[var(--ink)]"
                }`}
              >
                On hold
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() => void handleSave()}
            className="w-full sm:w-auto rounded-full bg-[var(--ink)] text-[var(--parchment)] px-6 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save & share with pal"}
          </button>
        </div>
      </div>

      <PartnerReadingSummary label={`${partnerLabel}'s reading`} snapshot={partnerSnapshot} chapters={chapters} />
    </motion.section>
  );
}
