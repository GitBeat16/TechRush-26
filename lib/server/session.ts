import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "@/lib/server/token";
import { findById, toProfile, type UserRecord } from "@/lib/server/users";
import type { UserProfile } from "@/types/auth";

/**
 * Cookie-backed sessions. The cookie is httpOnly, so client JavaScript — and
 * therefore any injected script — cannot read it. That is the main security
 * gain over keeping a session in localStorage.
 */

const secure = process.env.NODE_ENV === "production";

export async function startSession(userId: string) {
  const token = await createSessionToken(userId);
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
}

/** The signed-in user record, or undefined. */
export async function currentUser(): Promise<UserRecord | undefined> {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return undefined;
  return findById(payload.sub);
}

export async function currentProfile(): Promise<UserProfile | null> {
  const user = await currentUser();
  return user ? toProfile(user) : null;
}
