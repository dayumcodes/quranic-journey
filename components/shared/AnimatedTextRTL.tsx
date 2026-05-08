"use client";

import { motion } from "framer-motion";

interface AnimatedTextRTLProps {
  text: string;
  delay?: number;
}

export default function AnimatedTextRTL({ text, delay = 0 }: AnimatedTextRTLProps) {
  const words = text.split(" ");
  return (
    <div dir="rtl" className="font-arabic flex flex-row-reverse flex-wrap gap-x-2 gap-y-4 justify-start">
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}
