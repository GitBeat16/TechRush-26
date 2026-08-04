import { NextResponse } from "next/server";
import { endSession } from "@/lib/server/session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  await endSession();
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
