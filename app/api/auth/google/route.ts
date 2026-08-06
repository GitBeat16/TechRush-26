import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Deprecated.
 *
 * Google sign-in now starts in the browser via supabase.auth.signInWithOAuth
 * (see startGoogleOAuth in lib/auth/session.ts) and comes back through
 * /api/auth/callback. The hand-rolled PKCE flow that used to live here minted
 * a separate cookie session that /api/auth/me could not see.
 *
 * Kept only so old links and bookmarks land somewhere sensible.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}
