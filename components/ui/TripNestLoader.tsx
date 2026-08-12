"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { feedback, whenAudible } from "@/lib/feedback";

/* ------------------------------------------------------------------
   TripNest loader

   A little storybook aeroplane drifts in from one corner of the sky and out
   the other, trailing a dashed route behind it, forever.

   The whole scene is driven by a single linear "clock" motion value that
   runs 0 → 1 forever. Everything else — position, heading, float, propeller,
   trail — is a `useTransform` of that clock, so the loop never re-renders
   React and every animated property stays on the compositor (transform and
   opacity only).

   The flight path is a real <path>: we sample it once with getPointAtLength,
   which gives arc-length-accurate positions *and* the tangent angle, so the
   aeroplane banks into its own curve instead of following hand-tuned
   keyframes. The dashed trail is the same `d`.

   The loop is seamless for three reasons: the path starts and ends well
   outside the frame, so there is nothing on screen at the wrap; the
   propeller and the float run an integer number of cycles per pass; and the
   trail fades out before it resets.

   Two scenes share all of this. `TripNestSky` fills the viewport and flies
   corner to corner — that is the one you want behind a splash screen.
   `TripNestLoader` is the compact card version for inline loading states.
------------------------------------------------------------------ */

/** Storybook illustration palette. Deliberately fixed rather than themed —
    this is a drawn asset, like a mascot, and it should look the same on
    every weather theme. */
const ART = {
  cream: "#f7efd9",
  creamShade: "#e7dab9",
  lattice: "#aebdd2",
  forest: "#3f6b3a",
  forestDark: "#335630",
  sage: "#6f9d64",
  sageShade: "#5c8553",
  navy: "#23357e",
  navySoft: "#5a6cb8",
  blush: "#f4a7b6",
  blushLight: "#f9c6d0",
  star: "#f2c744",
  trail: "#b28e5d",
  bird: "#7aa25c",
  cloud: "#fdf7e8",
} as const;

const DEFAULT_LOOP_SECONDS = 7.5;
/** Integer cycles per pass, so these oscillations match across the seam. */
const FLOAT_CYCLES = 3;
/* Slow on purpose. A realistic propeller speed lands near half the screen
   refresh rate, and the blades then strobe instead of spinning — the disc
   behind them is what actually sells the motion. */
const PROP_REVOLUTIONS = 6;
const SAMPLES = 64;

/** Clock position used for the static reduced-motion pose. */
const RESTING = 0.5;

type Samples = { t: number[]; x: number[]; y: number[]; a: number[] };
type CloudSpec = { x: number; y: number; scale: number; opacity: number; duration: number; delay: number };
type BirdSpec = { x: number; y: number; scale: number; phase: number };

type Scene = {
  viewBox: string;
  route: string;
  /** Aeroplane scale at the start, middle and end of the pass. */
  scale: [number, number, number];
  /** Position and heading at each end of the route, for the first frame. */
  fallback: Samples;
  /** How far clouds travel, in viewBox units: [start, end]. */
  drift: [number, number];
  clouds: CloudSpec[];
  birds: BirdSpec[];
};

/* Full-bleed: in low on the left, dipping under the wordmark along the
   bottom, then climbing away through the top-right corner. It bows around
   the middle of the screen deliberately, so it never crosses the title.
   Both ends sit well outside the frame. */
const SKY_SCENE: Scene = {
  viewBox: "0 0 1200 700",
  route:
    "M -240 430 C 60 640 340 736 620 704 C 862 676 1020 522 1142 300 C 1222 154 1284 56 1380 -60",
  scale: [1.75, 2.1, 1.75],
  fallback: { t: [0, 1], x: [-240, 1380], y: [430, -60], a: [24, -50] },
  drift: [1320, -420],
  clouds: [
    { x: 120, y: 120, scale: 2.6, opacity: 0.85, duration: 46, delay: 0 },
    { x: 0, y: 380, scale: 3.6, opacity: 1, duration: 34, delay: 11 },
    { x: 0, y: 610, scale: 2, opacity: 0.7, duration: 54, delay: 24 },
    { x: 0, y: 250, scale: 1.5, opacity: 0.6, duration: 62, delay: 38 },
  ],
  birds: [
    { x: 250, y: 180, scale: 2.4, phase: 0 },
    { x: 880, y: 470, scale: 1.9, phase: 0.35 },
    { x: 1010, y: 130, scale: 2.1, phase: 0.7 },
  ],
};

/* Compact: a gentle wave across a card. */
const CARD_SCENE: Scene = {
  viewBox: "0 0 360 120",
  route: "M -84 66 C 10 42 52 46 120 62 C 180 76 222 78 282 60 C 340 43 380 42 444 54",
  scale: [0.68, 0.74, 0.68],
  fallback: { t: [0, 1], x: [-84, 444], y: [66, 54], a: [-14, 8] },
  drift: [380, -180],
  clouds: [
    { x: 22, y: 14, scale: 0.66, opacity: 0.85, duration: 32, delay: 0 },
    { x: 0, y: 72, scale: 1, opacity: 1, duration: 24, delay: 8 },
    { x: 0, y: 40, scale: 0.54, opacity: 0.7, duration: 38, delay: 16 },
  ],
  birds: [
    { x: 92, y: 22, scale: 0.9, phase: 0 },
    { x: 232, y: 14, scale: 0.7, phase: 0.35 },
    { x: 318, y: 94, scale: 0.8, phase: 0.7 },
  ],
};

const SIZES = {
  sm: "max-w-[224px]",
  md: "max-w-[336px]",
  lg: "max-w-[432px]",
} as const;

/** Five-pointed storybook star, used on the wings. */
function star(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? r * 0.44 : r;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(
      `${(cx + Math.cos(angle) * radius).toFixed(1)} ${(cy + Math.sin(angle) * radius).toFixed(1)}`,
    );
  }
  return `M ${points.join(" L ")} Z`;
}

/* ------------------------------------------------------------------ */
/* The flight itself — one clock, everything else derived from it.     */
/* ------------------------------------------------------------------ */

function useFlight(scene: Scene, loopSeconds: number) {
  const reduced = useReducedMotion();
  const routeRef = useRef<SVGPathElement>(null);
  const [samples, setSamples] = useState<Samples>(scene.fallback);

  /* Measure the route once. getPointAtLength is arc-length parameterised,
     so an evenly spaced sample set gives an evenly paced flight. */
  useEffect(() => {
    const path = routeRef.current;
    if (!path || typeof path.getTotalLength !== "function") return;

    const length = path.getTotalLength();
    if (!length) return;

    const t: number[] = [];
    const x: number[] = [];
    const y: number[] = [];
    const a: number[] = [];

    for (let i = 0; i < SAMPLES; i += 1) {
      const u = i / (SAMPLES - 1);
      const at = u * length;
      const point = path.getPointAtLength(at);
      // Neighbours a hair either side give the tangent — i.e. the heading.
      const ahead = path.getPointAtLength(Math.min(length, at + length * 0.004));
      const behind = path.getPointAtLength(Math.max(0, at - length * 0.004));

      t.push(u);
      x.push(point.x);
      y.push(point.y);
      a.push((Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI);
    }

    setSamples({ t, x, y, a });
  }, []);

  const clock = useMotionValue(0);

  useEffect(() => {
    if (reduced) {
      clock.set(RESTING);
      return;
    }

    clock.set(0);
    const controls = animate(clock, 1, {
      duration: loopSeconds,
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [clock, reduced, loopSeconds]);

  const x = useTransform(clock, samples.t, samples.x);
  const pathY = useTransform(clock, samples.t, samples.y);
  const heading = useTransform(clock, samples.t, samples.a);

  /* Banks into the curve, but softly: the tangent is damped and capped so
     the aeroplane stays level enough to read at any size. */
  const rotate = useTransform([heading, clock], ([h, c]: number[]) => {
    const banked = Math.max(-18, Math.min(18, h * 0.7));
    return banked + Math.sin(c * Math.PI * 2 * FLOAT_CYCLES) * 1.5;
  });

  /* Idle float, so it never feels like a sprite on rails. */
  const y = useTransform(
    [clock, pathY],
    ([c, base]: number[]) => base + Math.sin(c * Math.PI * 2 * FLOAT_CYCLES) * 2.4,
  );

  const scale = useTransform(clock, [0, 0.5, 1], scene.scale);
  const propSpin = useTransform(clock, (c: number) => c * 360 * PROP_REVOLUTIONS);

  return { clock, routeRef, x, y, rotate, scale, propSpin };
}

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

function Sky({
  scene,
  loopSeconds,
  className = "",
  preserve = "xMidYMid meet",
}: {
  scene: Scene;
  loopSeconds: number;
  className?: string;
  preserve?: string;
}) {
  // Ids must be unique — the loader can be on screen twice. The colons React
  // puts in useId() are legal in an id but awkward in a url() reference.
  const uid = useId().replace(/:/g, "");
  const clipId = `tripnest-body-${uid}`;
  const maskId = `tripnest-trail-${uid}`;
  const { clock, routeRef, x, y, rotate, scale, propSpin } = useFlight(
    scene,
    loopSeconds,
  );

  const dash = scene.scale[1];
  /* The trail is revealed by a mask whose edge is driven by the aeroplane's
     own `x` — literally the same motion value — so the dashes can only ever
     appear behind it. The edge sits a little back, so they emerge from under
     the tail rather than the nose. */
  const revealX = useTransform(x, (v: number) => v - dash * 34);
  /* And once laid down they drift slowly backwards, like the trail
     dissipating. Four whole dash periods per pass, so the pattern lands
     exactly where it started at the wrap. */
  const dashDrift = useTransform(clock, (c: number) => c * dash * 16 * 4);
  const trailOpacity = useTransform(clock, [0, 0.06, 0.86, 0.97], [0, 0.34, 0.34, 0]);

  return (
    <svg
      viewBox={scene.viewBox}
      preserveAspectRatio={preserve}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {scene.clouds.map((cloud) => (
        <Cloud key={`${cloud.x}-${cloud.y}`} {...cloud} drift={scene.drift} />
      ))}
      {scene.birds.map((bird) => (
        <Birds key={`${bird.x}-${bird.y}`} clock={clock} {...bird} />
      ))}

      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-6000} y={-6000} width={12000} height={12000}>
          <motion.rect
            x={-8000}
            y={-6000}
            width={8000}
            height={12000}
            fill="#fff"
            style={{ x: revealX }}
          />
        </mask>
      </defs>

      {/* The dashed route — the exact path the aeroplane flies. `routeRef`
          measures this same element, so the two cannot disagree. */}
      <motion.path
        ref={routeRef}
        d={scene.route}
        stroke={ART.trail}
        strokeWidth={dash * 3}
        strokeDasharray={`${dash * 7} ${dash * 9}`}
        strokeLinecap="round"
        fill="none"
        mask={`url(#${maskId})`}
        style={{ opacity: trailOpacity, strokeDashoffset: dashDrift }}
      />

      <motion.g style={{ x, y }}>
        {/* No transform-box override here on purpose: Motion measures the
            artwork and pivots around its own centre. Forcing a view-box
            origin pivots around the top-left of the whole scene instead,
            which swings the aeroplane clean off its flight path. */}
        <motion.g style={{ rotate, scale }}>
          <Plane clipId={clipId} propSpin={propSpin} />
        </motion.g>
      </motion.g>
    </svg>
  );
}

/**
 * The full-viewport sky: the aeroplane climbs from the bottom-left corner of
 * the device to the top-right and off the edge. Absolutely positioned and
 * pointer-transparent, so it sits behind whatever text you put on top.
 */
export function TripNestSky({
  loopSeconds = DEFAULT_LOOP_SECONDS,
  className = "",
}: {
  loopSeconds?: number;
  className?: string;
}) {
  return (
    <Sky
      scene={SKY_SCENE}
      loopSeconds={loopSeconds}
      preserve="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}

export interface TripNestLoaderProps {
  /** Primary line under the animation. */
  label?: string;
  /** Optional second line. Hidden at size="sm". */
  sublabel?: string;
  /** Fill the viewport and fly corner to corner instead of across a card. */
  fullScreen?: boolean;
  size?: keyof typeof SIZES;
  /** Seconds for one pass across the sky. */
  loopSeconds?: number;
  /**
   * Whoosh in, propeller out. For splash screens — and worth setting even
   * though the intro overlay also asks for it, because the shell's splash is
   * often the first one that can *actually* be heard: it follows a click.
   */
  sound?: boolean;
  className?: string;
}

/** The shell's splash is brief, so its flight is brief to match. */
const SPLASH_FLIGHT_SECONDS = 1;

export function TripNestLoader({
  label = "Getting things ready",
  sublabel,
  fullScreen = false,
  size = "md",
  loopSeconds = DEFAULT_LOOP_SECONDS,
  sound = false,
  className = "",
}: TripNestLoaderProps) {
  useFlightSound(sound, SPLASH_FLIGHT_SECONDS);
  const caption = <Caption label={label} sublabel={sublabel} size={size} />;

  if (fullScreen) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`relative min-h-screen w-full overflow-hidden ${className}`}
      >
        <TripNestSky loopSeconds={loopSeconds} />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
          {caption}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex w-full flex-col items-center justify-center gap-3 ${className}`}
    >
      <Sky
        scene={CARD_SCENE}
        loopSeconds={loopSeconds}
        className={`h-auto w-full ${SIZES[size]}`}
      />
      {caption}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sound                                                               */
/*                                                                     */
/* The flight, scored: a whoosh of air as the aeroplane sweeps in, and */
/* the propeller chopping as it climbs out of the far corner. The two  */
/* are scheduled as a pair against the length of the pass, so the      */
/* blades always land just before the screen leaves rather than at     */
/* some fixed offset that may or may not still be on screen.           */
/*                                                                     */
/* Everything here is subject to autoplay policy: a browser will not   */
/* make a sound until the visitor has interacted with the page, and    */
/* the intro is precisely the moment we have not. So it waits for the  */
/* first gesture, recomputes what is left of the flight, and plays the */
/* remainder — or drops it, if the screen is nearly gone.              */
/* ------------------------------------------------------------------ */

/** Blades in this long before the end, so they finish as it fades. */
const PROPELLER_LEAD = 0.62;
/** Below this there is not enough runway left to be worth starting. */
const MIN_RUNWAY = 0.7;

/** Once per page load — the splash can mount twice under strict mode. */
let flightPlayed = false;

/**
 * Score a flight of `durationSeconds`. Call from whatever is showing the sky.
 */
export function useFlightSound(enabled: boolean, durationSeconds: number) {
  useEffect(() => {
    if (!enabled || flightPlayed) return;

    const startedAt = performance.now();

    const cancelIfUnheard = whenAudible(() => {
      // Two sky screens can be queued at once — the intro overlay sits on top
      // of the shell's own splash on a cold load. First one to be heard wins.
      if (flightPlayed) return;

      /* Audio may unlock part-way through — the visitor clicked two seconds
         into the intro — so the pair is timed against what is actually left
         of the flight, not against when it began. */
      const remaining =
        durationSeconds - (performance.now() - startedAt) / 1000;
      if (remaining < MIN_RUNWAY) return;

      flightPlayed = true;
      feedback("takeoff");
      // Scheduled on the audio clock, not a timer, so the handoff is exact.
      feedback("propeller", Math.max(remaining - PROPELLER_LEAD, 0.34));
    });

    return cancelIfUnheard;
  }, [enabled, durationSeconds]);
}

function Caption({
  label,
  sublabel,
  size,
}: {
  label: string;
  sublabel?: string;
  size: keyof typeof SIZES;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      {/* Label and dots share a line, so the caption reads as one thought
          rather than three stacked fragments. */}
      <p className="flex items-center gap-2.5 font-title text-sm text-clay-ink-soft sm:text-base">
        {label}
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              animate={reduced ? undefined : { scale: [1, 0.5, 1], opacity: [1, 0.3, 1] }}
              transition={{
                type: "tween",
                duration: 1.3,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut",
              }}
              className="h-1.5 w-1.5 rounded-full bg-clay-muted"
            />
          ))}
        </span>
      </p>
      {sublabel && size !== "sm" && (
        <p className="font-body text-xs text-clay-muted">{sublabel}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

function Plane({
  clipId,
  propSpin,
}: {
  clipId: string;
  propSpin: MotionValue<number>;
}) {
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d="M29 -1 C 27 -7 19 -11 5 -12 C -9 -13 -21 -10 -26 -6 C -29 -4 -29 4 -26 6 C -20 9 -8 11 5 10 C 19 9 27 4 29 1 C 30.2 0.4 30.2 -0.4 29 -1 Z" />
        </clipPath>
      </defs>

      {/* top wing */}
      <path
        d="M-13 -8 C -17 -16 -20 -27 -17 -33 C -14 -38 -6 -37 -4 -31 C -2 -24 -3 -14 -3 -7 Z"
        fill={ART.forest}
      />
      <path
        d="M-13 -8 C -16 -15 -19 -25 -17.5 -31 C -16 -34 -13 -35 -11 -34 C -13 -28 -12 -16 -9 -7 Z"
        fill={ART.forestDark}
        fillOpacity={0.45}
      />
      <path d={star(-10.5, -24, 4.2)} fill={ART.star} />

      {/* tail */}
      <path
        d="M-24 -1 C -30 -5 -37 -5 -40 -3 C -43 -1 -43 3 -40 4 C -36 6 -29 5 -24 4 Z"
        fill={ART.blush}
      />
      <path
        d="M-38 -2 C -35 -2.6 -31 -2.4 -28 -1.6 C -31 -1.2 -35 -1 -38 -0.4 Z"
        fill={ART.blushLight}
      />

      {/* undercarriage */}
      <g stroke={ART.navy} strokeWidth={1.4} strokeLinecap="round">
        <line x1={11} y1={8} x2={11} y2={13} />
        <line x1={-9} y1={8} x2={-9} y2={13} />
      </g>
      {[11, -9].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={15} r={3.4} fill={ART.navy} />
          <circle cx={wx} cy={15} r={1.3} fill={ART.navySoft} />
        </g>
      ))}

      {/* cream body */}
      <path
        d="M29 -1 C 27 -7 19 -11 5 -12 C -9 -13 -21 -10 -26 -6 C -29 -4 -29 4 -26 6 C -20 9 -8 11 5 10 C 19 9 27 4 29 1 C 30.2 0.4 30.2 -0.4 29 -1 Z"
        fill={ART.cream}
      />
      {/* lattice underbelly, clipped to the fuselage */}
      <g clipPath={`url(#${clipId})`}>
        <g stroke={ART.lattice} strokeWidth={0.7} strokeOpacity={0.8}>
          {Array.from({ length: 16 }, (_, i) => -26 + i * 4).map((lx) => (
            <line key={`v${lx}`} x1={lx} y1={0} x2={lx - 3} y2={12} />
          ))}
          {[1, 4, 7, 10].map((ly) => (
            <line key={`h${ly}`} x1={-30} y1={ly} x2={32} y2={ly - 1} />
          ))}
        </g>
        <path
          d="M-30 0 C -18 3 4 4 32 0 L32 -3 C 4 1 -18 0 -30 -3 Z"
          fill={ART.creamShade}
          fillOpacity={0.55}
        />
      </g>

      {/* blue oval windows */}
      {[-14, -9.5, -5, -0.5, 4, 8.5, 13].map((wx) => (
        <ellipse key={wx} cx={wx} cy={-4} rx={2.2} ry={3} fill={ART.navy} />
      ))}
      <text
        x={-21}
        y={2}
        fontSize={7}
        fontWeight={700}
        fill={ART.navy}
        textAnchor="middle"
        style={{ fontFamily: "var(--font-title)" }}
      >
        1
      </text>

      {/* bottom wing */}
      <path
        d="M-1 7 C -4 15 -6 27 -2 33 C 2 38 10 36 11 29 C 12 21 10 12 9 6 Z"
        fill={ART.sage}
      />
      <path
        d="M-1 7 C -3 14 -5 25 -2.5 31 C -1 34 1 35 3 34 C 0 27 0 16 3 6 Z"
        fill={ART.sageShade}
        fillOpacity={0.45}
      />
      <path d={star(4, 27, 4.2)} fill={ART.star} />

      {/* Propeller. The disc does the work; the blades are translucent and
          turn slowly, so it reads as blur rather than flicker. Every shape
          is centred on (31, 0), which is the pivot Motion picks by itself. */}
      <circle cx={31} cy={0} r={16} fill={ART.navy} fillOpacity={0.1} />
      <circle cx={31} cy={0} r={11} fill={ART.navy} fillOpacity={0.07} />
      <motion.g style={{ rotate: propSpin }}>
        <ellipse cx={31} cy={0} rx={2.4} ry={16} fill={ART.navy} fillOpacity={0.5} />
        <ellipse
          cx={31}
          cy={0}
          rx={2}
          ry={16}
          fill={ART.navy}
          fillOpacity={0.3}
          transform="rotate(58 31 0)"
        />
        <ellipse
          cx={31}
          cy={0}
          rx={1.6}
          ry={16}
          fill={ART.navy}
          fillOpacity={0.18}
          transform="rotate(118 31 0)"
        />
      </motion.g>
      <circle cx={31} cy={0} r={3} fill={ART.blush} />
    </>
  );
}

/**
 * A pair of distant birds — two brush ticks, bobbing gently. Purely
 * decorative sky texture, driven off the same clock so nothing extra runs.
 */
function Birds({
  clock,
  x,
  y,
  scale,
  phase,
}: {
  clock: MotionValue<number>;
  x: number;
  y: number;
  scale: number;
  phase: number;
}) {
  const bob = useTransform(clock, (c: number) =>
    Math.sin((c + phase) * Math.PI * 2 * 2) * 2.2,
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <motion.g style={{ y: bob }}>
        <path
          d="M0 0 Q 3.5 -4 7 0 M7 0 Q 10.5 -4 14 0"
          stroke={ART.bird}
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </g>
  );
}

/**
 * Drifting cloud. Built from overlapping circles under one fill so it stays
 * a clean silhouette at any scale. Each cloud enters and exits fully
 * off-canvas, so the wrap is never visible; `delay` staggers them without
 * needing separate timelines.
 */
function Cloud({
  x,
  y,
  scale,
  opacity,
  duration,
  delay,
  drift,
}: CloudSpec & { drift: [number, number] }) {
  const reduced = useReducedMotion();

  return (
    <motion.g
      initial={{ x: reduced ? x : drift[0] }}
      animate={reduced ? undefined : { x: drift }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      <g
        transform={`translate(${x} ${y}) scale(${scale})`}
        fill={ART.cloud}
        opacity={opacity}
      >
        <circle cx={20} cy={16} r={12} />
        <circle cx={40} cy={13} r={16} />
        <circle cx={58} cy={19} r={11} />
        <rect x={8} y={19} width={58} height={12} rx={6} />
      </g>
    </motion.g>
  );
}

export default TripNestLoader;
