import { NextResponse } from "next/server";
import { resolveProfile } from "@/lib/supabase/profile";
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

  // The Supabase cookie is the single source of truth for "signed in".
  // Once getUser() has answered yes, this route must answer yes too —
  // proxy.ts and AppShell gate on the two separately, and any
  // disagreement bounces the user between /login and / forever. A broken
  // profiles table degrades the profile; it never un-authenticates.
  const { profile, degraded } = await resolveProfile(supabase, user);

  return NextResponse.json(
    { user: profile, googleEnabled: true, degraded },
    { headers: { "cache-control": "no-store" } },
  );
}
