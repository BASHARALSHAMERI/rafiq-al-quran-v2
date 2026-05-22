/**
 * Shared page animation variants — used across Centers, Circles, Library, etc.
 * Centralised to avoid duplicating the same motion config in every page.
 */

/** Staggers children on initial mount */
export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
} as const;

/** Fade-up entrance for individual sections */
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" as const },
  },
} as const;
