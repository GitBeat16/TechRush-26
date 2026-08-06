import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Deprecated — forwards to the Supabase callback.
 *
 * If a stale Google Cloud redirect URI still points here, the round trip
 * still completes instead of dead-ending. The real handler is
 * /api/auth/callback.
 */
export function GET(request: NextRequest) {
  const url = new URL("/api/auth/callback", request.nextUrl.origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}
