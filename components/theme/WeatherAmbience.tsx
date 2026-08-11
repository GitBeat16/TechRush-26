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

export function WeatherAmbience() {
  const { theme } = useTheme();
  const ambience = THEMES[theme].ambience;

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
      {/* --------------------------------------------- base clay blobs */}
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
