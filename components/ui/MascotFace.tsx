"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Eyes,
  FaceWarmth,
  Headwear,
  SKIN,
  SKIN_SHADE,
  Sunglasses,
} from "@/components/ui/mascotParts";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { ThemeId } from "@/types/theme";

export interface MascotFaceProps {
  size?: number;
  /** Force an outfit instead of following the active theme. */
  theme?: ThemeId;
  className?: string;
}

/**
 * The guide's head, cropped for a circular button.
 *
 * Same anatomy as the full-body mascot — it just frames the head instead of
 * the whole figure, so the launcher in the corner is recognisably the same
 * character that waves from the dashboard. The wardrobe follows the theme,
 * which means the button quietly restyles itself when the weather does.
 */
export function MascotFace({ size = 40, theme, className = "" }: MascotFaceProps) {
  const { theme: activeTheme } = useTheme();
  const dressedFor = theme ?? activeTheme;

  return (
    <svg
      width={size}
      height={size}
      /* The head sits at (110, 86) r=40 in the shared 220×220 space. This box
         is centred on it and wide enough for the sunny straw brim (x 46→174)
         and tall enough for the snowy bobble (y≈20). */
      viewBox="42 18 136 136"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <AnimatePresence mode="wait">
        {/* Keyed on theme so a wardrobe change crossfades rather than snapping —
            the palette wash behind it is already doing the loud part. */}
        <motion.g
          key={dressedFor}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {dressedFor === "rainy" ? (
            /* hood shell, behind the face */
            <ellipse cx="110" cy="88" rx="52" ry="54" fill="#f2c53d" />
          ) : null}

          <circle cx="110" cy="86" r="40" fill={SKIN} />
          <path
            d="M110 46a40 40 0 0 1 0 80c14-22 14-58 0-80Z"
            fill={SKIN_SHADE}
            opacity="0.55"
          />

          <Headwear theme={dressedFor} />

          {dressedFor === "sunny" ? <Sunglasses /> : <Eyes />}

          <FaceWarmth />
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}
