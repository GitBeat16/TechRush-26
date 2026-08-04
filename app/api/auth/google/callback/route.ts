import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, googleConfig } from "@/lib/server/google";
import { startSession } from "@/lib/server/session";
import { OAUTH_STATE_COOKIE } from "@/lib/server/token";
import { upsertGoogleUser } from "@/lib/server/users";

export const runtime = "nodejs";

/** Step 2 and 3: verify the round trip, swap the code for an identity. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, origin));

  if (!googleConfig().configured) return fail("google_not_configured");

  // The user pressed Cancel on Google's screen.
  if (params.get("error")) return fail("google_cancelled");

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return fail("google_failed");

  const store = await cookies();
  const raw = store.get(OAUTH_STATE_COOKIE)?.value;
  if (!raw) return fail("google_expired");

  let saved: { state: string; verifier: string; next: string };
  try {
    saved = JSON.parse(raw) as typeof saved;
  } catch {
    return fail("google_failed");
  }

  // The state check is what stops a cross-site request forgery on login.
  if (saved.state !== state) return fail("google_state");

  try {
    const identity = await exchangeCode({
      code,
      origin,
      verifier: saved.verifier,
    });

    if (!identity.emailVerified) return fail("google_unverified");

    const user = await upsertGoogleUser({
      googleId: identity.googleId,
      email: identity.email,
      name: identity.name,
      picture: identity.picture,
    });

    await startSession(user.id);
    store.delete(OAUTH_STATE_COOKIE);

    // Only ever redirect to a path on this site.
    const next = saved.next.startsWith("/") ? saved.next : "/";
    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    console.error("[google callback]", error);
    return fail("google_failed");
  }
}
