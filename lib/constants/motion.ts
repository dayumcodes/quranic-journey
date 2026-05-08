export const SPRINGS = {
  DEFAULT: { type: "spring", stiffness: 100, damping: 20 },
  SNAPPY: { type: "spring", stiffness: 300, damping: 22 },
  OVERSHOOT: { type: "spring", stiffness: 400, damping: 18 },
  GENTLE: { type: "spring", stiffness: 60, damping: 25 }
} as const;

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { ...SPRINGS.DEFAULT, delay: 0.1 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } }
};
