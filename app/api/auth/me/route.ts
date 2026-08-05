import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rowToProfile, type ProfileRow } from "@/lib/supabase/profile";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  return NextResponse.json(
    { user: profile ? rowToProfile(profile) : null, googleEnabled: true },
    { headers: { "cache-control": "no-store" } },
  );
}