"use client";
import { motion } from "framer-motion";
import { BookmarkSimple, CheckCircle } from "@phosphor-icons/react";
import ParticleBurst from "@/components/shared/ParticleBurst";
export default function SaveButton({ isSaved, onSave }: { isSaved: boolean; onSave: () => void }) {
  return <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSave} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-colors relative ${isSaved ? "bg-[var(--jade)] text-white" : "bg-[var(--gold)] text-[var(--ink)]"}`}>{isSaved && <ParticleBurst trigger={true} color="rgba(184,148,63)" />}{isSaved ? <CheckCircle weight="regular" size={16} /> : <BookmarkSimple weight="regular" size={16} />}{isSaved ? "Saved" : "Save"}</motion.button>;
}
