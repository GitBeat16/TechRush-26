"use client";

import { useEffect, type RefObject } from "react";
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";

/* ------------------------------------------------------------------
   Pointer gaze

   Reports where the pointer sits relative to an element's centre, as two
   spring-smoothed values in roughly −1 … 1. Components multiply those by
   however far the thing they're moving should travel, so one source drives
   the head, the eyes and the body at different depths.

   Everything lands on motion values, so tracking the cursor never re-renders
   React. The element's centre is measured once and re-measured on scroll and
   resize rather than on every move, so the move handler itself does no
   layout work.
------------------------------------------------------------------ */

export interface Gaze {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

const SETTLE = { stiffness: 130, damping: 20, mass: 0.7 } as const;

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

/**
 * @param ref   the element to look out from
 * @param reach how many pixels away counts as "all the way over there"
 */
export function useGaze(ref: RefObject<HTMLElement | null>, reach = 460): Gaze {
  const reduced = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SETTLE);
  const y = useSpring(rawY, SETTLE);

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;

    let centreX = 0;
    let centreY = 0;

    const measure = () => {
      const box = element.getBoundingClientRect();
      centreX = box.left + box.width / 2;
      centreY = box.top + box.height / 2;
    };

    const look = (event: PointerEvent) => {
      rawX.set(clamp((event.clientX - centreX) / reach));
      // Vertical reach is shorter — a face reads as looking down long before
      // the pointer is as far below it as it would need to be to the side.
      rawY.set(clamp((event.clientY - centreY) / (reach * 0.7)));
    };

    const rest = () => {
      rawX.set(0);
      rawY.set(0);
    };

    measure();

    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("blur", rest);
    document.addEventListener("pointerleave", rest);

    return () => {
      window.removeEventListener("pointermove", look);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.removeEventListener("blur", rest);
      document.removeEventListener("pointerleave", rest);
    };
  }, [ref, reach, reduced, rawX, rawY]);

  return { x, y };
}
