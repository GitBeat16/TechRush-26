import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteTrip, getTrip, saveTrip } from "@/lib/supabase/trips";
import { ensureUuid } from "@/lib/ids";
import type { Trip } from "@/types/dashboard";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const trip = await getTrip(supabase, ensureUuid(id));
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({ trip });
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { trip?: Trip };
  try {
    body = (await request.json()) as { trip?: Trip };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.trip) {
    return NextResponse.json({ error: "Missing trip" }, { status: 400 });
  }

  // The URL is authoritative — a body claiming a different id would let a
  // client overwrite a trip it was not asked to.
  const saved = await saveTrip(supabase, user.id, { ...body.trip, id });
  if (!saved) {
    return NextResponse.json({ error: "Could not save the trip" }, { status: 500 });
  }

  return NextResponse.json({ trip: saved });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const ok = await deleteTrip(supabase, ensureUuid(id));
  if (!ok) {
    return NextResponse.json({ error: "Could not delete the trip" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
