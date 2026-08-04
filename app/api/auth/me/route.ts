import { NextResponse } from "next/server";
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
      {
        user: null,
        googleEnabled: true,
      },
      {
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        name:
          user.user_metadata.full_name ??
          user.user_metadata.name ??
          "Traveler",
        email: user.email ?? "",
        avatarId: "sunseeker",
        homeCity: "",
        provider: user.app_metadata.provider ?? "google",
      },
      googleEnabled: true,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}