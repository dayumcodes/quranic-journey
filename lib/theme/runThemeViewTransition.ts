import { getRevealMaxRadius, prefersReducedMotion } from "@/lib/theme/themeTransition";
import { useThemeStore, type ThemeMode } from "@/lib/store/themeStore";

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Circular reveal of the *themed page* (not a flat color wash).
 * Uses View Transitions: old UI stays outside the circle while the new theme shows inside.
 */
export async function runThemeViewTransition(
  next: ThemeMode,
  originX: number,
  originY: number
): Promise<void> {
  if (prefersReducedMotion() || !supportsViewTransitions()) {
    useThemeStore.getState().setTheme(next);
    return;
  }

  const root = document.documentElement;
  const radius = getRevealMaxRadius(originX, originY);

  root.style.setProperty("--theme-origin-x", `${originX}px`);
  root.style.setProperty("--theme-origin-y", `${originY}px`);
  root.classList.add("theme-transitioning");

  const applyTheme = () => {
    useThemeStore.getState().setTheme(next);
  };

  const transition = document.startViewTransition(applyTheme);

  try {
    await transition.ready;

    const reveal = root.animate(
      {
        clipPath: [
          `circle(0px at ${originX}px ${originY}px)`,
          `circle(${radius}px at ${originX}px ${originY}px)`
        ]
      },
      {
        duration: 650,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
        pseudoElement: "::view-transition-new(root)"
      }
    );

    await Promise.all([reveal.finished, transition.finished]);
  } finally {
    root.classList.remove("theme-transitioning");
    root.style.removeProperty("--theme-origin-x");
    root.style.removeProperty("--theme-origin-y");
  }
}
