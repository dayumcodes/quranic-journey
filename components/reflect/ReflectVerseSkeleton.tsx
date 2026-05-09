"use client";

import { motion } from "framer-motion";

export default function ReflectVerseSkeleton() {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 25, delay: 0.3 }}
      className="w-full max-w-[680px] mt-16 bg-white/[0.03] backdrop-blur-[24px] border border-white/10 rounded-[2.5rem] p-8 md:p-14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),_0_32px_64px_-16px_rgba(0,0,0,0.5)]"
    >
      <div className="h-3 w-32 shimmer-dark rounded-full" />
      <div className="h-28 w-full shimmer-dark rounded-xl mt-10" />
      <div className="h-4 w-full shimmer-dark rounded-full mt-8" />
      <div className="h-4 w-3/4 shimmer-dark rounded-full mt-2 ml-auto" />
    </motion.div>
  );
}
