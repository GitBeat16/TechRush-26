# Wanderly

**A travel dashboard that adapts to you.**

Answer six questions when you sign up, and the whole interface reshapes around
them — the colour theme, the recommendations, even the character on the
homepage. As you take trips, it learns from those too. And the practical parts,
like what to pack, are built from the real forecast for your real dates.

Built for IEEE TechRush 26 · Frontend Development.

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. You will need a Supabase project first —
see [Setup](#setup) below.

---

## What it does

**It asks about you, once.** Six questions on the way in: what kind of places
you like, your weather, your budget, your travel style, how long you go for,
and who you go with. The last answer picks your colour theme, and you watch the
whole app re-skin as you choose.

**It recommends places, and shows its working.** Every destination is scored
against your answers *and* your past trips. Each card carries its reasons —
"In your budget", "New region for you", or the unflattering "You have been
here". Somewhere you visited last month drops 28 points, and it tells you that
is why.

**It packs your bag from the real weather.** Not a generic checklist. Inside 16
days it uses the live forecast for your dates; beyond that it pulls the same
calendar dates from last year's weather archive — and says which one you are
reading. Every suggestion states its reason: "lows near 4°C", "rain on 2 days".

**It shows you where you have been.** A globe you can grab and spin, with real
coastlines, a solid pin on every place you have visited and a hollow pulsing
one on every place you are going.

**It prices the trip, and refuses to lie about it.** The budget planner
estimates from destination, duration, party size and travel style, then lets
you model a different version of the trip — cheaper hotels, leaner style, fewer
paid activities — and watch the total move. What it will not do is optimise its
way to a number nobody could travel on: every destination carries a floor, and
below that the answer stops being "spend less" and becomes "change the trip".
It then tells you how — fewer days, fewer rooms, a quieter month, a cheaper
country. See [docs/BUDGET-FLOORS.md](docs/BUDGET-FLOORS.md).

**It remembers the trip afterwards.** Drop a folder of photos onto a trip and
they land as a pile of prints. Once there are enough, it offers a highlight
reel — each photo drifting in its own direction, captions riding over the
bottom. It does not claim to pick your best photos; it takes an even spread
across the pile, oldest to newest, which is the shape of the trip.

**It lets other people in.** Invite a companion to a trip by link, and the
itinerary, the budget split and the memories are shared.

**It never lies to you.** There is no demo data anywhere in this app. Every
number is counted from trips you actually created. A new account looks empty,
and each section explains what will fill it. If the weather service is down,
the card says so rather than showing a plausible-looking number.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Wanderly uses [Supabase](https://supabase.com) for accounts and for storing
trips. The free tier is plenty.

1. Create a project.
2. Open the **SQL Editor** and run the six files in `supabase/migrations/`, in
   filename order. They are safe to run more than once. The last one also
   creates the `photo_dumps` storage bucket used by Memories.
3. From **Project Settings → API**, copy the project URL and the publishable
   (anon) key.

### 3. Environment variables

```bash
cp .env.example .env.local
```

Then fill in what you need. Only the first two are required:

| Variable | Required | What it is for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **yes** | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **yes** | The publishable (anon) key |
| `AUTH_SECRET` | production | Session signing. Falls back to a dev string locally. `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | optional | Real AI itineraries. Without it `/api/plan` uses the built-in offline planner and everything still works |
| `WANDERLY_MODEL` | optional | Override the planner model |
| `GROQ_API_KEY` | optional | Real assistant chat. Without it `/api/chat` answers offline |
| `GROQ_MODEL` | optional | Override the chat model |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | optional | Google sign-in — see [docs/AUTH.md](docs/AUTH.md) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | optional | Enables the Google map view. The Leaflet map on `/explore` needs no key and works without this |

**Weather needs no key at all.** Wanderly uses
[Open-Meteo](https://open-meteo.com), which is free and keyless.

### 4. Run it

```bash
npm run dev
```

Create an account, answer the six questions, and plan a trip.

> **Tip for a demo:** the dashboard is at its best with some history. Create two
> trips with dates in the past and one a couple of weeks ahead — that fills the
> travel shelf, the calendar and the globe. And turn your volume on; every
> interaction has a sound.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server at `localhost:3000` |
| `npm run build` | Production build. Fails if TypeScript has errors |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npx tsc --noEmit` | Type-check everything without building |

---

## Routes

| Route | What it does |
| --- | --- |
| `/login` | Sign in, sign up, Google, avatar picker. The only public route |
| `/onboarding` | The six questions, with a live theme preview |
| `/` | The dashboard — hero, live weather, current trip, recommendations, calendar, travel shelf, globe |
| `/plan` | AI trip generation, saved straight into a real trip |
| `/explore` | Browse and filter destinations, with a map |
| `/destinations` | The six destination magazines |
| `/destinations/[slug]` | One magazine, with 3D page turns |
| `/trips` | All your trips |
| `/trips/[id]` | One trip: Overview, Itinerary, Packing, Budget |
| `/memories` | Photo dumps and highlight reels, per trip |
| `/budget` | The budget planner — estimate, allocation, ways to save, what-if |
| `/compare` | Two destinations side by side across six signals |
| `/assistant` | The travel assistant chat |
| `/profile` | Your details, preferences, theme picker, saved places |
| `/join/[code]` | Accepting an invite to somebody else's trip |

**API routes (19):** `/api/auth/*` (signup, login, logout, me, profile,
onboarding, google, callback), `/api/trips` and `/api/trips/[id]` (trip sync),
`/api/trips/[id]/photo-dumps` and `/api/trips/[id]/highlights` (memories),
`/api/trips/[id]/invites`, `/api/trips/invites/[code]` and `/api/trips/join`
(sharing), `/api/plan` (the planner), `/api/chat` (the assistant).

---

## Tech stack

| | |
| --- | --- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19 with the React Compiler, TypeScript |
| **Styling** | Tailwind CSS v4, with the palette as CSS variables |
| **Motion** | Framer Motion |
| **Sound** | WebAudio, synthesised — no audio files |
| **Data** | Supabase (Postgres + auth + storage), with `localStorage` in front |
| **Weather** | Open-Meteo — forecast, archive and geocoding, no key |
| **Globe** | `d3-geo` + `topojson-client` + `world-atlas`, drawn on canvas |
| **Maps** | Leaflet and MapLibre (free tiles), optional Google Maps |

**No UI component library.** Every card, button, input, icon and illustration
is hand-built — 64 SVG icons, 32 clay packing objects and 36 destination
doodles, across roughly 33,700 lines and 160-odd files.

---

## How it is put together

```
   What you see        components/     given data, draws it
        │
        ▼
   What is true        lib/store.ts    one place holding every trip
        │
        ▼
   What is saved       Supabase        catches up in the background
```

The rule: **components never talk to the database.** They read from the store,
which mirrors itself to `localStorage` and repaints instantly. The sync layer
pushes changes to Supabase in the background with a 900 ms debounce, and a
failed push simply retries on the next edit. The app works offline.

### Project structure

```
app/
  page.tsx              the dashboard — an ordered list of sections
  onboarding/           the six questions
  trips/[id]/           one trip: overview, itinerary, packing, budget
  api/                  server routes (auth, trips, plan, chat)
  globals.css           the palette, the four themes, the clay shadows

components/
  ui/                   ClayCard, ClayButton, Icons, ClayPackables — the blocks
  Dashboard/            hero, weather strip, calendar, globe, packing, stats
  shell/                the frame: sidebar, navbar, dock, auth gate
  trip/  budget/  map/  itinerary, expense splitting, maps
  theme/                the ambient sun / snow / rain layer

lib/
  store.ts              the single source of truth
  packing.ts            weather-driven packing rules
  personalize.ts        how destinations get scored
  history.ts            where you have been, from completed trips
  weather.ts            the three Open-Meteo calls
  globe.ts              world map loading + projection maths
  feedback.ts           the sound engine
  dates.ts              ISO dates, ranges, the calendar grid
  budget/               estimator, intelligence engine, feasibility floors
  highlights-ai.ts      building a reel out of a pile of photos
  photo-dumps.ts        upload, resize and store memories
  theme/                the theme provider
  sync/                 background sync to Supabase
  supabase/             server-side data access, one file per table

services/               outward-facing calls — weather, geocoding, Groq
types/                  shared shapes — Trip, UserProfile, Destination …
supabase/migrations/    the database, as SQL
public/geo/             the world map, served rather than bundled
```

A fuller walkthrough of how the pieces fit together is in
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## A few things we are proud of

**One attribute re-skins the entire app.** Every Tailwind utility compiles to a
CSS variable, so a theme is one `data-theme` attribute on `<html>` that
redefines them. Shadows, chips, buttons, bars and the ambient background all
change at once, with no re-render and no reload. An inline script applies your
saved theme before first paint so you never see a flash of the wrong colours.

**Nineteen sounds, zero audio files.** Every sound is a recipe — oscillators,
filters and envelopes — played through WebAudio. Nothing loads until your first
click, and both sound and vibration have toggles.

**A globe with real geography.** An orthographic projection over 110m world
data, drawn on canvas because 177 country outlines as DOM nodes drops frames.
Pins behind the sphere are culled by angular distance, so nothing shows through
the planet.

**Packing rules, not a model.** The obvious move is to ask a model what to
pack. We wrote deterministic rules over real forecast data instead, because a
packing list has to be checkable — "lows near 4°C" is either true or it is not,
and it works with no network and no key.

**A budget that knows what is impossible.** Trimming percentages off categories
will happily walk a total towards zero, which is a wrong answer delivered
confidently. Every destination carries a researched floor, priced per room
rather than per head, and optimising stops at a healthy line above it rather
than stripping the trip bare.

---

## Known gaps

We would rather write these down than have you find them.

- **Google Maps needs a key.** Without `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` the
  loader shows a message instead of a map. The Leaflet map on `/explore` works
  regardless.
- **Rive is wired but unused.** `RiveCharacter` can load a `.riv` file; we did
  not author one, so the mascot is animated SVG. Dropping a file in
  `public/rive/` and passing `src` is the only change needed.
- **There is no automated test suite.** The packing rules, date handling,
  projection maths and budget floors are all written as pure, deterministic
  modules precisely so they can be tested — but the tests are not written and
  nothing runs in CI. This is the first thing we would fix.
- **Accessibility is partial.** Reduce-motion, sound toggles and keyboard
  alternatives to drag are done. A full screen-reader and contrast audit is not.
- **The budget floors are estimates.** They come from published 2026 travel
  costs, not a live pricing API, and the flight numbers are the softest of them.
  Sources are listed in [docs/BUDGET-FLOORS.md](docs/BUDGET-FLOORS.md).

---

## Documentation

| Document | What is in it |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the pieces fit together |
| [docs/AUTH.md](docs/AUTH.md) | Authentication, including Google OAuth setup |
| [docs/BUDGET-FLOORS.md](docs/BUDGET-FLOORS.md) | Where the budget floors come from, and why the optimiser stops |

---

## Troubleshooting

**`Module not found: Can't resolve '@react-google-maps/api'`**
Run `npm install`. The map packages were added later than the rest.

**A theme flash on first load**
Check that the bootstrap script in `app/layout.tsx` is intact — it applies the
saved theme before React hydrates.

**"Could not find your home city"**
The geocoder needs a real place name. Set it in `/profile`.

**Weather cards say unavailable**
Open-Meteo needs network access. This is expected offline; the rest of the app
keeps working.

**A stale build after switching branches**
Delete `.next` and restart the dev server.

(We have the deployed one too...but if the api key is terminated..it might not work...you have to check it out locally :) )
https://tech-rush-26-amber.vercel.app
---

## The team

Vibhu · Anmol · Harsh · Srushti

**🏆 Winning project — IEEE TechRush 26 Hackathon.**
