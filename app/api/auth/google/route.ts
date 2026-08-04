import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl, googleConfig } from "@/lib/server/google";
import { OAUTH_STATE_COOKIE, randomToken } from "@/lib/server/token";

export const runtime = "nodejs";

/** Step 1: send the user to Google. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  if (!googleConfig().configured) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", origin),
    );
  }

  const state = randomToken(24);
  const verifier = randomToken(48);
  const next = request.nextUrl.searchParams.get("next") ?? "/";

  const store = await cookies();
  store.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, verifier, next }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 600, // ten minutes to finish the round trip
    },
  );

  const url = await buildAuthUrl({ origin, state, verifier });
  return NextResponse.redirect(url);
}
