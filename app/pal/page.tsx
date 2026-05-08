"use client";
import { useState } from "react";
import { Fire } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import GlobalNav from "@/components/nav/GlobalNav";
import PartnerHeader from "@/components/pal/PartnerHeader";
import StatCard from "@/components/pal/StatCard";
import ProgressCard from "@/components/pal/ProgressCard";
import NudgeCard from "@/components/pal/NudgeCard";
import SharedFeed from "@/components/pal/SharedFeed";
import SharedGoalWidget from "@/components/pal/SharedGoalWidget";
import { pageVariants } from "@/lib/constants/motion";
export default function PalPage() {
  const [nudgeSent, setNudgeSent] = useState(false);
  return <><GlobalNav currentPage="pal" /><motion.div className="min-h-screen bg-[var(--parchment)] pt-24 pb-32 px-6 md:px-12" variants={pageVariants} initial="initial" animate="animate" exit="exit"><div className="max-w-[1320px] mx-auto"><PartnerHeader /><div className="flex gap-8 mb-20"><div className="w-[58%] flex flex-col gap-6"><StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value="12" label="day streak" /><ProgressCard value={45} total={100} label="Verses this week" /></div><div className="w-[42%] flex flex-col gap-6"><StatCard icon={<Fire weight="regular" size={24} className="text-[#F97316]" />} value="14" label="day streak" delay={0.1} /><ProgressCard value={60} total={100} label="Verses this week" delay={0.1} color="bg-[var(--jade)]" /></div></div><NudgeCard nudgeSent={nudgeSent} onSend={() => setNudgeSent(true)} /><SharedFeed /><SharedGoalWidget /></div></motion.div></>;
}
