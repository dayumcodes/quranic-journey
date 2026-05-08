"use client";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import ReflectCanvasMesh from "@/components/reflect/ReflectCanvasMesh";
import LocationDetector from "@/components/reflect/LocationDetector";
import VerseReflectionCard from "@/components/reflect/VerseReflectionCard";
import VerseDots from "@/components/reflect/VerseDots";
import SavedDrawer from "@/components/reflect/SavedDrawer";
import { useLocation } from "@/lib/hooks/useLocation";
import { pageVariants } from "@/lib/constants/motion";
export default function ReflectPage() {
  const { state, classification } = useLocation();
  return <><GlobalNav currentPage="reflect" /><motion.div className="min-h-screen bg-[var(--void)] text-white pt-32 pb-40 px-6 relative" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ReflectCanvasMesh /><div className="absolute inset-0 grain-overlay" /><div className="relative z-10 max-w-[1320px] mx-auto flex flex-col items-center"><LocationDetector state={state} classification={classification} /><p className="mt-4 text-[13px] text-[var(--text-3)] underline cursor-pointer hover:text-white transition-colors">Enter context manually →</p>{state === "DETECTED" && <><VerseReflectionCard /><VerseDots /></>}</div><SavedDrawer /></motion.div></>;
}
