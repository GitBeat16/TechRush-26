import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { ClayTone } from "@/types/dashboard";
import type {
  CreateInviteInput,
  InviteError,
  InvitePreview,
  TripInvite,
} from "@/types/invite";

/* ------------------------------------------------------------------ */
/* Trip invites                                                        */
/*                                                                     */
/* Owner-side reads and writes go straight at the table, because RLS    */
/* already restricts it to the trip owner. Joiner-side calls go through */
/* the two SECURITY DEFINER functions — see the migration for why that  */
/* indirection is load-bearing rather than decorative.                  */
/* ------------------------------------------------------------------ */

interface InviteRow {
  id: string;
  trip_id: string;
  code: string;
  label: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

const TONES: ClayTone[] = ["blush", "peach", "butter", "mint", "sky", "lilac", "surface"];

function toTone(value: string): ClayTone {
  return (TONES as string[]).includes(value) ? (value as ClayTone) : "lilac";
}

function rowToInvite(row: InviteRow): TripInvite {
  const expired = Boolean(row.expires_at && new Date(row.expires_at) <= new Date());
  const exhausted = row.max_uses !== null && row.uses >= row.max_uses;

  return {
    id: row.id,
    tripId: row.trip_id,
    code: row.code,
    label: row.label ?? "",
    maxUses: row.max_uses,
    uses: row.uses,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    active: !row.revoked_at && !expired && !exhausted,
  };
}

/** Postgres uuid shape. A trip that has not synced still has a local id. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isSyncedTripId(tripId: string): boolean {
  return UUID.test(tripId);
}

export type ListInvitesResult =
  | { ok: true; invites: TripInvite[] }
  | { ok: false; reason: "unsynced" | "denied" | "unknown" };

/**
 * Every invite the owner has created for one trip, newest first.
 *
 * Returns a reason rather than an empty array on failure — an empty list and
 * a permissions error look identical in the UI otherwise, which is exactly
 * how a missing GRANT hides as "you have no invites yet".
 */
export async function listInvites(
  supabase: SupabaseClient,
  tripId: string,
): Promise<ListInvitesResult> {
  if (!isSyncedTripId(tripId)) {
    return { ok: false, reason: "unsynced" };
  }

  const { data, error } = await supabase
    .from("trip_invites")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .returns<InviteRow[]>();

  if (error) {
    console.error("[invites] list failed:", error.message);
    return {
      ok: false,
      reason: error.message.includes("permission denied") ? "denied" : "unknown",
    };
  }

  return { ok: true, invites: (data ?? []).map(rowToInvite) };
}

export type CreateInviteResult =
  | { ok: true; invite: TripInvite }
  | { ok: false; reason: "unsynced" | "denied" | "unknown"; detail?: string };

export async function createInvite(
  supabase: SupabaseClient,
  tripId: string,
  userId: string,
  input: CreateInviteInput = {},
): Promise<CreateInviteResult> {
  // The foreign key is a uuid, so a local-only trip cannot carry an invite.
  // Saying so beats a constraint violation the caller has to decode.
  if (!isSyncedTripId(tripId)) {
    return { ok: false, reason: "unsynced" };
  }

  const { data: code, error: codeError } = await supabase.rpc("generate_invite_code");

  if (codeError || typeof code !== "string") {
    console.error("[invites] could not allocate a code:", codeError?.message);
    return {
      ok: false,
      reason: codeError?.message.includes("permission denied") ? "denied" : "unknown",
      detail: codeError?.message,
    };
  }

  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : null;

  const { data, error } = await supabase
    .from("trip_invites")
    .insert({
      trip_id: tripId,
      created_by: userId,
      code,
      label: input.label?.trim() ?? "",
      max_uses: input.maxUses ?? null,
      expires_at: expiresAt,
    })
    .select("*")
    .single<InviteRow>();

  if (error || !data) {
    console.error("[invites] create failed:", error?.message);
    return {
      ok: false,
      reason: error?.message.includes("permission denied") ? "denied" : "unknown",
      detail: error?.message,
    };
  }

  return { ok: true, invite: rowToInvite(data) };
}

/**
 * Turns a code off without deleting it, so the owner keeps a record of what
 * was shared and can tell an old link apart from a wrong one.
 */
export async function revokeInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("trip_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("code", code.toUpperCase())
    .is("revoked_at", null);

  if (error) {
    console.error("[invites] revoke failed:", error.message);
    return false;
  }

  return true;
}

/* -------------------------- joiner side ---------------------------- */

interface PeekRow {
  trip_id: string;
  title: string;
  country: string;
  destination_id: string;
  summary: string;
  days: number;
  tone: string;
  owner_name: string;
  traveler_count: number;
  already_member: boolean;
}

/** The preview card behind a code. Returns null for any code that will not work. */
export async function peekInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<InvitePreview | null> {
  // A set-returning function comes back as an array; the generated rpc types
  // do not know that, so the cast is doing real work rather than papering
  // over a mistake.
  const { data, error } = await supabase.rpc("peek_trip_invite", { p_code: code });

  if (error) {
    console.error("[invites] peek failed:", error.message);
    return null;
  }

  const row = (data as PeekRow[] | null)?.[0];
  if (!row) return null;

  return {
    tripId: row.trip_id,
    title: row.title,
    country: row.country,
    destinationId: row.destination_id,
    summary: row.summary,
    days: row.days,
    tone: toTone(row.tone),
    ownerName: row.owner_name,
    travelerCount: row.traveler_count,
    alreadyMember: row.already_member,
  };
}

/**
 * Postgres error codes the redeem function raises, mapped to something the
 * UI can say out loud. Anything unrecognised stays "unknown" rather than
 * leaking a database message to the user.
 */
function toInviteError(error: PostgrestError): InviteError {
  switch (error.code) {
    case "28000":
      return "unauthenticated";
    case "P0002":
      return "invalid";
    case "P0003":
      return "revoked";
    case "P0004":
      return "expired";
    case "P0005":
      return "exhausted";
    default:
      return "unknown";
  }
}

export type RedeemResult =
  | { ok: true; tripId: string }
  | { ok: false; reason: InviteError };

export async function redeemInvite(
  supabase: SupabaseClient,
  code: string,
): Promise<RedeemResult> {
  const { data, error } = await supabase.rpc("redeem_trip_invite", { p_code: code });

  if (error) {
    const reason = toInviteError(error);
    if (reason === "unknown") {
      console.error("[invites] redeem failed:", error.message);
    }
    return { ok: false, reason };
  }

  if (typeof data !== "string") {
    return { ok: false, reason: "unknown" };
  }

  return { ok: true, tripId: data };
}
