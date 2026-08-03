import type { ClayTone, ToneStyle } from "@/types/dashboard";

/**
 * Single source of truth for the pastel clay palette.
 * Components take a `tone` and read everything they need from here,
 * so colours stay consistent across cards, chips, bars and SVG art.
 */
export const TONES: Record<ClayTone, ToneStyle> = {
  blush: {
    bg: "bg-clay-blush",
    text: "text-clay-ink",
    accent: "#f7a8b8",
    hex: "#ffd3d8",
  },
  peach: {
    bg: "bg-clay-peach",
    text: "text-clay-ink",
    accent: "#f9b384",
    hex: "#ffd7b3",
  },
  butter: {
    bg: "bg-clay-butter",
    text: "text-clay-ink",
    accent: "#f2c34e",
    hex: "#ffe8a3",
  },
  mint: {
    bg: "bg-clay-mint",
    text: "text-clay-ink",
    accent: "#7fcfae",
    hex: "#bfe9d5",
  },
  sky: {
    bg: "bg-clay-sky",
    text: "text-clay-ink",
    accent: "#8fb6ee",
    hex: "#c3dcfb",
  },
  lilac: {
    bg: "bg-clay-lilac",
    text: "text-clay-ink",
    accent: "#b09ff0",
    hex: "#dcd2fb",
  },
  surface: {
    bg: "bg-clay-surface",
    text: "text-clay-ink",
    accent: "#c9ab97",
    hex: "#fbf4ec",
  },
};

export function tone(name: ClayTone): ToneStyle {
  return TONES[name];
}

/** Shades a hex colour by `amount` (-1 darkens, +1 lightens). Used for SVG depth. */
export function shade(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const mix = (channel: number) =>
    Math.round(
      amount >= 0
        ? channel + (255 - channel) * amount
        : channel * (1 + amount),
    );
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0"))
    .join("")}`;
}
