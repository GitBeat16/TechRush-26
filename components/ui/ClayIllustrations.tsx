"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { springSoft } from "@/lib/animations";
import { shade } from "@/lib/tones";

/* ------------------------------------------------------------------ */
/* Hand-modelled clay objects. Depth comes from stacked shapes and soft */
/* highlights rather than heavy gradients.                              */
/* ------------------------------------------------------------------ */

interface ArtProps {
  size?: number;
  className?: string;
}

/** Reusable soft top-light highlight for any clay body. */
function Highlight({
  cx,
  cy,
  rx,
  ry,
  opacity = 0.5,
  rotate = 0,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity?: number;
  rotate?: number;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#ffffff"
      opacity={opacity}
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  );
}

/**
 * 3D clay suitcase. `fill` (0-1) raises a pastel level inside the body,
 * which the packing checklist animates as items fly in.
 */
export function ClaySuitcase({
  size = 180,
  fill,
  className = "",
  base = "#f9b384",
}: ArtProps & { fill?: number; base?: string }) {
  const uid = useId().replace(/:/g, "");
  const clipId = `case-clip-${uid}`;
  const dark = shade(base, -0.22);
  const light = shade(base, 0.28);
  const level = fill === undefined ? undefined : Math.min(1, Math.max(0, fill));

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="30" y="62" width="140" height="106" rx="28" />
        </clipPath>
      </defs>

      {/* contact shadow */}
      <ellipse cx="100" cy="176" rx="66" ry="11" fill="#a07e64" opacity="0.28" />

      {/* handle */}
      <path
        d="M76 62V50a24 24 0 0 1 48 0v12"
        stroke={dark}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M78 60V50a22 22 0 0 1 44 0v10"
        stroke={light}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* body */}
      <rect x="30" y="62" width="140" height="106" rx="28" fill={base} />

      {/* animated fill level */}
      {level !== undefined && (
        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x="30"
            width="140"
            fill={shade(base, -0.12)}
            initial={false}
            animate={{ y: 168 - 106 * level, height: 106 * level }}
            transition={springSoft}
          />
          <motion.ellipse
            rx="70"
            ry="7"
            fill={shade(base, 0.12)}
            cx="100"
            initial={false}
            animate={{ cy: 168 - 106 * level }}
            transition={springSoft}
          />
        </g>
      )}

      {/* inner rim shading */}
      <rect
        x="30"
        y="62"
        width="140"
        height="106"
        rx="28"
        stroke={dark}
        strokeOpacity="0.35"
        strokeWidth="4"
      />
      {/* belt */}
      <rect x="30" y="100" width="140" height="18" rx="9" fill={dark} opacity="0.55" />
      <rect x="88" y="94" width="24" height="30" rx="9" fill={light} />
      <rect x="94" y="104" width="12" height="9" rx="4.5" fill={dark} opacity="0.65" />

      {/* clay highlight */}
      <Highlight cx={62} cy={82} rx={22} ry={9} opacity={0.45} rotate={-16} />
      <Highlight cx={150} cy={150} rx={12} ry={5} opacity={0.22} rotate={-16} />

      {/* feet */}
      <rect x="46" y="166" width="26" height="10" rx="5" fill={dark} opacity="0.7" />
      <rect x="128" y="166" width="26" height="10" rx="5" fill={dark} opacity="0.7" />
    </svg>
  );
}

/** Chubby paper plane used in the logo and floating in the hero. */
export function ClayPlane({
  size = 120,
  className = "",
  base = "#8fb6ee",
}: ArtProps & { base?: string }) {
  const dark = shade(base, -0.25);
  const light = shade(base, 0.35);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M18 58 96 24c5-2 10 3 8 8L74 100c-2 5-9 5-11 0l-9-24-24-9c-5-2-6-7-12-9Z"
        fill={base}
      />
      <path d="M54 76 96 24 30 67l24 9Z" fill={light} opacity="0.85" />
      <path d="m54 76 9 24 11-52-20 28Z" fill={dark} opacity="0.55" />
      <ellipse cx="46" cy="60" rx="14" ry="5" fill="#fff" opacity="0.5" transform="rotate(-26 46 60)" />
    </svg>
  );
}

/** Puffy clay cloud. */
export function ClayCloud({
  size = 120,
  className = "",
  base = "#ffffff",
  opacity = 1,
}: ArtProps & { base?: string; opacity?: number }) {
  const dark = shade(base, -0.12);
  return (
    <svg
      width={size}
      height={size * 0.62}
      viewBox="0 0 120 74"
      fill="none"
      className={className}
      aria-hidden="true"
      opacity={opacity}
    >
      <path
        d="M31 68a22 22 0 0 1-3-43.7 27 27 0 0 1 51.4 5.4A20 20 0 0 1 92 68Z"
        fill={base}
      />
      <path
        d="M31 68a22 22 0 0 1-3-43.7c-1 3.3.4 7 3 9-6 6-6 16 0 22 5 5 13 5 19 1-3 5-11 12-19 11.7Z"
        fill={dark}
        opacity="0.35"
      />
      <ellipse cx="52" cy="30" rx="18" ry="7" fill="#fff" opacity="0.75" />
    </svg>
  );
}

/** Soft clay globe with a pastel landmass. */
export function ClayGlobe({
  size = 120,
  className = "",
  base = "#8fb6ee",
}: ArtProps & { base?: string }) {
  const land = shade(base, 0.45);
  const dark = shade(base, -0.28);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="60" cy="110" rx="38" ry="7" fill="#a07e64" opacity="0.25" />
      <circle cx="60" cy="58" r="46" fill={base} />
      <path
        d="M30 40c8-4 14 2 22 0s10-8 18-6 12 10 8 16-16 4-20 10 2 14-6 18-18-2-20-10 0-24-2-28Z"
        fill={land}
        opacity="0.9"
      />
      <path
        d="M60 104a46 46 0 0 0 44-32 46 46 0 0 1-72 26c8 4 18 6 28 6Z"
        fill={dark}
        opacity="0.35"
      />
      <ellipse cx="42" cy="34" rx="16" ry="9" fill="#fff" opacity="0.5" transform="rotate(-30 42 34)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Destination art placeholders — swap for photography later.          */
/* ------------------------------------------------------------------ */

export type SceneKind = "torii" | "palm" | "alps" | "aurora" | "bay" | "coast";

export function ClayScene({
  kind,
  base,
  className = "",
}: {
  kind: SceneKind;
  base: string;
  className?: string;
}) {
  const sky = shade(base, 0.35);
  const mid = shade(base, -0.1);
  const deep = shade(base, -0.32);
  const sun = "#ffe8a3";

  return (
    <svg
      viewBox="0 0 240 150"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="240" height="150" fill={sky} />
      <circle cx="188" cy="40" r="20" fill={sun} opacity="0.9" />

      {kind === "torii" && (
        <>
          <path d="M0 118c30-16 54 6 84-4s52-26 82-16 44 22 74 14v38H0z" fill={mid} />
          <rect x="66" y="62" width="108" height="10" rx="5" fill={deep} />
          <rect x="72" y="76" width="96" height="8" rx="4" fill={deep} />
          <rect x="80" y="76" width="13" height="60" rx="6" fill={deep} />
          <rect x="147" y="76" width="13" height="60" rx="6" fill={deep} />
          <ellipse cx="120" cy="140" rx="120" ry="14" fill={deep} opacity="0.5" />
        </>
      )}

      {kind === "palm" && (
        <>
          <path d="M0 104c40 10 80-8 120-6s80 20 120 8v44H0z" fill={mid} />
          <rect x="150" y="60" width="12" height="60" rx="6" fill={deep} />
          <path
            d="M156 62c-16-14-34-14-44-4 14-4 28-2 38 8Zm0 0c16-14 34-14 44-4-14-4-28-2-38 8Zm0-2c-4-18-16-28-30-28 12 8 20 18 24 30Zm0 0c4-18 16-28 30-28-12 8-20 18-24 30Z"
            fill={deep}
          />
          <circle cx="150" cy="60" r="7" fill={sun} />
          <ellipse cx="60" cy="132" rx="46" ry="10" fill={deep} opacity="0.35" />
        </>
      )}

      {kind === "alps" && (
        <>
          <path d="M-10 132 62 52l40 46 30-30 66 64z" fill={mid} />
          <path d="M62 52 40 76c12 6 22 4 30-4 6 6 14 8 22 4z" fill="#ffffff" opacity="0.9" />
          <path d="m132 68-12 12c8 4 14 3 18-2 4 4 8 5 12 3z" fill="#ffffff" opacity="0.9" />
          <path d="M0 128c40-6 60 8 100 6s90-14 140-4v20H0z" fill={deep} />
        </>
      )}

      {kind === "aurora" && (
        <>
          <path
            d="M-4 46c40 22 74-14 116-4s70 30 132 6"
            stroke={shade(base, -0.05)}
            strokeWidth="16"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M-4 72c46 18 78-16 120-6s64 26 128 4"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path d="M-10 136 50 92l44 30 40-24 116 38z" fill={deep} />
          <path d="M0 128c50-4 70 10 110 8s84-10 130-2v16H0z" fill={mid} />
        </>
      )}

      {kind === "bay" && (
        <>
          <path d="M0 110h240v40H0z" fill={mid} />
          <path d="M40 110c0-26 10-44 22-44s22 18 22 44z" fill={deep} />
          <path d="M120 110c0-34 12-56 26-56s26 22 26 56z" fill={deep} opacity="0.85" />
          <path d="M186 110c0-20 8-34 16-34s16 14 16 34z" fill={deep} opacity="0.7" />
          <path d="M0 126c26 8 52-6 78 0s52 12 78 4 56-6 84 2v18H0z" fill={shade(base, -0.45)} opacity="0.5" />
        </>
      )}

      {kind === "coast" && (
        <>
          <path d="M0 116h240v34H0z" fill={shade(base, -0.4)} opacity="0.6" />
          <path d="M0 118c50-38 96-42 140-14 26 16 54 18 100 2v44H0z" fill={mid} />
          <rect x="42" y="76" width="26" height="34" rx="8" fill={deep} />
          <rect x="76" y="62" width="22" height="48" rx="8" fill={deep} opacity="0.9" />
          <rect x="106" y="82" width="24" height="28" rx="8" fill={deep} opacity="0.8" />
          <path d="M42 76l13-14 13 14zM76 62l11-12 11 12z" fill={shade(base, -0.5)} />
        </>
      )}

      {/* soft clay vignette so the art reads as a moulded tile */}
      <rect
        width="240"
        height="150"
        fill="none"
        stroke={deep}
        strokeOpacity="0.18"
        strokeWidth="6"
      />
    </svg>
  );
}

export const SCENE_BY_ID: Record<string, SceneKind> = {
  japan: "torii",
  bali: "palm",
  switzerland: "alps",
  iceland: "aurora",
  vietnam: "bay",
  portugal: "coast",
};
