export function getRevealMaxRadius(originX: number, originY: number): number {
  if (typeof window === "undefined") return 1;
  const { innerWidth: w, innerHeight: h } = window;
  const toCorner = Math.hypot(Math.max(originX, w - originX), Math.max(originY, h - originY));
  return toCorner + 24;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
