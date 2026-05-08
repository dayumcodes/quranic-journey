"use client";
import { motion } from "framer-motion";
export default function StatCard({ icon, value, label, delay = 0 }: { icon: React.ReactNode; value: string; label: string; delay?: number }) {
  return <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20, delay }} className="bg-white/70 backdrop-blur-sm border border-[rgba(13,15,18,0.07)] rounded-[1.5rem] p-7 flex items-center gap-6 shadow-card-resting"><motion.div animate={{ y: [-4,0,-4] }} transition={{ repeat: Infinity, duration: 2, type: "spring", stiffness: 60, damping: 25 }} className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-50">{icon}</motion.div><div><div className="font-mono font-bold text-5xl text-[var(--ink)] leading-none mb-1">{value}</div><div className="font-sans text-sm text-[var(--text-3)]">{label}</div></div></motion.div>;
}
