"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AmbienceKind } from "@/types/theme";

/* ------------------------------------------------------------------ */
/* Wanderly feedback engine                                            */
/* Procedural WebAudio "clay" sounds + haptic patterns. No audio files, */
/* nothing loads until the first user gesture.                          */
/* ------------------------------------------------------------------ */

export type FeedbackKind =
  | "tap" // generic small button
  | "press" // primary / heavy button
  | "toggleOn" // checkbox checked, chip selected
  | "toggleOff" // unchecked
  | "success" // trip generated, checklist complete
  | "whoosh" // item flying into the suitcase, carousel slide
  | "pop" // card hover-in, tooltip
  | "nav" // navigating / opening a panel
  | "pageTurn" // calendar month change
  | "lift" // picking a trip block up
  | "drop" // dropping it on a new date
  | "spin" // globe flicked into a spin
  | "pin" // a pin on the globe comes into view / is selected
  | "weatherClay" // theme changed → terracotta
  | "weatherSun" // theme changed → hot and sunny
  | "weatherSnow" // theme changed → cold and snowy
  | "weatherRain"; // theme changed → cool and rainy

interface Voice {
  freq: number;
  /** frequency at the end of the voice, for a pitch sweep */
  to?: number;
  type: OscillatorType;
  dur: number;
  gain: number;
  /** delay from the start of the sound, in seconds */
  at?: number;
  /** lowpass cutoff — keeps every sound soft and "matte" */
  cutoff?: number;
}

interface Recipe {
  voices: Voice[];
  noise?: { dur: number; gain: number; from: number; to: number };
  vibrate: number | number[];
}

const RECIPES: Record<FeedbackKind, Recipe> = {
  tap: {
    voices: [{ freq: 420, to: 300, type: "sine", dur: 0.09, gain: 0.1, cutoff: 1400 }],
    vibrate: 8,
  },
  press: {
    voices: [
      { freq: 260, to: 170, type: "sine", dur: 0.14, gain: 0.16, cutoff: 1100 },
      { freq: 520, to: 400, type: "triangle", dur: 0.1, gain: 0.05, cutoff: 1800 },
    ],
    vibrate: [14, 22, 8],
  },
  toggleOn: {
    voices: [
      { freq: 540, type: "sine", dur: 0.07, gain: 0.09, cutoff: 2200 },
      { freq: 760, type: "sine", dur: 0.1, gain: 0.08, at: 0.05, cutoff: 2600 },
    ],
    vibrate: [10, 14, 14],
  },
  toggleOff: {
    voices: [
      { freq: 470, type: "sine", dur: 0.07, gain: 0.07, cutoff: 1600 },
      { freq: 300, type: "sine", dur: 0.1, gain: 0.07, at: 0.045, cutoff: 1200 },
    ],
    vibrate: 10,
  },
  success: {
    voices: [
      { freq: 523.25, type: "triangle", dur: 0.16, gain: 0.09, cutoff: 3000 },
      { freq: 659.25, type: "triangle", dur: 0.16, gain: 0.085, at: 0.09, cutoff: 3000 },
      { freq: 783.99, type: "triangle", dur: 0.3, gain: 0.09, at: 0.18, cutoff: 3200 },
    ],
    vibrate: [12, 40, 12, 40, 24],
  },
  whoosh: {
    voices: [{ freq: 900, to: 220, type: "sine", dur: 0.26, gain: 0.05, cutoff: 2400 }],
    noise: { dur: 0.3, gain: 0.055, from: 1600, to: 320 },
    vibrate: [6, 30, 14],
  },
  pop: {
    voices: [{ freq: 680, to: 900, type: "sine", dur: 0.06, gain: 0.05, cutoff: 2800 }],
    vibrate: 5,
  },
  nav: {
    voices: [
      { freq: 340, to: 520, type: "sine", dur: 0.12, gain: 0.08, cutoff: 2000 },
    ],
    vibrate: 12,
  },

  /* ------------------------------------------------------------ */
  /* Calendar and globe                                            */
  /* ------------------------------------------------------------ */

  // Paper sliding over paper — a month turning.
  pageTurn: {
    voices: [{ freq: 300, to: 240, type: "sine", dur: 0.09, gain: 0.045, cutoff: 900 }],
    noise: { dur: 0.16, gain: 0.05, from: 900, to: 2600 },
    vibrate: 7,
  },

  // Something coming off the surface: short, rising, weightless.
  lift: {
    voices: [{ freq: 300, to: 620, type: "sine", dur: 0.11, gain: 0.06, cutoff: 2200 }],
    vibrate: [6, 18, 10],
  },

  // And landing again: heavier, falling, with a little body.
  drop: {
    voices: [
      { freq: 520, to: 260, type: "sine", dur: 0.13, gain: 0.1, cutoff: 1200 },
      { freq: 180, type: "sine", dur: 0.16, gain: 0.06, at: 0.05, cutoff: 700 },
    ],
    vibrate: [14, 20, 8],
  },

  // A globe given a shove — low whoosh that runs off.
  spin: {
    voices: [{ freq: 180, to: 90, type: "sine", dur: 0.5, gain: 0.05, cutoff: 700 }],
    noise: { dur: 0.4, gain: 0.04, from: 700, to: 180 },
    vibrate: [8, 40, 14],
  },

  // A pin arriving: tiny, bright, gone.
  pin: {
    voices: [{ freq: 880, to: 1180, type: "sine", dur: 0.07, gain: 0.045, cutoff: 3400 }],
    vibrate: 6,
  },

  /* ---------------------------------------------------------------- */
  /* Weather stingers — one per theme, played when the palette lands.  */
  /* Longer and softer than the UI sounds: these are scenery, not      */
  /* button clicks.                                                    */
  /* ---------------------------------------------------------------- */

  // Warm major arpeggio — the sun coming out.
  weatherSun: {
    voices: [
      { freq: 392, type: "sine", dur: 0.2, gain: 0.075, cutoff: 2400 },
      { freq: 587.33, type: "triangle", dur: 0.22, gain: 0.06, at: 0.09, cutoff: 2800 },
      { freq: 783.99, type: "sine", dur: 0.42, gain: 0.07, at: 0.18, cutoff: 3200 },
    ],
    noise: { dur: 0.32, gain: 0.024, from: 2400, to: 5200 },
    vibrate: [10, 45, 10, 45, 18],
  },

  // Glassy high bell over a breath of wind — cold, still air.
  weatherSnow: {
    voices: [
      { freq: 1046.5, type: "sine", dur: 0.32, gain: 0.05, cutoff: 4400 },
      { freq: 1567.98, type: "sine", dur: 0.26, gain: 0.03, at: 0.07, cutoff: 5200 },
      { freq: 783.99, type: "sine", dur: 0.5, gain: 0.045, at: 0.15, cutoff: 3600 },
    ],
    noise: { dur: 0.38, gain: 0.026, from: 5200, to: 2000 },
    vibrate: [6, 60, 6, 60, 10],
  },

  // A rising patter over a low rumble — rain arriving.
  weatherRain: {
    voices: [
      { freq: 240, to: 165, type: "sine", dur: 0.4, gain: 0.07, cutoff: 900 },
      { freq: 1180, to: 820, type: "sine", dur: 0.07, gain: 0.03, at: 0.14, cutoff: 2600 },
      { freq: 960, to: 700, type: "sine", dur: 0.07, gain: 0.026, at: 0.27, cutoff: 2400 },
    ],
    noise: { dur: 0.4, gain: 0.07, from: 1300, to: 2900 },
    vibrate: [8, 30, 8, 30, 8, 30, 8],
  },

  // Soft kiln thunk — no weather at all, just clay.
  weatherClay: {
    voices: [
      { freq: 300, to: 215, type: "sine", dur: 0.2, gain: 0.11, cutoff: 1000 },
      { freq: 452, type: "triangle", dur: 0.16, gain: 0.04, at: 0.07, cutoff: 1500 },
    ],
    vibrate: [12, 35, 12],
  },
};

/** The stinger that belongs to a theme's ambient weather layer. */
export const WEATHER_FEEDBACK: Record<AmbienceKind, FeedbackKind> = {
  none: "weatherClay",
  sun: "weatherSun",
  snow: "weatherSnow",
  rain: "weatherRain",
};

const STORAGE_KEY = "wanderly:feedback";

interface Prefs {
  sound: boolean;
  haptics: boolean;
}

let prefs: Prefs = { sound: true, haptics: true };
let hydrated = false;
const listeners = new Set<() => void>();
let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) prefs = { ...prefs, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* storage blocked — keep defaults */
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function getNoiseBuffer(ctx: AudioContext) {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    // Soft, slightly filtered noise rather than harsh white noise
    data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  noiseBuffer = buffer;
  return noiseBuffer;
}

function playVoice(ctx: AudioContext, v: Voice, startAt: number) {
  const t0 = startAt + (v.at ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = v.type;
  osc.frequency.setValueAtTime(v.freq, t0);
  if (v.to) osc.frequency.exponentialRampToValueAtTime(Math.max(v.to, 1), t0 + v.dur);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(v.cutoff ?? 1800, t0);
  filter.Q.value = 0.4;

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(v.gain, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + v.dur);

  osc.connect(filter).connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + v.dur + 0.05);
}

function playNoise(ctx: AudioContext, cfg: NonNullable<Recipe["noise"]>, startAt: number) {
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(cfg.from, startAt);
  filter.frequency.exponentialRampToValueAtTime(cfg.to, startAt + cfg.dur);
  filter.Q.value = 0.9;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(cfg.gain, startAt + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + cfg.dur);

  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(startAt);
  src.stop(startAt + cfg.dur + 0.05);
}

/**
 * Fire a sound + matching haptic pattern. Safe to call anywhere.
 *
 * `delay` (seconds) schedules the sound ahead on the audio clock rather than
 * with a timer, so it stays sample-accurate — used to let a sound land *after*
 * a visual transition instead of on top of it.
 */
export function feedback(kind: FeedbackKind = "tap", delay = 0) {
  hydrate();
  const recipe = RECIPES[kind];
  if (!recipe) return;

  if (prefs.sound) {
    const ctx = getCtx();
    if (ctx) {
      const now = ctx.currentTime + 0.001 + Math.max(delay, 0);
      recipe.voices.forEach((v) => playVoice(ctx, v, now));
      if (recipe.noise) playNoise(ctx, recipe.noise, now);
    }
  }

  if (
    prefs.haptics &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    const buzz = () => {
      try {
        navigator.vibrate(recipe.vibrate);
      } catch {
        /* unsupported */
      }
    };
    if (delay > 0) window.setTimeout(buzz, delay * 1000);
    else buzz();
  }
}

/* --------------------------- preference store --------------------------- */

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Prefs {
  hydrate();
  return prefs;
}

const SERVER_SNAPSHOT: Prefs = { sound: true, haptics: true };
function getServerSnapshot(): Prefs {
  return SERVER_SNAPSHOT;
}

export function setFeedbackPrefs(next: Partial<Prefs>) {
  hydrate();
  prefs = { ...prefs, ...next };
  persist();
  emit();
}

/**
 * Read and control sound / haptics from any client component.
 * `play` is stable, so it can safely live in effect dependency arrays.
 */
export function useFeedback() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const play = useCallback(
    (kind: FeedbackKind = "tap", delay = 0) => feedback(kind, delay),
    [],
  );

  const toggleSound = useCallback(() => {
    setFeedbackPrefs({ sound: !prefs.sound });
    if (prefs.sound) feedback("toggleOn");
  }, []);

  const toggleHaptics = useCallback(() => {
    setFeedbackPrefs({ haptics: !prefs.haptics });
    feedback("tap");
  }, []);

  return {
    sound: value.sound,
    haptics: value.haptics,
    play,
    toggleSound,
    toggleHaptics,
    setPrefs: setFeedbackPrefs,
  };
}
