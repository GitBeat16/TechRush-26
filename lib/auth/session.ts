"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase/client";
import type {
  AuthSnapshot,
  OnboardingInput,
  ProfilePatch,
  SignInInput,
  SignUpInput,
  UserProfile,
} from "@/types/auth";

/* ------------------------------------------------------------------ */
/* Client session                                                      */
/*                                                                     */
/* The browser holds no credentials and no session token — those live  */
/* in an httpOnly cookie the server sets. This module is a thin cache  */
/* of "who am I", refreshed from /api/auth/me.                         */
/* ------------------------------------------------------------------ */

const LOADING: AuthSnapshot = { status: "loading", user: null };

let snapshot: AuthSnapshot = LOADING;
let googleEnabled = false;
let started = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function setUser(user: UserProfile | null) {
  snapshot = user
    ? { status: "authenticated", user }
    : { status: "unauthenticated", user: null };
  emit();
}

async function load() {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = (await response.json()) as {
      user: UserProfile | null;
      googleEnabled: boolean;
    };
    googleEnabled = Boolean(data.googleEnabled);
    setUser(data.user);
  } catch {
    // Offline or the route is down — treat as signed out rather than hanging.
    setUser(null);
  }
}

/**
 * The first component to subscribe kicks off the fetch. subscribe() runs
 * during commit, not render, so this stays out of the render path.
 */
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    void load();
  }
  return () => listeners.delete(listener);
}

function getSnapshot(): AuthSnapshot {
  return snapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return LOADING;
}

export function useSession(): AuthSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Re-read the session from the server, e.g. after returning from Google. */
export async function refreshSession() {
  await load();
}

/* ---------------------------- errors ----------------------------- */

export class AuthError extends Error {
  constructor(
    message: string,
    public field?: "name" | "email" | "password",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

async function post<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    field?: "name" | "email" | "password";
  } & T;

  if (!response.ok) {
    throw new AuthError(data.error ?? "Something went wrong", data.field);
  }
  return data;
}

/* ---------------------------- actions ---------------------------- */

export async function signUpWithEmail(input: SignUpInput): Promise<UserProfile> {
  const { user } = await post<{ user: UserProfile }>("/api/auth/signup", input);
  setUser(user);
  return user;
}

export async function signInWithEmail(input: SignInInput): Promise<UserProfile> {
  const { user } = await post<{ user: UserProfile }>("/api/auth/login", input);
  setUser(user);
  return user;
}

export async function updateProfile(patch: ProfilePatch): Promise<UserProfile> {
  const { user } = await post<{ user: UserProfile }>(
    "/api/auth/profile",
    patch,
    "PATCH",
  );
  setUser(user);
  return user;
}

export async function signOut() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    setUser(null);
  }
}

/** Full page navigation — OAuth cannot happen inside fetch. */
export async function startGoogleOAuth(next = "/") {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(safeNext)}`,
    },
  });

  if (error) {
    window.location.assign("/login?error=google_failed");
  }
}

export function isGoogleEnabled() {
  return googleEnabled;
}

/* --------------------------- validation --------------------------- */

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Cheap, honest strength meter: length plus variety. */
export function passwordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
} {
  if (password.length < 8) return { score: 0, label: "Too short" };

  let variety = 0;
  if (/[a-z]/.test(password)) variety += 1;
  if (/[A-Z]/.test(password)) variety += 1;
  if (/[0-9]/.test(password)) variety += 1;
  if (/[^A-Za-z0-9]/.test(password)) variety += 1;

  if (password.length >= 12 && variety >= 3) return { score: 3, label: "Strong" };
  if (variety >= 2) return { score: 2, label: "Good" };
  return { score: 1, label: "Weak" };
}

export const DEMO_CREDENTIALS = {
  email: "srushti@wanderly.app",
  password: "wanderly",
};

/** Human copy for the ?error= values the OAuth routes redirect back with. */
export const OAUTH_ERRORS: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not set up yet. Add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to .env.local — see docs/AUTH.md.",
  google_cancelled: "Google sign-in was cancelled.",
  google_expired: "That took too long. Please try Google again.",
  google_state: "The sign-in request could not be verified. Please try again.",
  google_unverified: "That Google account does not have a verified email.",
  google_failed: "Google sign-in failed. Please try again.",
};

export async function submitOnboarding(input: OnboardingInput): Promise<UserProfile> {
  const { user } = await post<{ user: UserProfile }>(
    "/api/auth/onboarding",
    input,
    "PATCH",
  );
  // Push the saved profile into the cache before navigating, or AppShell
  // still sees onboardingCompleted: false and bounces straight back here.
  setUser(user);
  return user;
}