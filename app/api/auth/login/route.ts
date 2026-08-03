import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/server/password";
import { startSession } from "@/lib/server/session";
import { findByEmail, toProfile } from "@/lib/server/users";

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

function succeeded(key: string) {
  attempts.delete(key);
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

  const user = await findByEmail(email);

  if (user && user.provider === "google" && !user.passwordHash) {
    return NextResponse.json(
      {
        error: "This account uses Google. Continue with Google instead.",
        field: "email",
      },
      { status: 400 },
    );
  }

  // Same message whether the email or the password was wrong, so the endpoint
  // cannot be used to discover which addresses have accounts.
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Email or password is incorrect", field: "password" },
      { status: 401 },
    );
  }

  succeeded(email);
  await startSession(user.id);

  return NextResponse.json({ user: toProfile(user) });
}
