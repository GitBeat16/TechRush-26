"use client";

import type { PackableIcon } from "@/lib/packing";

/* ------------------------------------------------------------------ */
/* Clay packables                                                      */
/*                                                                     */
/* The actual objects that go in the bag, drawn as simple clay solids:  */
/* two or three shapes each, one flat colour plus one shade, no strokes */
/* thinner than the rounding. They have to read at 22px in a list and   */
/* at 56px mid-flight, which rules out any real detail.                 */
/*                                                                     */
/* Every drawing sits on a 40×40 grid so they can be swapped without    */
/* touching layout.                                                     */
/* ------------------------------------------------------------------ */

interface DrawProps {
  size?: number;
  className?: string;
}

/** Palette per object — kept here so the set stays visually coherent. */
const C = {
  cotton: "#a9c8f4",
  cottonDark: "#8fb6ee",
  wool: "#f7a8b8",
  woolDark: "#e88fa2",
  denim: "#7d9fd6",
  denimDark: "#6a8bc2",
  leather: "#c98f5f",
  leatherDark: "#a97544",
  paper: "#ffe8a3",
  paperDark: "#f5d47c",
  doc: "#7fcfae",
  docDark: "#5fbd98",
  tech: "#9aa6c9",
  techDark: "#7f8cb3",
  warm: "#f9b384",
  warmDark: "#ef9a63",
  skin: "#ffd7b3",
  white: "#fffdfa",
  ink: "#4a3a30",
  green: "#7fcfae",
} as const;

function Frame({
  size = 40,
  className = "",
  children,
}: DrawProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------ clothes */

function TShirt(props: DrawProps) {
  return (
    <Frame {...props}>
      <path
        d="M14 9 8 12l-3 6 5 3 1-2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V19l1 2 5-3-3-6-6-3-6 3-6-3Z"
        fill={C.cotton}
      />
      <path d="M20 12l6-3 6 3 3 6-5 3-1-2v13a2 2 0 0 1-2 2h-7V12Z" fill={C.cottonDark} />
      <path d="M14 9h12a6 6 0 0 1-12 0Z" fill={C.white} opacity="0.7" />
    </Frame>
  );
}

function Jacket(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M13 8 6 11l-2 8 5 2V33a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V21l5-2-2-8-7-3-7 4-7-4Z" fill={C.doc} />
      <path d="M20 12l7-4 7 3 2 8-5 2v12a2 2 0 0 1-2 2h-9V12Z" fill={C.docDark} />
      <rect x="18.6" y="12" width="2.8" height="23" rx="1.4" fill={C.white} opacity="0.85" />
    </Frame>
  );
}

function Coat(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M12 7 5 11l-1 10 4 1v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V22l4-1-1-10-7-4-8 4-8-4Z" fill={C.denim} />
      <path d="M20 11l8-4 7 4 1 10-4 1v14a2 2 0 0 1-2 2h-10V11Z" fill={C.denimDark} />
      <rect x="18.4" y="11" width="3.2" height="24" rx="1.6" fill={C.white} opacity="0.8" />
      <circle cx="24.5" cy="18" r="1.5" fill={C.paper} />
      <circle cx="24.5" cy="25" r="1.5" fill={C.paper} />
    </Frame>
  );
}

function RainCoat(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M12 10 5 13l-1 9 4 1v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V23l4-1-1-9-7-3-8 3-8-3Z" fill={C.paper} />
      <path d="M20 13l8-3 7 3 1 9-4 1v12a2 2 0 0 1-2 2H20V13Z" fill={C.paperDark} />
      <path d="M13 10a7 7 0 0 1 14 0c-3-3-11-3-14 0Z" fill={C.paperDark} />
      <rect x="18.6" y="13" width="2.8" height="22" rx="1.4" fill={C.white} opacity="0.85" />
    </Frame>
  );
}

function Trousers(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M11 5h18l1 6-2 24h-6l-2-16-2 16h-6L10 11l1-6Z" fill={C.denim} />
      <path d="M20 5h9l1 6-2 24h-6l-2-16V5Z" fill={C.denimDark} />
      <rect x="10.5" y="5" width="19" height="4" rx="2" fill={C.leather} />
    </Frame>
  );
}

function Shorts(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M9 9h22l1 5-1 15h-8l-2-10-2 10H11L8 14l1-5Z" fill={C.cotton} />
      <path d="M20 9h11l1 5-1 15h-8l-2-10V9Z" fill={C.cottonDark} />
      <rect x="8.5" y="9" width="23" height="4" rx="2" fill={C.white} opacity="0.65" />
    </Frame>
  );
}

function Socks(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M11 6h8v14c0 4 3 4 6 6 3 2 3 7-1 8-5 1-8-2-9-6-1-5-4-6-4-11V6Z" fill={C.wool} />
      <path d="M19 20c0 4 3 4 6 6 3 2 3 7-1 8-2 .4-4 0-5-1 4-1 5-4 3-6-3-3-6-3-6-8V6h3v14Z" fill={C.woolDark} />
      <rect x="10.5" y="6" width="9" height="4" rx="2" fill={C.white} opacity="0.8" />
    </Frame>
  );
}

function Shoes(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M6 26c0-5 2-11 5-11 3 0 3 4 7 6l11 4c3 1 5 2 5 5v2H8a2 2 0 0 1-2-2v-4Z" fill={C.cotton} />
      <path d="M6 30h28v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2Z" fill={C.ink} opacity="0.55" />
      <path d="M13 19c3 2 5 4 9 5" stroke={C.white} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </Frame>
  );
}

function Boots(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M11 5h9v14c0 3 2 4 6 6 4 2 6 3 6 7v2H13a2 2 0 0 1-2-2V5Z" fill={C.leather} />
      <path d="M11 30h21v2a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2v-2Z" fill={C.ink} opacity="0.5" />
      <rect x="11" y="10" width="9" height="3" rx="1.5" fill={C.paper} />
      <rect x="11" y="16" width="9" height="3" rx="1.5" fill={C.paper} />
    </Frame>
  );
}

function Sandals(props: DrawProps) {
  return (
    <Frame {...props}>
      {/* soles */}
      <rect x="6" y="11" width="11" height="24" rx="5.5" fill={C.leatherDark} />
      <rect x="23" y="11" width="11" height="24" rx="5.5" fill={C.leatherDark} />
      <rect x="6" y="9" width="11" height="24" rx="5.5" fill={C.leather} />
      <rect x="23" y="9" width="11" height="24" rx="5.5" fill={C.leather} />
      {/* the V strap that makes it a sandal and not a block */}
      <path d="M11.5 14v4M11.5 18l-4 5M11.5 18l4 5" stroke={C.paper} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M28.5 14v4M28.5 18l-4 5M28.5 18l4 5" stroke={C.paper} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </Frame>
  );
}

function Swimsuit(props: DrawProps) {
  return (
    <Frame {...props}>
      {/* one-piece: straps, a scooped body, a rounded leg line */}
      <path d="M13 6c1 5 3 7 7 7s6-2 7-7" stroke={C.wool} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M11 12c6 3 12 3 18 0l-1 12c0 6-3 10-8 10s-8-4-8-10l-1-12Z" fill={C.wool} />
      <path d="M20 13.9c3 0 6-.6 9-1.9l-1 12c0 6-3 10-8 10V13.9Z" fill={C.woolDark} />
      <path d="M14 29c4 2 8 2 12 0" stroke={C.white} strokeWidth="2.2" strokeLinecap="round" opacity="0.75" fill="none" />
    </Frame>
  );
}

function Hat(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M10 22c0-8 4-13 10-13s10 5 10 13Z" fill={C.doc} />
      <rect x="6" y="20" width="28" height="6" rx="3" fill={C.docDark} />
      <ellipse cx="16" cy="14" rx="4" ry="2" fill={C.white} opacity="0.5" transform="rotate(-18 16 14)" />
    </Frame>
  );
}

function SunHat(props: DrawProps) {
  return (
    <Frame {...props}>
      <ellipse cx="20" cy="25" rx="17" ry="6" fill={C.paperDark} />
      <ellipse cx="20" cy="23" rx="17" ry="5.5" fill={C.paper} />
      <path d="M11 23c1-9 17-9 18 0Z" fill={C.paperDark} />
      <rect x="11.5" y="19" width="17" height="3.6" rx="1.8" fill={C.warm} />
    </Frame>
  );
}

function Gloves(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M12 12a6 6 0 0 1 12 0v9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5v-9Z" fill={C.wool} />
      <path d="M24 15a3 3 0 1 1 0 6v-6Z" fill={C.wool} />
      <path d="M18 6a6 6 0 0 1 6 6v9a5 5 0 0 1-5 5h-1V6Z" fill={C.woolDark} />
      <rect x="11.5" y="25" width="13" height="5" rx="2.5" fill={C.white} opacity="0.85" />
    </Frame>
  );
}

function Scarf(props: DrawProps) {
  return (
    <Frame {...props}>
      {/* Folded in half and hung, which is how a scarf is recognisable
          without a neck in the picture: a loop at the top and two tails of
          different lengths below it. */}
      <path d="M11 12a9 6 0 0 1 18 0Z" fill={C.woolDark} />
      <rect x="11" y="10" width="18" height="6" rx="3" fill={C.wool} />
      <rect x="12" y="14" width="7.5" height="17" rx="2" fill={C.wool} />
      <rect x="20.5" y="14" width="7.5" height="22" rx="2" fill={C.woolDark} />
      <rect x="12" y="19" width="7.5" height="3" fill={C.white} opacity="0.6" />
      <rect x="20.5" y="24" width="7.5" height="3" fill={C.white} opacity="0.45" />
      <path d="M14 31v2.5M17.5 31v2.5M22.5 36v2.5M26 36v2.5" stroke={C.woolDark} strokeWidth="1.6" strokeLinecap="round" />
    </Frame>
  );
}

/* -------------------------------------------------------- essentials */

function Sunglasses(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="4" y="15" width="13" height="10" rx="5" fill={C.ink} />
      <rect x="23" y="15" width="13" height="10" rx="5" fill={C.ink} />
      <path d="M17 19h6" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M4 18H2M36 18h2" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <path d="M7 22l4-4M26 22l4-4" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
    </Frame>
  );
}

function Sunscreen(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="12" y="4" width="8" height="5" rx="1.5" fill={C.warmDark} />
      <rect x="9" y="9" width="14" height="27" rx="5" fill={C.white} />
      <rect x="9" y="20" width="14" height="16" rx="5" fill={C.warm} />
      <circle cx="30" cy="12" r="5" fill={C.paper} />
      <path d="M30 4v3M30 17v3M22 12h3M35 12h3" stroke={C.paper} strokeWidth="2" strokeLinecap="round" />
    </Frame>
  );
}

function Umbrella(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M4 20a16 16 0 0 1 32 0c-4-3-6.5-3-8 0-1.5-3-6.5-3-8 0-1.5-3-6.5-3-8 0-1.5-3-4-3-8 0Z" fill={C.wool} />
      <path d="M20 4a16 16 0 0 1 16 16c-4-3-6.5-3-8 0-1.5-3-6.5-3-8 0V4Z" fill={C.woolDark} />
      <path d="M20 20v11a4 4 0 0 1-8 0" stroke={C.leather} strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="4" r="2" fill={C.leather} />
    </Frame>
  );
}

function Bottle(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="16" y="3" width="8" height="5" rx="2" fill={C.tech} />
      <path d="M14 10h12a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z" fill={C.green} />
      <path d="M20 10h6a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-6V10Z" fill={C.docDark} />
      <rect x="13" y="17" width="14" height="5" rx="2.5" fill={C.white} opacity="0.7" />
    </Frame>
  );
}

function MedKit(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="4" y="12" width="32" height="22" rx="5" fill={C.wool} />
      <rect x="4" y="12" width="32" height="6" rx="3" fill={C.woolDark} />
      <path d="M15 9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4" stroke={C.woolDark} strokeWidth="3" fill="none" />
      <path d="M20 18v10M15 23h10" stroke={C.white} strokeWidth="4" strokeLinecap="round" />
    </Frame>
  );
}

function Toiletries(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="5" y="16" width="12" height="20" rx="4" fill={C.doc} />
      <rect x="8" y="11" width="6" height="6" rx="2" fill={C.docDark} />
      <path d="M23 36V17a4 4 0 0 1 4-4l6-6v6l-4 4v19h-6Z" fill={C.cotton} />
      <rect x="23" y="28" width="6" height="8" rx="2" fill={C.cottonDark} />
    </Frame>
  );
}

function Book(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M6 8a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8Z" fill={C.warm} />
      <path d="M20 5h11a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H20V5Z" fill={C.warmDark} />
      <rect x="9" y="5" width="4" height="30" fill={C.white} opacity="0.55" />
    </Frame>
  );
}

function DayPack(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M13 8a7 7 0 0 1 14 0" stroke={C.docDark} strokeWidth="3" fill="none" />
      <rect x="7" y="9" width="26" height="27" rx="7" fill={C.doc} />
      <rect x="20" y="9" width="13" height="27" rx="7" fill={C.docDark} />
      <rect x="12" y="20" width="16" height="9" rx="4" fill={C.white} opacity="0.85" />
    </Frame>
  );
}

/* --------------------------------------------------------- documents */

function Passport(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="8" y="4" width="24" height="32" rx="4" fill={C.doc} />
      <rect x="8" y="4" width="5" height="32" rx="2.5" fill={C.docDark} />
      <circle cx="22" cy="15" r="5" fill={C.paper} />
      <rect x="16" y="24" width="12" height="2.6" rx="1.3" fill={C.paper} />
      <rect x="18" y="29" width="8" height="2.6" rx="1.3" fill={C.paper} opacity="0.7" />
    </Frame>
  );
}

function Ticket(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M4 12a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v4a4 4 0 0 0 0 8v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4a4 4 0 0 0 0-8v-4Z" fill={C.paper} />
      <path d="M25 9h8a3 3 0 0 1 3 3v4a4 4 0 0 0 0 8v4a3 3 0 0 1-3 3h-8V9Z" fill={C.paperDark} />
      <path d="M25 12v16" stroke={C.white} strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
      <rect x="9" y="16" width="11" height="2.6" rx="1.3" fill={C.warm} />
      <rect x="9" y="21" width="7" height="2.6" rx="1.3" fill={C.warm} opacity="0.7" />
    </Frame>
  );
}

function Wallet(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="4" y="9" width="32" height="23" rx="5" fill={C.leather} />
      <rect x="4" y="9" width="32" height="7" rx="3.5" fill={C.leatherDark} />
      <rect x="22" y="17" width="16" height="9" rx="4" fill={C.paper} />
      <circle cx="29" cy="21.5" r="2.4" fill={C.warmDark} />
    </Frame>
  );
}

/* ------------------------------------------------------- electronics */

function Charger(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="6" y="5" width="15" height="15" rx="4" fill={C.white} />
      <rect x="10" y="1" width="2.6" height="5" rx="1.3" fill={C.tech} />
      <rect x="15" y="1" width="2.6" height="5" rx="1.3" fill={C.tech} />
      <path d="M13.5 20v7a6 6 0 0 0 6 6h6a5 5 0 0 1 5 5" stroke={C.tech} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <rect x="29" y="35" width="7" height="4" rx="2" fill={C.techDark} />
    </Frame>
  );
}

function PowerBank(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="10" y="4" width="20" height="32" rx="5" fill={C.tech} />
      <rect x="20" y="4" width="10" height="32" rx="5" fill={C.techDark} />
      <rect x="14" y="9" width="12" height="16" rx="3" fill={C.white} opacity="0.9" />
      <path d="M21 11l-4 7h3l-1 5 4-7h-3l1-5Z" fill={C.warm} />
      <rect x="16" y="29" width="8" height="2.6" rx="1.3" fill={C.white} opacity="0.6" />
    </Frame>
  );
}

function Adapter(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="6" y="8" width="28" height="24" rx="7" fill={C.white} />
      <rect x="20" y="8" width="14" height="24" rx="7" fill={C.cotton} />
      <circle cx="15" cy="17" r="2.6" fill={C.techDark} />
      <circle cx="25" cy="17" r="2.6" fill={C.techDark} />
      <rect x="16" y="24" width="8" height="3" rx="1.5" fill={C.techDark} />
    </Frame>
  );
}

function Camera(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M14 8h12l2 3h4a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V16a5 5 0 0 1 5-5h4l2-3Z" fill={C.tech} />
      <path d="M20 11h8l2 3h2a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5H20V11Z" fill={C.techDark} />
      <circle cx="20" cy="23" r="8" fill={C.white} />
      <circle cx="20" cy="23" r="4.5" fill={C.cotton} />
      <circle cx="18" cy="21" r="1.6" fill={C.white} />
    </Frame>
  );
}

function Headphones(props: DrawProps) {
  return (
    <Frame {...props}>
      <path d="M7 26v-6a13 13 0 0 1 26 0v6" stroke={C.tech} strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="3" y="22" width="9" height="14" rx="4.5" fill={C.techDark} />
      <rect x="28" y="22" width="9" height="14" rx="4.5" fill={C.techDark} />
      <rect x="5" y="25" width="5" height="8" rx="2.5" fill={C.white} opacity="0.6" />
    </Frame>
  );
}

/* ------------------------------------------------------- the fallback */

function Parcel(props: DrawProps) {
  return (
    <Frame {...props}>
      <rect x="5" y="12" width="30" height="23" rx="5" fill={C.warm} />
      <rect x="17" y="12" width="6" height="23" fill={C.paper} />
      <rect x="5" y="12" width="30" height="6" rx="3" fill={C.warmDark} />
      <path d="M20 12c-3-6-9-3-6 0M20 12c3-6 9-3 6 0" stroke={C.paper} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */

const DRAWINGS: Record<PackableIcon, (props: DrawProps) => React.ReactElement> = {
  tshirt: TShirt,
  jacket: Jacket,
  coat: Coat,
  raincoat: RainCoat,
  trousers: Trousers,
  shorts: Shorts,
  socks: Socks,
  shoes: Shoes,
  boots: Boots,
  sandals: Sandals,
  swimsuit: Swimsuit,
  hat: Hat,
  sunhat: SunHat,
  gloves: Gloves,
  scarf: Scarf,
  sunglasses: Sunglasses,
  sunscreen: Sunscreen,
  umbrella: Umbrella,
  bottle: Bottle,
  medkit: MedKit,
  toiletries: Toiletries,
  book: Book,
  daypack: DayPack,
  passport: Passport,
  ticket: Ticket,
  wallet: Wallet,
  charger: Charger,
  powerbank: PowerBank,
  adapter: Adapter,
  camera: Camera,
  headphones: Headphones,
  item: Parcel,
};

/** Draw a packable object. Unknown keys fall back to a wrapped parcel. */
export function ClayPackable({
  icon,
  size = 28,
  className = "",
}: {
  icon: PackableIcon;
  size?: number;
  className?: string;
}) {
  const Drawing = DRAWINGS[icon] ?? Parcel;
  return <Drawing size={size} className={className} />;
}

export const PACKABLE_ICONS = Object.keys(DRAWINGS) as PackableIcon[];
