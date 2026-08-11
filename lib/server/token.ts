/**
 * Signed session tokens.
 *
 * Format: base64url(payload).base64url(hmac-sha256)
 * Built on Web Crypto so the exact same code verifies in a route handler
 * (Node) and in proxy.ts, without a dependency.
 *
 * This is a signed token, not an encrypted one: the payload is readable by
 * anyone holding the cookie. It only carries a user id and an expiry, and the
 * cookie is httpOnly, so that is fine. Never put secrets in here.
 */

const DEV_SECRET = "wanderly-development-secret-change-me";

export interface SessionPayload {
  /** user id */
  sub: string;
  /** issued at, seconds */
  iat: number;
  /** expires at, seconds */
  exp: number;
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with: openssl rand -base64 32",
    );
  }
  return DEV_SECRET;
}

/* ---------------------------- base64url ---------------------------- */

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  // Allocate over a real ArrayBuffer so the result satisfies BufferSource.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/* ------------------------------ hmac ------------------------------- */

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/* ------------------------------ api -------------------------------- */

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function createSessionToken(
  userId: string,
  maxAgeSeconds = SESSION_MAX_AGE_SECONDS,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(getAuthSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await hmacKey(getAuthSecret());
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as SessionPayload;

    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

/* --------------------------- misc helpers --------------------------- */

export function randomToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return toBase64Url(array);
}

/** PKCE S256 challenge for the Google authorization request. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return toBase64Url(new Uint8Array(digest));
}

export const SESSION_COOKIE = "wanderly_session";
export const OAUTH_STATE_COOKIE = "wanderly_oauth";
