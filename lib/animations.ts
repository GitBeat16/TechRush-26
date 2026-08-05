import type { Transition, Variants } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Springs — everything in Wanderly moves like soft clay, never linear. */
/* ------------------------------------------------------------------ */

export const springSoft: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 26,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 24,
  mass: 0.7,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 520,
  damping: 14,
  mass: 0.8,
};

export const easeClay: Transition = {
  duration: 0.5,
  ease: [0.34, 1.4, 0.5, 1],
};

/* ------------------------------------------------------------------ */
/* Entrance variants                                                   */
/* ------------------------------------------------------------------ */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...springSoft, filter: { duration: 0.4 } },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45 } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.82, y: 14 },
  show: { opacity: 1, scale: 1, y: 0, transition: springBouncy },
};

export const scaleInSoft: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

export function slideIn(
  direction: "left" | "right" | "up" | "down",
  distance = 40,
): Variants {
  const horizontal = direction === "left" || direction === "right";
  const offset = (direction === "left" || direction === "up" ? -1 : 1) * distance;

  return horizontal
    ? {
        hidden: { opacity: 0, x: offset },
        show: { opacity: 1, x: 0, transition: springSoft },
      }
    : {
        hidden: { opacity: 0, y: offset },
        show: { opacity: 1, y: 0, transition: springSoft },
      };
}

/** Parent orchestrator — pair with any child variant above. */
export function stagger(staggerChildren = 0.08, delayChildren = 0.04): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}

/* ------------------------------------------------------------------ */
/* Idle loops — floating objects and breathing clay                    */
/* ------------------------------------------------------------------ */

export function floatY(distance = 12, duration = 5, delay = 0) {
  return {
    animate: { y: [0, -distance, 0] },
    transition: {
      // Multi-keyframe loops must be tweens — springs only support two frames.
      type: "tween",
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    } as Transition,
  };
}

export function floatDrift(
  distance = 14,
  rotate = 4,
  duration = 8,
  delay = 0,
) {
  return {
    animate: {
      y: [0, -distance, 0, distance * 0.5, 0],
      x: [0, distance * 0.4, 0, -distance * 0.3, 0],
      rotate: [0, rotate, 0, -rotate, 0],
    },
    transition: {
      // Multi-keyframe loops must be tweens — springs only support two frames.
      type: "tween",
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    } as Transition,
  };
}

/** Gentle "breathing" used on the mascot and hero clay blobs. */
export function breathe(scale = 1.035, duration = 4.5, delay = 0) {
  return {
    animate: { scale: [1, scale, 1] },
    transition: {
      // Multi-keyframe loops must be tweens — springs only support two frames.
      type: "tween",
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    } as Transition,
  };
}

export function sway(deg = 3, duration = 6, delay = 0) {
  return {
    animate: { rotate: [-deg, deg, -deg] },
    transition: {
      // Multi-keyframe loops must be tweens — springs only support two frames.
      type: "tween",
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    } as Transition,
  };
}

/* ------------------------------------------------------------------ */
/* Interaction presets                                                 */
/* ------------------------------------------------------------------ */

/** Card lifts off the surface — shadow swap is handled by CSS classes. */
export const hoverLift = {
  whileHover: { y: -10, scale: 1.015, transition: springSoft },
  whileTap: { y: -2, scale: 0.985, transition: springSnappy },
};

export const hoverLiftSubtle = {
  whileHover: { y: -5, scale: 1.01, transition: springSoft },
  whileTap: { y: 0, scale: 0.99, transition: springSnappy },
};

/** Clay press — squashes like a real physical button. */
export const clayPress = {
  whileHover: { scale: 1.04, transition: springSnappy },
  whileTap: { scale: 0.93, transition: { type: "spring", stiffness: 700, damping: 18 } as Transition },
};

export const iconPress = {
  whileHover: { scale: 1.1, rotate: -4, transition: springBouncy },
  whileTap: { scale: 0.88, rotate: 0, transition: springSnappy },
};

/** Shared viewport config so every section reveals consistently. */
export const revealViewport = { once: true, amount: 0.2 } as const;
