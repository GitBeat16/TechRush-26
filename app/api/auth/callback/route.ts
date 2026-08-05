import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Where Supabase sends the browser back after Google sign-in. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[callback] exchange failed:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }

  const profile = await ensureProfile(supabase, data.user);
  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }

  // Straight to the questionnaire on a first sign-in, so the dashboard is
  // never rendered against empty preferences.
  const destination = profile.onboardingCompleted ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
