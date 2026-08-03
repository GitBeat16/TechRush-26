import { NextResponse } from "next/server";
import { googleConfig } from "@/lib/server/google";
import { currentProfile } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who is signed in, plus whether the Google button will actually work. */
export async function GET() {
  const user = await currentProfile();

  return NextResponse.json(
    { user, googleEnabled: googleConfig().configured },
    { headers: { "cache-control": "no-store" } },
  );
}
