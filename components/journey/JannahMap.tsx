"use client";

import { motion } from "framer-motion";
import type { Chapter } from "@/types";

export interface MapNode {
  id: number;
  chapterId: number;
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
  mapError?: string | null;
  onRetryMap?: () => void;
}

export default function JannahMap({ nodes, onSelect, loading, mapError, onRetryMap }: Props) {
  if (mapError && !loading) {
    return (
      <div className="w-full lg:w-[58%] relative min-h-[600px] rounded-3xl overflow-hidden border border-[rgba(13,15,18,0.08)] bg-gradient-to-br from-[#F4EFE6] to-[#EDE5D5] shadow-inner p-8 flex items-center justify-center flex-col gap-4">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--gold)" opacity="0.3"><path d="M12 2a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" /><path d="M16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></svg>
        <p className="font-sans text-sm text-[var(--text-2)] text-center max-w-md">{mapError}</p>
        {onRetryMap ? <button type="button" onClick={onRetryMap} className="font-sans text-sm font-medium px-5 py-2 rounded-full bg-[var(--ink)] text-[var(--parchment)] hover:opacity-90 transition-opacity">Retry</button> : null}
      </div>
    );
  }
  if (loading || nodes.length === 0) {
    return (
      <div className="w-full lg:w-[58%] relative min-h-[600px] rounded-3xl overflow-hidden border border-[rgba(13,15,18,0.08)] bg-gradient-to-br from-[#F4EFE6] to-[#EDE5D5] shadow-inner p-8 flex items-center justify-center flex-col gap-4">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--gold)" opacity="0.3"><path d="M12 2a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" /><path d="M16 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /></svg>
        <p className="font-sans text-sm text-[var(--text-3)] shimmer px-4 py-2 rounded-full">Loading your map...</p>
      </div>
    );
  }
  const vbHeight = nodes.length ? Math.max(100, nodes[nodes.length - 1]!.y + 36) : 100;
  const pathD =
    nodes.length >= 2
      ? candyCrushCurvedPath(nodes)
      : "M 20 15 C 40 15, 60 10, 60 25 C 60 40, 90 30, 80 45 C 70 60, 30 50, 50 60 C 70 70, 10 65, 25 75";

  const pathAnimated = nodes.length <= 24;

  return (
    <div className="w-full lg:w-[58%] relative min-h-[560px] max-h-[min(72vh,720px)] rounded-3xl border border-[rgba(13,15,18,0.08)] bg-gradient-to-br from-[#F4EFE6] to-[#EDE5D5] shadow-inner flex flex-col overflow-hidden">
      <p className="font-sans text-xs text-[var(--text-3)] px-6 pt-4 shrink-0">Scroll to follow all surahs along the path</p>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-8 pb-8 pt-2 [-webkit-overflow-scrolling:touch]">
        <svg
          className="w-full block drop-shadow-md"
          viewBox={`0 0 100 ${vbHeight}`}
          preserveAspectRatio="xMidYMin meet"
          role="img"
          aria-label="Journey map of surahs"
        >
          {pathAnimated ? (
            <motion.path
              d={pathD}
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.2"
              pathLength={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: Math.min(2.6, 0.06 * nodes.length), ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
            />
          ) : (
            <path d={pathD} fill="none" stroke="var(--gold)" strokeWidth="1.2" />
          )}
          {nodes.map((node) => {
            const label = `${node.chapterId}. ${node.name.length > 12 ? `${node.name.slice(0, 11)}…` : node.name}`;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(node)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(node);
                  }
                }}
              >
                <title>{`${node.chapterId}. ${node.name}`}</title>
                {node.active && (
                  <motion.circle
                    r="8"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="0.45"
                    strokeDasharray="1 1"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <motion.circle
                  r={node.active ? "4" : "3"}
                  fill={node.unlocked || node.active ? "var(--gold)" : "#E8E0D0"}
                  stroke={node.unlocked ? "var(--gold-light)" : "rgba(13,15,18,0.12)"}
                  strokeWidth="0.45"
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
                <text y="11" textAnchor="middle" className="font-sans fill-[var(--text-3)] pointer-events-none" style={{ fontSize: "3.05px" }}>
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function layoutNodePosition(index: number, total: number): { x: number; y: number } {
  const isProd = process.env.NODE_ENV === "production";
  const step = isProd ? Math.max(7.2, Math.min(11.2, 820 / Math.max(total, 10))) : Math.max(5.2, Math.min(8.6, 560 / Math.max(total, 12)));
  const y = (isProd ? 8 : 6) + index * step;

  // Candy Crush-style zigzag: alternate right/left lanes as we go down.
  const rightLane = isProd ? 78 : 73;
  const leftLane = isProd ? 22 : 27;
  const laneX = index % 2 === 0 ? rightLane : leftLane;
  // Tiny jitter keeps the map organic while preserving readable zigzag.
  const jitter = Math.sin(index * 0.85) * (isProd ? 1.8 : 1.2);
  const x = laneX + jitter;
  return { x: Math.min(92, Math.max(8, x)), y };
}

/** Smooth S-curves between alternating zigzag nodes (Candy Crush-like track). */
function candyCrushCurvedPath(nodes: MapNode[]): string {
  let d = `M ${nodes[0]!.x} ${nodes[0]!.y}`;
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]!;
    const curr = nodes[i]!;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const midY = prev.y + dy * 0.52;
    const curveX = prev.x + dx * 0.5;
    d += ` C ${curveX} ${midY - dy * 0.28}, ${curveX} ${midY + dy * 0.28}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function chaptersToNodes(chapters: Chapter[]): MapNode[] {
  const total = chapters.length;
  return chapters.map((c, i) => {
    const { x, y } = layoutNodePosition(i, total);
    return {
      id: i + 1,
      chapterId: c.id,
      name: c.name_simple,
      x,
      y,
      unlocked: true,
      active: false
    };
  });
}
