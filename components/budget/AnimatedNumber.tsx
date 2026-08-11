"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export interface AnimatedNumberProps {
  value: number;
  /** Prefix rendered before the digits, e.g. the rupee glyph. */
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Counts to a new value with a soft ease whenever the number changes.
 * The whole page hangs off a single big figure, so it should never
 * teleport — it should settle.
 */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 0.7,
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {Math.round(display).toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}
