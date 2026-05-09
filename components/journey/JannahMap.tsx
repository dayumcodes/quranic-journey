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
          <defs>
            <linearGradient id="roadBase" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E9C97E" />
              <stop offset="100%" stopColor="#C29536" />
            </linearGradient>
            <pattern id="ropeStripes" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="7" height="7" fill="transparent" />
              <rect x="0" y="0" width="3.5" height="7" fill="#F4E2B5" opacity="0.82" />
            </pattern>
            <radialGradient id="nodeFill" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#F4D88F" />
              <stop offset="62%" stopColor="#C99F46" />
              <stop offset="100%" stopColor="#B7842B" />
            </radialGradient>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.2" dy="0.8" stdDeviation="0.9" floodColor="#8f6a25" floodOpacity="0.35" />
            </filter>
          </defs>
          {pathAnimated ? (
            <motion.path
              d={pathD}
              fill="none"
              stroke="url(#roadBase)"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: Math.min(2.6, 0.06 * nodes.length), ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
            />
          ) : (
            <path d={pathD} fill="none" stroke="url(#roadBase)" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
          )}
          <path d={pathD} fill="none" stroke="#AF8130" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
          <motion.path
            d={pathD}
            fill="none"
            stroke="url(#ropeStripes)"
            strokeWidth="1.28"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "url(#softShadow)" }}
            strokeDasharray="0.1 3.5"
            animate={{ strokeDashoffset: [0, -14] }}
            transition={{ duration: 10, ease: "linear", repeat: Infinity }}
          />
          {nodes.map((node) => {
            const label = `${node.chapterId}. ${node.name.length > 12 ? `${node.name.slice(0, 11)}…` : node.name}`;
            const labelToRight = node.x < 50;
            const labelX = labelToRight ? 6.4 : -6.4;
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
                    r="8.9"
                    fill="none"
                    stroke="var(--gold)"
                    strokeWidth="0.45"
                    strokeDasharray="1 1"
                    animate={{ rotate: 360, opacity: [0.45, 0.9, 0.45] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <motion.circle
                  r={node.active ? "5.35" : "4.3"}
                  fill="#EFD39A"
                  opacity={0.34}
                  animate={node.active ? { scale: [1, 1.22, 1], opacity: [0.35, 0.18, 0.35] } : { scale: 1 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  r={node.active ? "4.2" : "3.35"}
                  fill={node.unlocked || node.active ? "url(#nodeFill)" : "#E8E0D0"}
                  stroke={node.unlocked ? "#E7CB88" : "rgba(13,15,18,0.12)"}
                  strokeWidth="0.55"
                  style={{ filter: "url(#softShadow)" }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                />
                <circle
                  r={node.active ? "2.1" : "1.6"}
                  fill="#B68124"
                  opacity={node.unlocked || node.active ? 1 : 0.35}
                />
                <motion.circle
                  r={node.active ? "0.95" : "0.75"}
                  fill="#FFE7AE"
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2.1 + (node.id % 4) * 0.33, repeat: Infinity, ease: "easeInOut" }}
                />
                <text
                  x={labelX}
                  y="1.2"
                  textAnchor={labelToRight ? "start" : "end"}
                  className="font-sans font-bold fill-[var(--ink)] pointer-events-none"
                  style={{ fontSize: "3.05px" }}
                >
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
  const step = isProd ? Math.max(10.4, Math.min(15.6, 1120 / Math.max(total, 10))) : Math.max(7.4, Math.min(11.4, 820 / Math.max(total, 12)));
  const y = (isProd ? 8 : 6) + index * step;

  // Flowing S-curve with per-node drift (less rigid than strict zigzag).
  const center = isProd ? 50 : 49;
  const amplitude = isProd ? 30 : 26;
  const wave = Math.sin(index * 0.72 + 0.4) * amplitude;
  const drift = Math.sin(index * 1.61 + 1.2) * (isProd ? 6.4 : 4.8);
  const spread = (index % 2 === 0 ? 1 : -1) * (isProd ? 1.9 : 1.2);
  const x = center + wave + drift + spread;
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
    const c1x = prev.x + dx * 0.32;
    const c1y = prev.y + dy * 0.08;
    const c2x = curr.x - dx * 0.32;
    const c2y = curr.y - dy * 0.08;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${curr.x} ${curr.y}`;
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
