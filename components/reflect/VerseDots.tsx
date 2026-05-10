"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

interface Props {
  count: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function VerseDots({ count, activeIndex, onPrev, onNext }: Props) {
  if (count < 1) return null;
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < count - 1;
  return (
    <div className="mt-12 flex flex-col items-center gap-6">
      <span className="text-sm text-[var(--reflect-fg-soft)]">{count} verses found for this context</span>
      <div className="flex items-center gap-8">
        <button type="button" onClick={onPrev} disabled={!canPrev} className="p-2 text-[var(--reflect-fg-soft)] hover:text-[var(--reflect-fg)] disabled:opacity-30 disabled:pointer-events-none">
          <ArrowLeft weight="regular" size={20} />
        </button>
        <div className="flex gap-3">
          {Array.from({ length: count }, (_, i) => (
            <div key={`dot-${i}`} className={`w-2 h-2 rounded-full transition-colors duration-500 ${i === activeIndex ? "bg-[var(--gold)]" : "bg-[var(--reflect-fg)]/20"}`} />
          ))}
        </div>
        <button type="button" onClick={onNext} disabled={!canNext} className="p-2 text-[var(--reflect-fg-soft)] hover:text-[var(--reflect-fg)] disabled:opacity-30 disabled:pointer-events-none">
          <ArrowRight weight="regular" size={20} />
        </button>
      </div>
    </div>
  );
}
