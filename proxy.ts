import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Server-side route protection.
 *
 * In Next 16 this file replaces middleware.ts and runs on the Node runtime.
 * Checking here means a signed-out visitor never receives the HTML for a
 * protected page at all — the client-side gate in AppShell is only there to
 * keep the transition smooth.
 *
 * Supabase is the single source of truth for "is this request signed in".
 * It has to agree with /api/auth/me, or the two gates bounce the user
 * between /login and / forever.
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

  const isAuthed = Boolean(user);
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
