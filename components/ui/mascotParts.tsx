"use client";

import { motion } from "framer-motion";
import { floatY } from "@/lib/animations";
import type { ThemeId } from "@/types/theme";

/* ------------------------------------------------------------------ */
/* Shared mascot anatomy                                               */
/*                                                                     */
/* The guide appears at two sizes: full-body on the dashboard and the   */
/* login panel, and face-only on the floating assistant launcher. Both  */
/* draw from this file, so the wardrobe can never drift between them —  */
/* add a hat here and it shows up everywhere the mascot appears.        */
/*                                                                     */
/* All coordinates are in the original 220×220 space, with the head     */
/* centred on (110, 86) at r=40. MascotFace just crops to that.         */
/* ------------------------------------------------------------------ */

export const SKIN = "#ffd7b3";
export const SKIN_SHADE = "#f2b283";
export const INK = "#4a3a30";

/* ------------------------------ headwear --------------------------- */

export function Headwear({ theme }: { theme: ThemeId }) {
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

/* -------------------------------- face ----------------------------- */

export function Eyes() {
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

export function Sunglasses() {
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

/** Cheeks and smile — the bit that makes it read as friendly rather than blank. */
export function FaceWarmth() {
  return (
    <>
      <ellipse cx="86" cy="106" rx="7" ry="4.6" fill="#f7a8b8" opacity="0.75" />
      <ellipse cx="136" cy="106" rx="7" ry="4.6" fill="#f7a8b8" opacity="0.75" />
      <path
        d="M102 108c4 5 12 5 16 0"
        stroke={INK}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </>
  );
}
