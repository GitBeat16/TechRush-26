import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listTrips, saveTrip } from "@/lib/supabase/trips";
import type { Trip } from "@/types/dashboard";

export const runtime = "nodejs";

/** Every trip the signed-in user owns or has been added to. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const trips = await listTrips(supabase);
  return NextResponse.json({ trips });
}

/**
 * Create or replace a trip.
 *
 * The client owns the whole document, so this is a PUT in POST's clothing —
 * sending the same trip twice updates it rather than duplicating, because the
 * ids are folded into stable uuids before the write.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { trip?: Trip };
  try {
    body = (await request.json()) as { trip?: Trip };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const trip = body.trip;
  if (!trip || typeof trip.id !== "string" || typeof trip.title !== "string") {
    return NextResponse.json({ error: "Missing trip" }, { status: 400 });
  }

  const saved = await saveTrip(supabase, user.id, trip);
  if (!saved) {
    return NextResponse.json({ error: "Could not save the trip" }, { status: 500 });
  }

  return NextResponse.json({ trip: saved });
}
