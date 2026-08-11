import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInvite, listInvites } from "@/lib/supabase/invites";
import type { CreateInviteInput } from "@/types/invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Invites for one trip. Both verbs are owner-only, but this file does not
 * check ownership itself — the RLS policy on trip_invites does, so a
 * non-owner gets an empty list and a failed insert rather than a leak.
 */

/** Turns a data-layer failure into a status and a sentence for the UI. */
function explain(reason: "unsynced" | "denied" | "unknown") {
  switch (reason) {
    case "unsynced":
      return {
        status: 409,
        error: "This trip hasn't finished syncing yet. Try again in a moment.",
      };
    case "denied":
      return {
        status: 403,
        error:
          "The database refused the request. Check that the trip_invites migration has been applied.",
      };
    default:
      return { status: 400, error: "Could not create an invite for this trip" };
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const result = await listInvites(supabase, id);

  if (!result.ok) {
    const { status, error } = explain(result.reason);
    return NextResponse.json(
      { invites: [], error, reason: result.reason },
      { status, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { invites: result.invites },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: CreateInviteInput = {};
  try {
    body = (await request.json()) as CreateInviteInput;
  } catch {
    // An empty body is a perfectly good "make me a default invite".
  }

  const result = await createInvite(supabase, id, user.id, {
    label: typeof body.label === "string" ? body.label.slice(0, 80) : "",
    maxUses:
      typeof body.maxUses === "number" && body.maxUses > 0
        ? Math.min(50, Math.floor(body.maxUses))
        : null,
    expiresInDays:
      typeof body.expiresInDays === "number" && body.expiresInDays > 0
        ? Math.min(365, Math.floor(body.expiresInDays))
        : null,
  });

  if (!result.ok) {
    const { status, error } = explain(result.reason);
    return NextResponse.json({ error, reason: result.reason }, { status });
  }

  return NextResponse.json({ invite: result.invite }, { status: 201 });
}
