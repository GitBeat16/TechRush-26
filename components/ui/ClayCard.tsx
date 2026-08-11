"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";
import { hoverLift, hoverLiftSubtle } from "@/lib/animations";

type Depth = "sm" | "md" | "lg";
type Radius = "sm" | "md" | "lg" | "xl";

const DEPTH: Record<Depth, string> = {
  sm: "shadow-clay-sm",
  md: "shadow-clay",
  lg: "shadow-clay-lg",
};

const RADIUS: Record<Radius, string> = {
  sm: "rounded-clay-sm",
  md: "rounded-clay",
  lg: "rounded-clay-lg",
  xl: "rounded-clay-xl",
};

export interface ClayCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  tone?: ClayTone;
  depth?: Depth;
  radius?: Radius;
  /** Adds lift-on-hover physics + a deeper shadow */
  interactive?: boolean;
  /** Softer lift, for smaller tiles */
  subtle?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * The building block of the whole dashboard: a soft 3D slab of clay.
 * Shadows carry the depth, motion carries the tactility.
 */
export function ClayCard({
  tone = "surface",
  depth = "md",
  radius = "lg",
  interactive = false,
  subtle = false,
  className = "",
  children,
  ...rest
}: ClayCardProps) {
  const motionProps = interactive
    ? subtle
      ? hoverLiftSubtle
      : hoverLift
    : {};

  return (
    <motion.div
      {...motionProps}
      {...rest}
      className={[
        TONES[tone].bg,
        TONES[tone].text,
        DEPTH[depth],
        RADIUS[radius],
        "border border-clay-sky/80",
        interactive
          ? "cursor-pointer transition-shadow duration-300 hover:shadow-clay-hover"
          : "",
        "relative will-change-transform",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </motion.div>
  );
}

/** A recessed well — used for inputs, tracks and grouped content. */
export function ClayWell({
  className = "",
  children,
  radius = "md",
}: {
  className?: string;
  children?: ReactNode;
  radius?: Radius;
}) {
  return (
    <div
      className={[
        "bg-clay-sunken/80 border border-clay-sky/60 shadow-clay-inset-sm",
        RADIUS[radius],
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
