"use client";

import { motion } from "framer-motion";
import type { Chapter } from "@/types";

export interface MapNode {
  id: number;
  name: string;
  x: number;
  y: number;
  unlocked: boolean;
  active?: boolean;
}

interface Props {
  nodes: MapNode[];
  onSelect: (node: MapNode) => void;
  loading: boolean;
}

export default function JannahMap({ nodes, onSelect, loading }: Props) {
  if (loading || nodes.length === 0) {
    return (
      <div className="w-full lg:w-[58%] relative min-h-[600px] rounded-3xl overflow-hidden border border-[rgba(13,15,18,0.08)] bg-gradient-to-br from-[#F4EFE6] to-[#EDE5D5] shadow-inner p-8 flex items-center justify-center flex-col gap-4">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--gold)" opacity="0.3"><path d="M12 2a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" /><path d="M16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></svg>
        <p className="font-sans text-sm text-[var(--text-3)] shimmer px-4 py-2 rounded-full">Loading your map...</p>
      </div>
    );
  }
  return (
    <div className="w-full lg:w-[58%] relative min-h-[600px] rounded-3xl overflow-hidden border border-[rgba(13,15,18,0.08)] bg-gradient-to-br from-[#F4EFE6] to-[#EDE5D5] shadow-inner p-8">
      <svg className="w-full h-full absolute inset-0 drop-shadow-md" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path d="M 20 15 C 40 15, 60 10, 60 25 C 60 40, 90 30, 80 45 C 70 60, 30 50, 50 60 C 70 70, 10 65, 25 75 C 40 85, 30 100, 40 90" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="300" initial={{ strokeDashoffset: 300 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 2.8, ease: [0.4, 0, 0.2, 1], delay: 0.4 }} />
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer" onClick={() => onSelect(node)}>
            {node.active && <motion.circle r="8" fill="none" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="1 1" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />}
            <motion.circle r={node.active ? "4" : "3"} fill={node.unlocked || node.active ? "var(--gold)" : "#E8E0D0"} stroke={node.unlocked ? "var(--gold-light)" : "rgba(13,15,18,0.12)"} strokeWidth="0.5" whileHover={{ scale: 1.2 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} />
            <text y="8" textAnchor="middle" fontSize="3" className="font-sans fill-[var(--text-3)] font-medium">{node.id}. {node.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function chaptersToNodes(chapters: Chapter[]): MapNode[] {
  const coords = [[20, 15], [60, 25], [80, 45], [50, 60], [25, 75], [40, 90]];
  return chapters.slice(0, 6).map((c, i) => ({ id: i + 1, name: c.name_simple, x: coords[i][0], y: coords[i][1], unlocked: i < 3, active: i === 3 }));
}
