"use client";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
export default function VerseDots() {
  return <div className="mt-12 flex flex-col items-center gap-6"><span className="text-sm text-[var(--text-3)]">5 verses found for this context</span><div className="flex items-center gap-8"><button className="p-2 text-[var(--text-3)] hover:text-white"><ArrowLeft weight="regular" size={20} /></button><div className="flex gap-3">{[0,1,2,3,4].map(i => <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-500 ${i===0 ? "bg-[var(--gold)]" : "bg-white/15"}`} />)}</div><button className="p-2 text-[var(--text-3)] hover:text-white"><ArrowRight weight="regular" size={20} /></button></div></div>;
}
