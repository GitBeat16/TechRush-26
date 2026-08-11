"use client";

import { useRive } from "@rive-app/react-canvas";
import { motion } from "framer-motion";
import { breathe, floatY, springSoft, sway } from "@/lib/animations";
import { useTheme } from "@/lib/theme/ThemeProvider";
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

const SKIN = "#ffd7b3";
const SKIN_SHADE = "#f2b283";
const INK = "#4a3a30";

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

          {/* cheeks + smile */}
          <ellipse
            cx="86"
            cy="106"
            rx="7"
            ry="4.6"
            fill="#f7a8b8"
            opacity="0.75"
          />
          <ellipse
            cx="136"
            cy="106"
            rx="7"
            ry="4.6"
            fill="#f7a8b8"
            opacity="0.75"
          />
          <path
            d="M102 108c4 5 12 5 16 0"
            stroke={INK}
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}

/* ------------------------------ headwear --------------------------- */

function Headwear({ theme }: { theme: ThemeId }) {
  if (theme === "sunny") {
    /* wide straw brim to keep the sun off */
    return (
      <>
        <ellipse cx="110" cy="72" rx="64" ry="14" fill="#e8c88b" />
        <ellipse cx="110" cy="69" rx="64" ry="13" fill="#f3dcae" />
        <path d="M80 70c3-28 57-28 60 0Z" fill="#efd097" />
        <path d="M82 62h56l1 8H81Z" fill="#f2795a" opacity="0.85" />
        <ellipse
          cx="92"
          cy="52"
          rx="13"
          ry="5"
          fill="#ffffff"
          opacity="0.4"
          transform="rotate(-18 92 52)"
        />
      </>
    );
  }

  if (theme === "snowy") {
    /* Bobble hat. The crown is a full dome that overlaps the top of the head
       (y=46) rather than a shallow arc, so the hat reads as worn instead of
       hovering, and the bobble sits low enough to touch the crown. */
    return (
      <>
        {/* ear flaps — drawn first so the brim overlaps and joins them on */}
        <circle cx="66" cy="86" r="11" fill="#dfe9fa" />
        <circle cx="154" cy="86" r="11" fill="#dfe9fa" />

        <path d="M70 80c0-30 18-46 40-46s40 16 40 46Z" fill="#5a7fc0" />
        <path d="M84 56c8-12 44-12 52 0-10-6-42-6-52 0Z" fill="#6f95d6" />
        <rect x="64" y="72" width="92" height="17" rx="8.5" fill="#eef4ff" />
        <motion.circle cx="110" cy="32" r="12" fill="#eef4ff" {...floatY(2.5, 3.4)} />
      </>
    );
  }

  if (theme === "rainy") {
    /* raincoat hood pulled over, framing the face */
    return (
      <>
        <path d="M68 80c2-40 82-40 84 0-8-26-76-26-84 0Z" fill="#d8a92a" />
        <path d="M70 76c4-34 76-34 80 0Z" fill="#f2c53d" />
        <path
          d="M70 76c4-34 76-34 80 0"
          stroke="#d8a92a"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <ellipse
          cx="92"
          cy="54"
          rx="13"
          ry="5"
          fill="#ffffff"
          opacity="0.35"
          transform="rotate(-18 92 54)"
        />
      </>
    );
  }

  /* clay — the original explorer hat */
  return (
    <>
      <path d="M64 74c6-24 24-38 46-38s40 14 46 38Z" fill="#7fcfae" />
      <rect x="52" y="70" width="116" height="14" rx="7" fill="#5fbd98" />
      <ellipse
        cx="92"
        cy="56"
        rx="14"
        ry="6"
        fill="#ffffff"
        opacity="0.45"
        transform="rotate(-18 92 56)"
      />
    </>
  );
}

/* -------------------------- face --------------------------------- */

function Eyes() {
  return (
    <motion.g
      animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
      transition={{
        type: "tween",
        duration: 4.6,
        repeat: Infinity,
        times: [0, 0.72, 0.77, 0.82, 1],
      }}
      /* `transform-box: fill-box` makes the origin resolve against this
         group's own box, so the lids squash in place. Without it the browser
         measures from the SVG's origin and the eyes slide off the face. */
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <circle cx="96" cy="94" r="5.2" fill={INK} />
      <circle cx="126" cy="94" r="5.2" fill={INK} />
      <circle cx="97.6" cy="92.2" r="1.8" fill="#ffffff" />
      <circle cx="127.6" cy="92.2" r="1.8" fill="#ffffff" />
    </motion.g>
  );
}

function Sunglasses() {
  return (
    <g>
      <rect x="80" y="86" width="26" height="18" rx="9" fill="#3d3a52" />
      <rect x="116" y="86" width="26" height="18" rx="9" fill="#3d3a52" />
      <path d="M106 93h10" stroke="#3d3a52" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 92H72" stroke="#3d3a52" strokeWidth="4" strokeLinecap="round" />
      <path d="M142 92h8" stroke="#3d3a52" strokeWidth="4" strokeLinecap="round" />
      {/* glint */}
      <path
        d="M85 99l8-9"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M121 99l8-9"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </g>
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
