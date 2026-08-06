import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { user: null, googleEnabled: true },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // A missing profile row used to make an authenticated user look signed out,
  // which sent AppShell into a redirect loop. Create the row instead.
  const profile = await ensureProfile(supabase, user);

  return NextResponse.json(
    { user: profile, googleEnabled: true },
    { headers: { "cache-control": "no-store" } },
  );
}
