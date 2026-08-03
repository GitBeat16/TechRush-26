# Wanderly

A claymorphism AI travel planner — Next.js App Router, TypeScript, Tailwind CSS v4, Framer Motion, Rive-ready.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sign in with the demo account:** `srushti@wanderly.app` / `wanderly`
(the login screen has a button that fills it in), or create your own.

Copy `.env.example` to `.env.local` to switch on the optional pieces:

- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` — real Google sign-in ([setup](docs/AUTH.md))
- `ANTHROPIC_API_KEY` — real AI itineraries; without it `/api/plan` uses a
  built-in offline planner and everything still works
- `AUTH_SECRET` — required in production, has a dev fallback locally

## Routes

| Route | What it does |
| --- | --- |
| `/login` | Sign in / create account, Google, avatar picker. The only public route |
| `/` | Overview: greeting, current trip, shortcuts, recommendations, stats |
| `/plan` | AI trip generation, saved straight into a real trip |
| `/explore` | Browse and filter destinations, bookmark them |
| `/trips` | All trips, filtered by status |
| `/trips/[id]` | One trip: Overview, Itinerary, Packing, Budget |
| `/compare` | Two destinations side by side across six signals |
| `/profile` | Stats, achievements, saved places, settings |
| `/api/plan` | Server route that calls the model, with an offline fallback |
| `/api/auth/*` | signup, login, logout, me, profile, google, google/callback |

## Structure

```
app/
  layout.tsx             fonts, metadata, mounts the AppShell
  page.tsx               home
  plan|explore|trips|compare|profile/   one folder per section
  trips/[id]/page.tsx    trip detail with tabs
  api/plan/route.ts      AI endpoint (server only, key never ships)
  globals.css            clay design tokens

components/
  shell/                 persists across routes
    AppShell  Navbar  Sidebar  MobileDock  PageHeader
  Dashboard/             the big feature blocks
    HeroSection  TripCard  AIPlanner  DestinationCard
    PackingChecklist  ComparisonCard  TravelStats  RiveCharacter
  trip/                  inside a single trip
    ItineraryBuilder  BudgetTracker
  explore/ plan/         route-specific views that read search params
  ui/                    generic clay primitives
    ClayCard  ClayButton  ClayIllustrations  Icons

lib/
  store.ts               app state + localStorage persistence
  animations.ts          springs, variants, idle loops
  feedback.ts            procedural sound + haptics
  tones.ts  nav.ts  data.ts

types/dashboard.ts       the shared vocabulary
```

## Auth

Real server-side authentication, no auth library.

- **Sessions** — HMAC-SHA256 signed token in an httpOnly, sameSite=lax cookie
  (`lib/server/token.ts`). The browser never holds a credential.
- **Passwords** — scrypt from `node:crypto`, per-user salt, parameters stored
  with the hash so the cost can be raised later, `timingSafeEqual` comparison.
- **Google** — OAuth 2.0 authorization code flow with PKCE and a state check
  (`lib/server/google.ts`). Add two env vars and it is live.
- **Route protection** — `proxy.ts` (Next 16's middleware) verifies the cookie
  before a protected page renders at all.
- **Users** — `lib/server/users.ts`, a JSON file with a narrow interface so a
  database swap touches one file.

Twelve clay traveler avatars live in `lib/avatars.ts` (data) and
`components/ui/ClayAvatar.tsx` (renderer), config-driven from shared parts.

Setup, error table and production checklist: [docs/AUTH.md](docs/AUTH.md).

## State and persistence

`lib/store.ts` is a single module-level store read through
`useSyncExternalStore`. The server always renders the seed data and the client
swaps in whatever `localStorage` holds — React handles that handover during
hydration, so there is no mismatch warning and no `setState` inside an effect.

```ts
import { useAppState, useTrip, actions } from "@/lib/store";

const { trips } = useAppState();
actions.addExpense(tripId, { label: "Dinner", amount: 1400, ... });
```

Everything you change — packing, itinerary, expenses, bookmarks, milestones —
survives a refresh. Reset from Profile → Settings → Reset data.

## Design system

Tokens live in `app/globals.css`:

- `bg-clay-*` pastel surfaces and accents
- `rounded-clay-sm | clay | clay-lg | clay-xl` (22 → 50px)
- `shadow-clay-xs | sm | clay | lg | hover | pressed | inset | inset-sm`

Depth always comes from the four-part clay shadow (outer drop, outer light,
inner top highlight, inner bottom occlusion) rather than gradients.

## Motion rules

Two rules, both learned the hard way and documented in
`Wanderly-Stack-Explained.pdf`:

1. Any animation with three or more keyframes must set `type: "tween"`.
   Framer Motion defaults transforms to springs, which only support two.
2. When you spread an idle-loop helper (`floatY`, `breathe`, `floatDrift`)
   onto an element, put gesture transitions *inside* `whileHover` / `whileTap`.
   A sibling `transition` prop written after the spread replaces it.

## Sound and haptics

`lib/feedback.ts` synthesises every UI sound with WebAudio at press time — no
audio assets, nothing loads until the first user gesture. Haptics use
`navigator.vibrate` where supported. Both toggle from the navbar or Profile.

```ts
import { feedback } from "@/lib/feedback";
feedback("press"); // tap | press | toggleOn | toggleOff | success | whoosh | pop | nav
```

## Adding the Rive character

Drop a `.riv` file into `public/rive/` and pass it through:

```tsx
<RiveCharacter src="/rive/wanderly-guide.riv" stateMachine="State Machine 1" size={280} />
```

Without `src` the component renders the hand-modelled clay guide, so the
layout never shifts when the real rig lands.
