import type { ClayTone } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Avatar data, with no JSX — so server code can import it too.        */
/* The renderer lives in components/ui/ClayAvatar.tsx.                 */
/* ------------------------------------------------------------------ */

export type HairStyle =
  | "short"
  | "long"
  | "bun"
  | "curly"
  | "afro"
  | "braids"
  | "none";
export type HatStyle = "sun" | "beanie" | "cap" | "bandana" | "turban" | "none";
export type Accessory = "glasses" | "shades" | "headphones" | "earrings" | "none";

export interface AvatarSpec {
  id: string;
  label: string;
  bg: ClayTone;
  skin: string;
  hair: { color: string; style: HairStyle };
  hat: { color: string; style: HatStyle };
  accessory: Accessory;
  beard: boolean;
  top: string;
}

const SKIN = {
  porcelain: "#ffd9bd",
  sand: "#f0c199",
  honey: "#dda36f",
  amber: "#c07f4e",
  cocoa: "#96603a",
  espresso: "#6f4327",
};

const HAIR = {
  ink: "#3a2a22",
  chestnut: "#6b4326",
  auburn: "#a5502c",
  wheat: "#d9a558",
  slate: "#4a4a55",
  plum: "#7a4b73",
};

export const AVATARS: AvatarSpec[] = [
  {
    id: "sunseeker",
    label: "Sunseeker",
    bg: "butter",
    skin: SKIN.sand,
    hair: { color: HAIR.chestnut, style: "long" },
    hat: { color: "#7fcfae", style: "sun" },
    accessory: "none",
    beard: false,
    top: "#f7a8b8",
  },
  {
    id: "nomad",
    label: "Nomad",
    bg: "sky",
    skin: SKIN.honey,
    hair: { color: HAIR.ink, style: "short" },
    hat: { color: "#8fb6ee", style: "beanie" },
    accessory: "none",
    beard: true,
    top: "#6f9ee6",
  },
  {
    id: "citypop",
    label: "City Pop",
    bg: "blush",
    skin: SKIN.porcelain,
    hair: { color: HAIR.plum, style: "bun" },
    hat: { color: "", style: "none" },
    accessory: "earrings",
    beard: false,
    top: "#f7a8b8",
  },
  {
    id: "trailhead",
    label: "Trailhead",
    bg: "mint",
    skin: SKIN.cocoa,
    hair: { color: HAIR.ink, style: "afro" },
    hat: { color: "", style: "none" },
    accessory: "shades",
    beard: false,
    top: "#7fcfae",
  },
  {
    id: "dreamer",
    label: "Dreamer",
    bg: "lilac",
    skin: SKIN.amber,
    hair: { color: HAIR.auburn, style: "curly" },
    hat: { color: "", style: "none" },
    accessory: "glasses",
    beard: false,
    top: "#b09ff0",
  },
  {
    id: "sonic",
    label: "Sonic",
    bg: "peach",
    skin: SKIN.espresso,
    hair: { color: HAIR.ink, style: "short" },
    hat: { color: "#f9b384", style: "cap" },
    accessory: "headphones",
    beard: false,
    top: "#f9b384",
  },
  {
    id: "voyager",
    label: "Voyager",
    bg: "sky",
    skin: SKIN.porcelain,
    hair: { color: HAIR.wheat, style: "braids" },
    hat: { color: "", style: "none" },
    accessory: "glasses",
    beard: false,
    top: "#8fb6ee",
  },
  {
    id: "harbour",
    label: "Harbour",
    bg: "mint",
    skin: SKIN.sand,
    hair: { color: HAIR.slate, style: "short" },
    hat: { color: "#f7a8b8", style: "bandana" },
    accessory: "none",
    beard: true,
    top: "#7fcfae",
  },
  {
    id: "monsoon",
    label: "Monsoon",
    bg: "lilac",
    skin: SKIN.honey,
    hair: { color: HAIR.ink, style: "long" },
    hat: { color: "", style: "none" },
    accessory: "earrings",
    beard: false,
    top: "#b09ff0",
  },
  {
    id: "atlas",
    label: "Atlas",
    bg: "butter",
    skin: SKIN.amber,
    hair: { color: HAIR.ink, style: "none" },
    hat: { color: "#f2c34e", style: "turban" },
    accessory: "none",
    beard: true,
    top: "#f2c34e",
  },
  {
    id: "aurora",
    label: "Aurora",
    bg: "blush",
    skin: SKIN.cocoa,
    hair: { color: HAIR.plum, style: "curly" },
    hat: { color: "", style: "none" },
    accessory: "shades",
    beard: false,
    top: "#f7a8b8",
  },
  {
    id: "compass",
    label: "Compass",
    bg: "peach",
    skin: SKIN.porcelain,
    hair: { color: HAIR.chestnut, style: "short" },
    hat: { color: "#7fcfae", style: "sun" },
    accessory: "glasses",
    beard: false,
    top: "#f9b384",
  },
];

export const DEFAULT_AVATAR_ID = AVATARS[0].id;

export function getAvatar(id: string | undefined): AvatarSpec {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}

export function isAvatarId(id: unknown): id is string {
  return typeof id === "string" && AVATARS.some((avatar) => avatar.id === id);
}

/** Deterministic pick, so a Google user keeps the same face every sign-in. */
export function avatarForSeed(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATARS[hash % AVATARS.length].id;
}
