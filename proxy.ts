import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/token";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Server-side route protection.
 *
 * In Next 16 this file replaces middleware.ts and runs on the Node runtime.
 * Checking here means a signed-out visitor never receives the HTML for a
 * protected page at all — the client-side gate in AppShell is only there to
 * keep the transition smooth.
 */

const PUBLIC_PATHS = ["/login"];

function withSupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  // Keep legacy email sessions working; Google uses Supabase cookies.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const legacySession = await verifySessionToken(token);
  const isAuthed = Boolean(user || legacySession);

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isAuthed && !isPublic) {
    const url = new URL("/login", request.nextUrl);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return withSupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (isAuthed && isPublic) {
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(new URL("/", request.nextUrl)),
    );
  }

  return supabaseResponse;
}

export const config = {
  /*
   * Skip the API (the auth routes must stay reachable while signed out),
   * Next's internals, and static files.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
