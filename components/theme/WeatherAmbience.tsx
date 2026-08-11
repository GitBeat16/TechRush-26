"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { breathe } from "@/lib/animations";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { THEMES } from "@/lib/theme/themes";

/* ------------------------------------------------------------------ */
/* Ambient weather layer                                               */
/*                                                                     */
/* Sits behind the whole app. Three soft breathing blobs are always     */
/* there — they just take their colour from the theme. On top of that,  */
/* each weather theme adds its own particle system, driven entirely by  */
/* CSS keyframes on transform/opacity so nothing hits the main thread.  */
/* ------------------------------------------------------------------ */

/**
 * Deterministic pseudo-random in [0, 1). Seeded rather than Math.random so
 * the same particle field is produced on every render, which keeps React
 * from tearing the layout apart when the theme changes.
 */
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

function field(count: number, seed: number, config: {
  size: [number, number];
  duration: [number, number];
  opacity: [number, number];
}): Particle[] {
  return Array.from({ length: count }, (_, index) => {
    const n = seed + index * 7;
    const [minSize, maxSize] = config.size;
    const [minDuration, maxDuration] = config.duration;
    const [minOpacity, maxOpacity] = config.opacity;

    const duration = minDuration + rand(n + 2) * (maxDuration - minDuration);

    return {
      left: rand(n) * 100,
      size: minSize + rand(n + 1) * (maxSize - minSize),
      duration,
      // Negative delay starts each particle mid-flight, so the field is
      // already full on the first frame instead of raining in from empty.
      delay: -rand(n + 3) * duration,
      opacity: minOpacity + rand(n + 4) * (maxOpacity - minOpacity),
      drift: (rand(n + 5) - 0.5) * 12,
    };
  });
}

interface Firefly {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  tier: "primary" | "medium" | "background";
  zone: "hero" | "bali" | "major" | "bg";
  yPath: number[];
  xPath: number[];
  opacityPath: number[];
}

const FIREFLIES: Firefly[] = [
  // =========================================================================
  // ZONE 1: PRIMARY HERO ZONE (9 Fireflies surrounding main hero card)
  // =========================================================================
  {
    // Upper-Left Hero Negative Space (25px above hero card)
    left: 5,
    top: 13,
    size: 7,
    duration: 6.8,
    delay: 0,
    tier: "primary",
    zone: "hero",
    yPath: [0, -18, 10, 0],
    xPath: [0, 12, -8, 0],
    opacityPath: [0.55, 1, 0.9, 0.55],
  },
  {
    // Upper-Middle Hero Gap (above headline)
    left: 46,
    top: 14,
    size: 6,
    duration: 7.4,
    delay: 0.8,
    tier: "primary",
    zone: "hero",
    yPath: [0, -14, 12, 0],
    xPath: [0, 8, -10, 0],
    opacityPath: [0.5, 0.98, 0.8, 0.5],
  },
  {
    // Upper-Right Sky (framing moon area without touching moon SVG)
    left: 78,
    top: 13,
    size: 9,
    duration: 8.2,
    delay: 2.2,
    tier: "primary",
    zone: "hero",
    yPath: [0, 16, -12, 0],
    xPath: [0, -10, 12, 0],
    opacityPath: [0.55, 1, 0.88, 0.55],
  },
  {
    // Outer Right Moon Gap
    left: 90,
    top: 22,
    size: 6,
    duration: 9.0,
    delay: 1.5,
    tier: "primary",
    zone: "hero",
    yPath: [0, -12, 14, 0],
    xPath: [0, 10, -8, 0],
    opacityPath: [0.5, 0.95, 0.75, 0.5],
  },
  {
    // Left-Middle Hero Outer Gap (outside left border)
    left: 4,
    top: 34,
    size: 5,
    duration: 9.6,
    delay: 0.4,
    tier: "medium",
    zone: "hero",
    yPath: [0, -12, 10, 0],
    xPath: [0, 8, -7, 0],
    opacityPath: [0.35, 0.88, 0.35],
  },
  {
    // Inner Left Hero Gap
    left: 20,
    top: 22,
    size: 5,
    duration: 8.6,
    delay: 2.5,
    tier: "medium",
    zone: "hero",
    yPath: [0, 10, -8, 0],
    xPath: [0, -6, 7, 0],
    opacityPath: [0.32, 0.85, 0.32],
  },
  {
    // Right-Middle Character Outer Circle Gap
    left: 94,
    top: 34,
    size: 6,
    duration: 7.8,
    delay: 1.9,
    tier: "medium",
    zone: "hero",
    yPath: [0, 8, -12, 0],
    xPath: [0, -8, 8, 0],
    opacityPath: [0.35, 0.88, 0.35],
  },
  {
    // Lower-Left Hero Corner Gap
    left: 7,
    top: 42,
    size: 5,
    duration: 10.2,
    delay: 1.1,
    tier: "medium",
    zone: "hero",
    yPath: [0, -10, 10, 0],
    xPath: [0, 7, -6, 0],
    opacityPath: [0.32, 0.84, 0.32],
  },
  {
    // Lower-Right Hero Corner Gap
    left: 88,
    top: 44,
    size: 6,
    duration: 8.4,
    delay: 3.0,
    tier: "medium",
    zone: "hero",
    yPath: [0, -14, 8, 0],
    xPath: [0, 9, -7, 0],
    opacityPath: [0.35, 0.88, 0.35],
  },

  // =========================================================================
  // ZONE 2: SECONDARY BALI RECOMMENDATION CARD ZONE (3 Fireflies)
  // =========================================================================
  {
    // Floating 20px Above Top-Left of Bali Card
    left: 24,
    top: 26,
    size: 7,
    duration: 7.2,
    delay: 1.4,
    tier: "primary",
    zone: "bali",
    yPath: [0, -15, 10, 0],
    xPath: [0, 10, -8, 0],
    opacityPath: [0.55, 0.98, 0.88, 0.55],
  },
  {
    // Floating 25px to the Right of Bali Card
    left: 38,
    top: 35,
    size: 7,
    duration: 6.4,
    delay: 0.2,
    tier: "primary",
    zone: "bali",
    yPath: [0, 12, -14, 0],
    xPath: [0, -8, 9, 0],
    opacityPath: [0.55, 1, 0.85, 0.55],
  },
  {
    // Floating 20px Below Bottom-Right of Bali Card
    left: 36,
    top: 45,
    size: 5,
    duration: 9.4,
    delay: 2.7,
    tier: "medium",
    zone: "bali",
    yPath: [0, -10, 12, 0],
    xPath: [0, 7, -7, 0],
    opacityPath: [0.35, 0.85, 0.35],
  },

  // =========================================================================
  // ZONE 3: TERTIARY MAJOR CARDS ZONE (4 Fireflies around Globe & Budget cards)
  // =========================================================================
  {
    // Top-Left Corner of Travel Globe Card
    left: 11,
    top: 49,
    size: 7,
    duration: 7.6,
    delay: 2.8,
    tier: "primary",
    zone: "major",
    yPath: [0, -14, 9, 0],
    xPath: [0, -9, 7, 0],
    opacityPath: [0.5, 0.96, 0.8, 0.5],
  },
  {
    // Top-Right Corner of Travel Globe Card
    left: 87,
    top: 51,
    size: 5,
    duration: 8.8,
    delay: 1.7,
    tier: "medium",
    zone: "major",
    yPath: [0, 9, -10, 0],
    xPath: [0, -7, 6, 0],
    opacityPath: [0.32, 0.85, 0.32],
  },
  {
    // Bottom-Left Side Gap of Globe Card
    left: 15,
    top: 67,
    size: 5,
    duration: 9.8,
    delay: 0.9,
    tier: "medium",
    zone: "major",
    yPath: [0, -11, 8, 0],
    xPath: [0, 8, -6, 0],
    opacityPath: [0.35, 0.84, 0.35],
  },
  {
    // Top-Right Corner of Lower Budget / Destination Cards
    left: 85,
    top: 79,
    size: 5,
    duration: 10.5,
    delay: 2.1,
    tier: "medium",
    zone: "major",
    yPath: [0, -8, 10, 0],
    xPath: [0, 6, -6, 0],
    opacityPath: [0.32, 0.82, 0.32],
  },

  // =========================================================================
  // ZONE 4: BACKGROUND DEPTH ZONE (4 Fireflies ambient distant layer)
  // =========================================================================
  {
    left: 5,
    top: 27,
    size: 4,
    duration: 12.4,
    delay: 0.6,
    tier: "background",
    zone: "bg",
    yPath: [0, -6, 6, 0],
    xPath: [0, 5, -5, 0],
    opacityPath: [0.2, 0.65, 0.2],
  },
  {
    left: 45,
    top: 57,
    size: 4,
    duration: 11.2,
    delay: 1.8,
    tier: "background",
    zone: "bg",
    yPath: [0, 7, -6, 0],
    xPath: [0, -4, 4, 0],
    opacityPath: [0.22, 0.68, 0.22],
  },
  {
    left: 52,
    top: 77,
    size: 4,
    duration: 10.8,
    delay: 1.0,
    tier: "background",
    zone: "bg",
    yPath: [0, -6, 7, 0],
    xPath: [0, 5, -5, 0],
    opacityPath: [0.2, 0.62, 0.2],
  },
  {
    left: 95,
    top: 71,
    size: 3,
    duration: 13.8,
    delay: 3.6,
    tier: "background",
    zone: "bg",
    yPath: [0, 6, -5, 0],
    xPath: [0, -4, 4, 0],
    opacityPath: [0.18, 0.58, 0.18],
  },
];

function DarkFireflies() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {FIREFLIES.map((fly, idx) => (
        <motion.span
          key={idx}
          className={`absolute rounded-full ${
            fly.tier === "primary"
              ? "bg-[#FFF8EA] shadow-[0_0_12px_rgba(255,248,234,0.98)]"
              : fly.tier === "medium"
                ? "bg-[#F4E8C8] shadow-[0_0_8px_rgba(244,232,200,0.8)]"
                : "bg-[#E8DAB8] shadow-[0_0_5px_rgba(232,218,184,0.5)]"
          }`}
          style={{
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            width: fly.size,
            height: fly.size,
          }}
          animate={{
            y: fly.yPath,
            x: fly.xPath,
            opacity: fly.opacityPath,
            scale:
              fly.tier === "primary"
                ? [1, 1.35, 1.15, 1]
                : fly.tier === "medium"
                  ? [1, 1.2, 1]
                  : [1, 1.1, 1],
          }}
          transition={{
            duration: fly.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: fly.delay,
          }}
        />
      ))}
    </div>
  );
}

export function WeatherAmbience() {
  const { theme, mode } = useTheme();
  const ambience = THEMES[theme].ambience;
  const isDark = theme === "clay" && mode === "dark";

  const flakes = useMemo(
    () =>
      field(46, 11, {
        size: [3, 9],
        duration: [9, 20],
        opacity: [0.45, 0.95],
      }),
    [],
  );

  const drops = useMemo(
    () =>
      field(58, 29, {
        size: [34, 92],
        duration: [0.8, 1.9],
        opacity: [0.18, 0.5],
      }),
    [],
  );

  const motes = useMemo(
    () =>
      field(22, 53, {
        size: [3, 8],
        duration: [5, 12],
        opacity: [0.3, 0.7],
      }),
    [],
  );

  const ripples = useMemo(
    () =>
      field(7, 71, {
        size: [40, 110],
        duration: [3.4, 6],
        opacity: [0.2, 0.4],
      }),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* --------------------------------------------- dark mode fireflies */}
      {isDark && <DarkFireflies />}

      {/* --------------------------------------------- base clay blobs */}
      {!isDark && (
        <>
          <motion.div
            {...breathe(1.1, 14)}
            className="absolute -left-40 top-24 h-[26rem] w-[26rem] rounded-full opacity-35 blur-3xl transition-colors duration-700"
            style={{ backgroundColor: "var(--clay-amb-1)" }}
          />
          <motion.div
            {...breathe(1.08, 17, 2)}
            className="absolute -right-32 top-[38%] h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl transition-colors duration-700"
            style={{ backgroundColor: "var(--clay-amb-2)" }}
          />
          <motion.div
            {...breathe(1.12, 19, 4)}
            className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full opacity-30 blur-3xl transition-colors duration-700"
            style={{ backgroundColor: "var(--clay-amb-3)" }}
          />
        </>
      )}

      {/* --------------------------------------------- hot and sunny */}
      {ambience === "sun" && (
        <>
          {/* A slow conic sweep from off-canvas top-right, doing the work of
              a sun without ever drawing one. */}
          <div className="clay-rays absolute -right-[45vw] -top-[55vh] h-[150vh] w-[150vh] opacity-45" />

          <motion.div
            {...breathe(1.14, 8)}
            className="absolute -right-24 -top-24 h-[24rem] w-[24rem] rounded-full opacity-55 blur-[70px]"
            style={{ backgroundColor: "var(--color-clay-butter)" }}
          />

          <div
            className="absolute inset-0"
            style={{ ["--clay-precip" as string]: "var(--color-clay-butter)" }}
          >
            {motes.map((mote, index) => (
              <span
                key={index}
                className="clay-mote"
                style={{
                  left: `${mote.left}%`,
                  top: `${(rand(index * 3.7) * 85 + 5).toFixed(2)}%`,
                  width: mote.size,
                  height: mote.size,
                  opacity: mote.opacity,
                  animationDuration: `${mote.duration}s`,
                  animationDelay: `${mote.delay}s`,
                }}
              />
            ))}
          </div>

          {/* Warm haze pooling at the bottom of the viewport. */}
          <div
            className="absolute inset-x-0 bottom-0 h-52 opacity-40"
            style={{
              background:
                "linear-gradient(to top, var(--color-clay-peach), transparent)",
            }}
          />
        </>
      )}

      {/* --------------------------------------------- cold and snowy */}
      {ambience === "snow" && (
        <>
          {flakes.map((flake, index) => (
            <span
              key={index}
              className="clay-flake"
              style={{
                left: `${flake.left}%`,
                width: flake.size,
                height: flake.size,
                animationDuration: `${flake.duration}s`,
                animationDelay: `${flake.delay}s`,
                ["--flake-opacity" as string]: flake.opacity,
                ["--flake-drift" as string]: `${flake.drift}vw`,
              }}
            />
          ))}

          {/* Drift piling up along the bottom edge. */}
          <div
            className="absolute inset-x-0 bottom-0 h-40 opacity-70"
            style={{
              background:
                "linear-gradient(to top, var(--color-clay-raised), transparent)",
            }}
          />
        </>
      )}

      {/* --------------------------------------------- cool and rainy */}
      {ambience === "rain" && (
        <>
          {drops.map((drop, index) => (
            <span
              key={index}
              className="clay-drop"
              style={{
                left: `${drop.left}%`,
                height: drop.size,
                animationDuration: `${drop.duration}s`,
                animationDelay: `${drop.delay}s`,
                ["--drop-opacity" as string]: drop.opacity,
              }}
            />
          ))}

          {ripples.map((ripple, index) => (
            <span
              key={index}
              className="clay-ripple"
              style={{
                left: `${ripple.left}%`,
                bottom: `${(rand(index * 5.1) * 22).toFixed(2)}%`,
                width: ripple.size,
                height: ripple.size * 0.34,
                animationDuration: `${ripple.duration}s`,
                animationDelay: `${ripple.delay}s`,
              }}
            />
          ))}

          {/* Low cloud cover across the top. */}
          <div
            className="absolute inset-x-0 top-0 h-64 opacity-45"
            style={{
              background:
                "linear-gradient(to bottom, var(--color-clay-sky), transparent)",
            }}
          />
        </>
      )}
    </div>
  );
}
