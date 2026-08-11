import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { peekInvite, redeemInvite } from "@/lib/supabase/invites";
import { normaliseInviteCode } from "@/types/invite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Look at what a code opens, without joining anything. */
export async function GET(request: Request) {
  const code = normaliseInviteCode(
    new URL(request.url).searchParams.get("code") ?? "",
  );

  if (code.length < 6) {
    return NextResponse.json({ preview: null }, { headers: { "cache-control": "no-store" } });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const preview = await peekInvite(supabase, code);
  return NextResponse.json({ preview }, { headers: { "cache-control": "no-store" } });
}

/** Redeem it. Idempotent — joining twice is a no-op that returns the trip. */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in", reason: "unauthenticated" }, { status: 401 });
  }

  let body: { code?: unknown };
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request", reason: "invalid" }, { status: 400 });
  }

  const code = normaliseInviteCode(typeof body.code === "string" ? body.code : "");
  if (code.length < 6) {
    return NextResponse.json({ error: "Enter a full code", reason: "invalid" }, { status: 400 });
  }

  const result = await redeemInvite(supabase, code);

  if (!result.ok) {
    return NextResponse.json(
      { error: "Could not join that trip", reason: result.reason },
      { status: result.reason === "unauthenticated" ? 401 : 400 },
    );
  }

  return NextResponse.json({ tripId: result.tripId });
}
