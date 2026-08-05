import { pkceChallenge } from "@/lib/server/token";

/**
 * Google OAuth 2.0, authorization code flow with PKCE.
 *
 * Three hops:
 *   1. we redirect the user to Google with a state + code_challenge
 *   2. Google redirects back with ?code and the same state
 *   3. we POST that code to Google's token endpoint and get an id_token
 *
 * No SDK needed — it is two URLs and a fetch.
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export function googleConfig() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/** The redirect URI must match the one registered in Google Cloud exactly. */
export function redirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export async function buildAuthUrl(options: {
  origin: string;
  state: string;
  verifier: string;
}): Promise<string> {
  const { clientId } = googleConfig();
  const challenge = await pkceChallenge(options.verifier);

  const params = new URLSearchParams({
    client_id: clientId ?? "",
    redirect_uri: redirectUri(options.origin),
    response_type: "code",
    scope: "openid email profile",
    state: options.state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  id_token?: string;
  access_token?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(options: {
  code: string;
  origin: string;
  verifier: string;
}): Promise<GoogleIdentity> {
  const { clientId, clientSecret } = googleConfig();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      code: options.code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri(options.origin),
      code_verifier: options.verifier,
    }),
  });

  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || !payload.id_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? "Token exchange failed",
    );
  }

  return decodeIdToken(payload.id_token);
}

/**
 * We received this token directly from Google's token endpoint over TLS, so
 * Google's own documentation says signature verification is not required here.
 * Anything arriving by another route must be verified against Google's JWKS.
 */
function decodeIdToken(idToken: string): GoogleIdentity {
  const [, payloadPart] = idToken.split(".");
  if (!payloadPart) throw new Error("Malformed id_token");

  const normalised = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(normalised, "base64").toString("utf8");
  const claims = JSON.parse(json) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
    aud?: string;
  };

  if (!claims.sub || !claims.email) {
    throw new Error("id_token is missing sub or email");
  }

  const { clientId } = googleConfig();
  if (clientId && claims.aud && claims.aud !== clientId) {
    throw new Error("id_token was not issued for this client");
  }

  return {
    googleId: claims.sub,
    email: claims.email,
    emailVerified:
      claims.email_verified === true || claims.email_verified === "true",
    name: claims.name,
    picture: claims.picture,
  };
}
