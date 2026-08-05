"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { clayPress, springSnappy } from "@/lib/animations";
import { feedback, type FeedbackKind } from "@/lib/feedback";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";

type Variant = "primary" | "soft" | "ghost" | "icon";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm gap-1.5",
  md: "h-12 px-6 text-[15px] gap-2",
  lg: "h-16 px-8 text-lg gap-2.5",
};

const ICON_SIZES: Record<Size, string> = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
};

export interface ClayButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
  tone?: ClayTone;
  /** Sound + haptic pattern fired on press. Set to null to stay silent. */
  sound?: FeedbackKind | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children?: ReactNode;
}

/**
 * Every button is a physical piece of clay: it squashes on press,
 * flips to an inset shadow while held, and answers with sound + haptics.
 */
export function ClayButton({
  variant = "soft",
  size = "md",
  tone = "surface",
  sound,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = "",
  children,
  onClick,
  disabled,
  ...rest
}: ClayButtonProps) {
  const kind: FeedbackKind | null =
    sound === undefined ? (variant === "primary" ? "press" : "tap") : sound;

  const base =
    "relative inline-flex items-center justify-center font-display font-semibold select-none " +
    "transition-shadow duration-200 outline-none focus-visible:ring-4 focus-visible:ring-clay-ocean/40 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  const skin =
    variant === "primary"
      ? "bg-clay-tangerine text-white shadow-clay hover:shadow-clay-hover active:shadow-clay-pressed"
      : variant === "ghost"
        ? "bg-clay-surface/70 text-clay-ink-soft shadow-clay-xs hover:shadow-clay-sm active:shadow-clay-pressed"
        : variant === "icon"
          ? `${TONES[tone].bg} text-clay-ink shadow-clay-sm hover:shadow-clay active:shadow-clay-pressed`
          : `${TONES[tone].bg} text-clay-ink shadow-clay-sm hover:shadow-clay active:shadow-clay-pressed`;

  const shape =
    variant === "icon"
      ? `${ICON_SIZES[size]} rounded-full`
      : `${SIZES[size]} rounded-full ${fullWidth ? "w-full" : ""}`;

  return (
    <motion.button
      type="button"
      {...clayPress}
      transition={springSnappy}
      onClick={(event) => {
        if (kind) feedback(kind);
        onClick?.(event);
      }}
      disabled={disabled}
      className={[base, skin, shape, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </motion.button>
  );
}

export interface ClayChipProps extends HTMLMotionProps<"button"> {
  active?: boolean;
  tone?: ClayTone;
  children?: ReactNode;
}

/** Small selectable pill used for travel styles, interests and filters. */
export function ClayChip({
  active = false,
  tone = "peach",
  className = "",
  children,
  onClick,
  ...rest
}: ClayChipProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.92 }}
      transition={springSnappy}
      onClick={(event) => {
        feedback(active ? "toggleOff" : "toggleOn");
        onClick?.(event);
      }}
      className={[
        "px-4 py-2 rounded-full text-sm font-body font-semibold transition-all duration-200",
        active
          ? `${TONES[tone].bg} text-clay-ink shadow-clay-sm`
          : "bg-clay-sunken/70 text-clay-ink-soft shadow-clay-inset-sm hover:text-clay-ink",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
