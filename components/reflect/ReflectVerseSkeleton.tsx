"use client";

import { motion } from "framer-motion";

export default function ReflectVerseSkeleton() {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }}
      className="w-full max-w-[680px] mt-16 bg-[var(--reflect-glass)] backdrop-blur-[24px] border border-[var(--reflect-glass-border)] rounded-[2.5rem] p-8 md:p-14 shadow-[0_32px_64px_-16px_rgba(13,15,18,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_-16px_rgba(0,0,0,0.5)]"
    >
      <div className="h-3 w-32 reflect-loading-shimmer rounded-full" />
      <div className="h-28 w-full reflect-loading-shimmer rounded-xl mt-10" />
      <div className="h-4 w-full reflect-loading-shimmer rounded-full mt-8" />
      <div className="h-4 w-3/4 reflect-loading-shimmer rounded-full mt-2 ml-auto" />
    </motion.div>
  );
}
