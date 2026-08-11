# Authentication

Wanderly has real, server-side authentication: email/password and Google
OAuth 2.0, with sessions in an httpOnly cookie. No auth library — the whole
thing is about 400 lines across `lib/server/`, which also makes it readable.

## Quick start

Email/password works immediately. Sign in with the seeded demo account:

```
srushti@wanderly.app / wanderly
```

Google needs credentials. Ten minutes of setup, below.

---

## How it works

### Sessions

`lib/server/token.ts` mints a token shaped `base64url(payload).base64url(hmac)`
where the payload is `{ sub, iat, exp }`, signed with HMAC-SHA256 using
`AUTH_SECRET`. It is built on Web Crypto, so the identical code verifies inside
a route handler and inside `proxy.ts`.

The token goes into a cookie that is:

- **httpOnly** — client JavaScript cannot read it, so an injected script cannot
  steal the session
- **sameSite=lax** — not sent on cross-site POSTs, which blocks CSRF
- **secure in production** — HTTPS only
- **30 days** max age

The payload is signed, not encrypted. Anyone holding the cookie can read the
user id inside it. That is fine, and it is why nothing secret goes in there.

### Passwords

`lib/server/password.ts` uses scrypt from `node:crypto` — memory-hard, so GPU
guessing is expensive. Each password gets a random 16-byte salt, and the
parameters are stored alongside the hash:

```
scrypt$65536$8$1$<salt hex>$<hash hex>
```

Storing the cost inline means you can raise it later without locking out
existing accounts — `verifyPassword` reads the parameters back off the record.
Comparison uses `timingSafeEqual`.

### Google OAuth

`lib/server/google.ts` implements the authorization code flow with PKCE:

```
GET /api/auth/google
  ├─ generate `state` (CSRF) and a PKCE `verifier`
  ├─ store both in a short-lived httpOnly cookie
  └─ redirect to accounts.google.com

  ... user picks an account ...

GET /api/auth/google/callback?code=...&state=...
  ├─ compare returned `state` with the cookie      ← blocks login CSRF
  ├─ POST the code + verifier to Google's token endpoint
  ├─ decode the id_token, check `aud` and email_verified
  ├─ find or create the user
  └─ set the session cookie, redirect home
```

The id_token arrives directly from Google's token endpoint over TLS, so per
Google's documentation its signature does not need separate verification. A
token arriving by any other path would have to be checked against Google's JWKS.

### Route protection

`proxy.ts` — Next 16's replacement for `middleware.ts`, running on the Node
runtime — verifies the cookie before any page renders. A signed-out visitor
never receives the HTML for a protected route, and a signed-in one is bounced
off `/login`. The client-side gate in `AppShell` only exists to keep the
transition smooth.

### Where users are stored

`lib/server/users.ts` keeps a JSON file at `.data/users.json` (gitignored),
read once into memory and written atomically via temp-file-and-rename.

**This works locally and on a single long-running server. It does not work on
Vercel, Netlify or any serverless platform**, where the filesystem is read-only
and instances are ephemeral. See "Going to production" below.

---

## Setting up Google sign-in

### 1. Create the OAuth client

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create
   a project
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill in app name, your support email, developer email
   - Scopes: the default `openid`, `email`, `profile` are enough
   - Add your own Google account under **Test users** while the app is unpublished
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins: `http://localhost:3000`
   - Authorised redirect URIs: `http://localhost:3000/api/auth/google/callback`
4. Copy the client ID and client secret

The redirect URI must match **character for character**, including the scheme
and port. A mismatch is the single most common cause of `redirect_uri_mismatch`.

### 2. Environment

Create `.env.local`:

```bash
AUTH_SECRET=            # openssl rand -base64 32
AUTH_GOOGLE_ID=         # ...apps.googleusercontent.com
AUTH_GOOGLE_SECRET=     # GOCSPX-...
```

Restart the dev server. The Google button now goes to the real consent screen.
Without these, `/api/auth/google` redirects back to `/login?error=google_not_configured`
and the login page explains what is missing.

### 3. Production

Add a second redirect URI in the same OAuth client:

```
https://your-domain.com/api/auth/google/callback
```

Set the same three variables in your host's environment. `AUTH_SECRET` is
required in production — the app throws on boot without it, deliberately, so a
missing secret fails loudly instead of silently signing every token with a
well-known development string.

---

## Errors you might hit

| What you see | Cause |
| --- | --- |
| `redirect_uri_mismatch` | The URI in Google Cloud does not exactly match `/api/auth/google/callback` on the origin you are using |
| `?error=google_not_configured` | `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` missing, or the server was not restarted |
| `?error=google_state` | The state cookie did not come back. Usually third-party cookie blocking, or you started the flow in another tab |
| `?error=google_expired` | More than ten minutes between pressing the button and returning |
| `access_blocked` on Google's screen | Your account is not in **Test users** and the app is unpublished |

---

## Going to production

Two things need replacing.

**1. User storage.** Reimplement the six exported functions in
`lib/server/users.ts` — `findByEmail`, `findById`, `createEmailUser`,
`upsertGoogleUser`, `updateUser`, `toProfile` — against a real database.
Postgres via Supabase, Neon or Prisma is the usual choice. Nothing else in the
app touches storage, which is the point of keeping that file narrow.

**2. Rate limiting.** `app/api/auth/login/route.ts` throttles in memory: ten
attempts per email per ten minutes. That resets on restart and does not span
instances. Move it to Redis (Upstash) or your platform's rate limiter.

Worth adding at the same time: email verification on signup, a password reset
flow, and session revocation (store a session id server-side so you can
invalidate it — signed tokens alone cannot be revoked before they expire).

## Should you use a library instead?

Probably, for anything with real users. Auth.js, Clerk, Better Auth and
WorkOS all give you password reset, MFA, session revocation and a dozen
providers for far less code than writing them yourself.

What you have here is deliberately small and readable — genuinely correct on
the parts it implements (PKCE, state, httpOnly cookies, scrypt, constant-time
comparison), and honest about the parts it does not. If you migrate later, the
seam is `lib/auth/session.ts` on the client and `lib/server/session.ts` on the
server; every component reads `useSession()` and nothing else.
