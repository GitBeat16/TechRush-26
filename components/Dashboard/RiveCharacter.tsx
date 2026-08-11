"use client";

import { useRive } from "@rive-app/react-canvas";
import { motion } from "framer-motion";
import { breathe, floatY, springSoft, sway } from "@/lib/animations";
import { useTheme } from "@/lib/theme/ThemeProvider";
import {
  Eyes,
  FaceWarmth,
  Headwear,
  INK,
  SKIN,
  SKIN_SHADE,
  Sunglasses,
} from "@/components/ui/mascotParts";
import type { ThemeId } from "@/types/theme";

/* ------------------------------------------------------------------ */
/* Travel assistant character.                                         */
/*                                                                     */
/* The mascot dresses for the weather the active theme describes:      */
/* sun hat and shades under `sunny`, a puffer and mittens under         */
/* `snowy`, a hooded raincoat and umbrella under `rainy`, and the       */
/* original explorer kit under `clay`.                                  */
/*                                                                     */
/* Drop a .riv file in /public and pass `src` (plus artboard /          */
/* stateMachine) to swap the hand-modelled clay mascot below for the    */
/* real Rive rig — no other component needs to change.                  */
/* ------------------------------------------------------------------ */

export interface RiveCharacterProps {
  /** e.g. "/rive/wanderly-guide.riv" */
  src?: string;
  artboard?: string;
  stateMachine?: string;
  size?: number;
  className?: string;
  /** Force an outfit instead of following the active theme. */
  theme?: ThemeId;
}

export function RiveCharacter({
  src,
  artboard,
  stateMachine = "State Machine 1",
  size = 220,
  className = "",
  theme,
}: RiveCharacterProps) {
  const { theme: activeTheme } = useTheme();
  const dressedFor = theme ?? activeTheme;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...springSoft, delay: 0.25 }}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* soft clay pedestal so the character always sits in the scene */}
      <div className="absolute bottom-2 left-1/2 h-5 w-[62%] -translate-x-1/2 rounded-full bg-clay-bg-deep opacity-70 blur-[6px]" />

      {src ? (
        <RiveStage
          src={src}
          artboard={artboard}
          stateMachine={stateMachine}
          size={size}
        />
      ) : (
        <ClayGuide size={size} theme={dressedFor} />
      )}
    </motion.div>
  );
}

function RiveStage({
  src,
  artboard,
  stateMachine,
  size,
}: {
  src: string;
  artboard?: string;
  stateMachine: string;
  size: number;
}) {
  const { RiveComponent } = useRive({
    src,
    artboard,
    stateMachines: stateMachine,
    autoplay: true,
  });

  return <RiveComponent style={{ width: size, height: size }} />;
}

/* ------------------------------------------------------------------ */
/* Wardrobe                                                            */
/*                                                                     */
/* One palette per theme. Shapes that differ between outfits (headwear, */
/* the held prop, sunglasses vs. eyes) are separate components below —  */
/* everything else just re-colours.                                     */
/* ------------------------------------------------------------------ */

interface Outfit {
  /** Torso / coat. */
  coat: string;
  coatShade: string;
  /** Sleeve on the waving arm — skin tone when the arms are bare. */
  sleeve: string;
  /** Hand or mitten. */
  hand: string;
  /** Scarf colour, or null when the outfit has no scarf. */
  scarf: string | null;
  pack: string;
  packShade: string;
}

const OUTFITS: Record<ThemeId, Outfit> = {
  // Original explorer: linen shirt, pink scarf, blue daypack.
  clay: {
    coat: SKIN,
    coatShade: SKIN_SHADE,
    sleeve: SKIN,
    hand: "#ffcfa4",
    scarf: "#f7a8b8",
    pack: "#8fb6ee",
    packShade: "#6f9ee6",
  },
  // Hot: sleeveless coral top, bare arms, straw hat, shades.
  sunny: {
    coat: "#ff9f7a",
    coatShade: "#ef7d55",
    sleeve: SKIN,
    hand: "#ffcfa4",
    scarf: null,
    pack: "#7fcfae",
    packShade: "#5fbd98",
  },
  // Cold: quilted puffer, chunky scarf, mittens, bobble hat.
  snowy: {
    coat: "#6f95d6",
    coatShade: "#5a7fc0",
    sleeve: "#6f95d6",
    hand: "#eef4ff",
    scarf: "#eef4ff",
    pack: "#b7cdf0",
    packShade: "#9ab9e8",
  },
  // Wet: hooded yellow raincoat, umbrella.
  rainy: {
    coat: "#f2c53d",
    coatShade: "#d8a92a",
    sleeve: "#f2c53d",
    hand: "#ffcfa4",
    scarf: null,
    pack: "#62b58c",
    packShade: "#4f9c76",
  },
};

/* ------------------------------------------------------------------ */
/* The stand-in: a chunky clay travel guide, dressed for the weather.  */
/* ------------------------------------------------------------------ */

function ClayGuide({ size, theme }: { size: number; theme: ThemeId }) {
  const outfit = OUTFITS[theme];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
      {...floatY(9, 5.2)}
    >
      {/* Re-keyed on theme so a wardrobe change crossfades in rather than
          snapping — the palette swap already washes the page behind it. */}
      <motion.g
        key={theme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* backpack */}
        <rect x="52" y="96" width="46" height="58" rx="20" fill={outfit.pack} />
        <rect
          x="60"
          y="112"
          width="30"
          height="20"
          rx="9"
          fill={outfit.packShade}
        />

        {/* body */}
        <motion.g
          {...breathe(1.03, 4.2)}
          /* pivot at the base of the torso so breathing lifts the shoulders */
          style={{ transformBox: "fill-box", transformOrigin: "50% 85%" }}
        >
          <path
            d="M74 168c0-26 16-44 36-44s36 18 36 44a10 10 0 0 1-10 10H84a10 10 0 0 1-10-10Z"
            fill={outfit.coat}
          />
          <path
            d="M110 124c20 0 36 18 36 44a10 10 0 0 1-10 10h-14c8-20 2-42-12-54Z"
            fill={outfit.coatShade}
            opacity="0.7"
          />

          <CoatDetail theme={theme} outfit={outfit} />

          {outfit.scarf ? (
            <path
              d="M84 132c14 10 38 10 52 0l4 12c-18 12-42 12-60 0Z"
              fill={outfit.scarf}
            />
          ) : null}
        </motion.g>

        {/* the arm that holds the prop, plus the prop itself */}
        <PropArm theme={theme} outfit={outfit} />

        {/* waving arm */}
        <motion.g
          animate={{ rotate: [0, -16, 4, -12, 0] }}
          transition={{
            type: "tween",
            duration: 3.4,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 1.6,
          }}
          /* pivot at the shoulder end of the sleeve, not the hand */
          style={{ transformBox: "fill-box", transformOrigin: "46% 52%" }}
        >
          <rect
            x="140"
            y="128"
            width="18"
            height="42"
            rx="9"
            fill={outfit.sleeve}
          />
          <circle cx="149" cy="124" r="12" fill={outfit.hand} />
        </motion.g>

        {/* head */}
        <motion.g {...floatY(4, 3.4, 0.3)}>
          {theme === "rainy" ? (
            /* hood shell, behind the face */
            <ellipse cx="110" cy="88" rx="52" ry="54" fill="#f2c53d" />
          ) : null}

          <circle cx="110" cy="86" r="40" fill={SKIN} />
          <path
            d="M110 46a40 40 0 0 1 0 80c14-22 14-58 0-80Z"
            fill={SKIN_SHADE}
            opacity="0.55"
          />

          <Headwear theme={theme} />

          {theme === "sunny" ? <Sunglasses /> : <Eyes />}

          <FaceWarmth />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

/* ---------------------- coat-specific detailing -------------------- */

function CoatDetail({ theme, outfit }: { theme: ThemeId; outfit: Outfit }) {
  if (theme === "snowy") {
    /* quilting seams so the puffer reads as padded */
    return (
      <g stroke={outfit.coatShade} strokeWidth="2.4" strokeLinecap="round" opacity="0.8">
        <path d="M78 146c20 6 44 6 64 0" fill="none" />
        <path d="M75 160c22 7 48 7 70 0" fill="none" />
      </g>
    );
  }

  if (theme === "rainy") {
    /* buttoned placket down the middle of the mac */
    return (
      <g>
        <path
          d="M110 126v52"
          stroke={outfit.coatShade}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="110" cy="146" r="3" fill="#fff3c9" />
        <circle cx="110" cy="162" r="3" fill="#fff3c9" />
      </g>
    );
  }

  if (theme === "sunny") {
    /* tank straps over bare shoulders */
    return (
      <g fill={outfit.coatShade} opacity="0.85">
        <path d="M92 128c4-6 10-8 14-8l-2 7c-4 1-8 3-10 6Z" />
        <path d="M128 128c-4-6-10-8-14-8l2 7c4 1 8 3 10 6Z" />
      </g>
    );
  }

  return null;
}

/* ------------------- the free arm and what it holds ---------------- */

function PropArm({ theme, outfit }: { theme: ThemeId; outfit: Outfit }) {
  return (
    <g>
      {/* arm reaching down-left, out from behind the pack */}
      <path
        d="M86 138 62 152"
        stroke={outfit.sleeve}
        strokeWidth="17"
        strokeLinecap="round"
      />
      <circle cx="60" cy="153" r="11" fill={outfit.hand} />
      <Prop theme={theme} />
    </g>
  );
}

function Prop({ theme }: { theme: ThemeId }) {
  if (theme === "rainy") {
    /* open umbrella, shaft running up through the fist */
    return (
      <motion.g
        {...sway(3.5, 7)}
        /* pivots in the fist, so the canopy tips rather than the handle */
        style={{ transformBox: "fill-box", transformOrigin: "50% 97%" }}
      >
        <path
          d="M58 150V60"
          stroke="#7a5b3a"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M58 150c0 8-9 10-11 3"
          stroke="#7a5b3a"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M12 62c0-30 20-48 46-48s46 18 46 48c-12-8-19-8-23 0-4-8-19-8-23 0-4-8-19-8-23 0-4-8-11-8-23 0Z"
          fill="#e2607a"
        />
        <path
          d="M58 14c26 0 46 18 46 48-12-8-19-8-23 0-4-8-19-8-23 0Z"
          fill="#c94d66"
          opacity="0.6"
        />
        <circle cx="58" cy="11" r="3.6" fill="#7a5b3a" />
      </motion.g>
    );
  }

  if (theme === "snowy") {
    /* a snowball, mid-pack */
    return (
      <g>
        <circle cx="52" cy="168" r="13" fill="#ffffff" />
        <circle cx="48" cy="164" r="4.5" fill="#dce8f7" opacity="0.9" />
        <circle cx="56" cy="172" r="3" fill="#dce8f7" opacity="0.7" />
      </g>
    );
  }

  if (theme === "sunny") {
    /* something cold, with a straw and a fruit slice */
    return (
      <g>
        <path d="M44 148h30l-5 30H49Z" fill="#ffe6a3" />
        <path d="M44 148h30l-1.4 8H45.4Z" fill="#ffd166" />
        <path
          d="M64 148l8-22"
          stroke="#ff8fa8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="46" cy="143" r="8" fill="#ffb03a" />
        <path d="M46 135a8 8 0 0 1 0 16Z" fill="#ff8f2e" />
      </g>
    );
  }

  /* clay — a brass compass for the original explorer */
  return (
    <motion.g
      {...sway(5, 6)}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <circle cx="50" cy="160" r="15" fill="#e0b169" />
      <circle cx="50" cy="160" r="11" fill="#fdf5e6" />
      <path d="M50 151l4 9-4 9-4-9Z" fill="#e2607a" />
      <circle cx="50" cy="160" r="2.2" fill={INK} />
    </motion.g>
  );
}
