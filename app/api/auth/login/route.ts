import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * A very small in-memory throttle. It resets when the server restarts and does
 * not survive multiple instances — a real deploy wants Redis or the platform's
 * own rate limiter — but it stops casual password guessing in development.
 */
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function throttled(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required", field: "email" },
      { status: 400 },
    );
  }

  if (throttled(email)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const message = (error?.message ?? "").toLowerCase();

    if (message.includes("email not confirmed")) {
      return NextResponse.json(
        { error: "Confirm your email first — check your inbox.", field: "email" },
        { status: 401 },
      );
    }

    // Same message whether the email or the password was wrong, so the
    // endpoint cannot be used to discover which addresses have accounts.
    return NextResponse.json(
      { error: "Email or password is incorrect", field: "password" },
      { status: 401 },
    );
  }

  attempts.delete(email);

  const profile = await ensureProfile(supabase, data.user);
  if (!profile) {
    return NextResponse.json(
      { error: "Signed in, but your profile could not be loaded" },
      { status: 500 },
    );
  }

  return NextResponse.json({ user: profile });
}
