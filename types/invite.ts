import type { ClayTone } from "./dashboard";

/** An invite as its owner sees it, on the trip they created it for. */
export interface TripInvite {
  id: string;
  tripId: string;
  code: string;
  label: string;
  /** null means unlimited. */
  maxUses: number | null;
  uses: number;
  /** ISO timestamps, or null for "never". */
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  /** Derived: false once revoked, expired, or fully used. */
  active: boolean;
}

/** The small card shown behind a code, before anyone commits to joining. */
export interface InvitePreview {
  tripId: string;
  title: string;
  country: string;
  destinationId: string;
  summary: string;
  days: number;
  tone: ClayTone;
  ownerName: string;
  travelerCount: number;
  /** True when the viewer is already the owner or already on the roster. */
  alreadyMember: boolean;
}

export interface CreateInviteInput {
  label?: string;
  /** null or omitted for unlimited. */
  maxUses?: number | null;
  /** Days from now until the code stops working. null for never. */
  expiresInDays?: number | null;
}

/** Why a code did not work, in a form the UI can turn into a sentence. */
export type InviteError =
  | "invalid"
  | "revoked"
  | "expired"
  | "exhausted"
  | "unauthenticated"
  | "unknown";

export const INVITE_ERROR_COPY: Record<InviteError, string> = {
  invalid: "That code doesn't match any trip. Check for typos and try again.",
  revoked: "That code has been turned off by the trip owner.",
  expired: "That code has expired. Ask for a fresh one.",
  exhausted: "That code has already been used the maximum number of times.",
  unauthenticated: "Sign in first, then the code will work.",
  unknown: "Something went wrong redeeming that code. Try again.",
};

/** Formats WNDR style: 8 characters, split for readability. */
export function formatInviteCode(code: string): string {
  const clean = code.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  if (clean.length !== 8) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

/** The inverse — what gets sent to the server. */
export function normaliseInviteCode(input: string): string {
  return input.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}
