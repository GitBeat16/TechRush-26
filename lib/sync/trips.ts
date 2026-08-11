"use client";

import { ensureUuid } from "@/lib/ids";
import { actions, registerTripSync } from "@/lib/store";
import type { Trip } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Trip sync                                                           */
/*                                                                     */
/* localStorage remains the thing the UI reads from — it is instant and */
/* works offline. Supabase is the durable copy behind it. Writes are    */
/* optimistic: the store updates, the UI repaints, and the network      */
/* catches up. A failed push is retried on the next change rather than  */
/* blocking anything.                                                   */
/* ------------------------------------------------------------------ */

const PUSH_DEBOUNCE_MS = 900;

let started = false;
let pulling: Promise<void> | null = null;

/** Serialised snapshot of the last version we successfully pushed, per trip. */
const lastPushed = new Map<string, string>();

/** Pending debounce timers, keyed by trip id. */
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function fingerprint(trip: Trip): string {
  return JSON.stringify(trip);
}

/** Returns the server's canonical copy, or null if the write did not land. */
async function pushTrip(trip: Trip): Promise<Trip | null> {
  const id = ensureUuid(trip.id);
  try {
    const response = await fetch(`/api/trips/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trip }),
    });
    if (!response.ok) {
      // Worth a log rather than a silent fallback: a failed push leaves the
      // trip on its local id forever, which then looks like "sync is slow"
      // rather than "the write was rejected". A missing table GRANT, an RLS
      // refusal and an offline laptop are indistinguishable without this.
      const detail = await response.text().catch(() => "");
      console.error(
        `[sync] push failed for "${trip.title}" (${response.status}):`,
        detail.slice(0, 300),
      );
      throw new Error(String(response.status));
    }

    const saved = ((await response.json()) as { trip?: Trip }).trip ?? null;

    lastPushed.set(trip.id, fingerprint(trip));
    if (saved && saved.id !== trip.id) {
      // Record it under the canonical id too, so adopting the server copy
      // does not immediately look dirty and bounce straight back out.
      lastPushed.set(saved.id, fingerprint(saved));
    }

    return saved;
  } catch {
    // Leave lastPushed alone so the next edit retries this trip.
    return null;
  }
}

async function removeTrip(tripId: string) {
  try {
    await fetch(`/api/trips/${ensureUuid(tripId)}`, { method: "DELETE" });
    lastPushed.delete(tripId);
  } catch {
    /* the row survives; deleting again later will clear it */
  }
}

function schedulePush(trip: Trip) {
  const existing = timers.get(trip.id);
  if (existing) clearTimeout(existing);

  timers.set(
    trip.id,
    setTimeout(() => {
      timers.delete(trip.id);
      void pushTrip(trip);
    }, PUSH_DEBOUNCE_MS),
  );
}

/**
 * Reconcile local and remote once, at sign-in.
 *
 * If the account already has trips, they win — that is the shared truth, and
 * another device may have edited them. If it has none, the local trips (seed
 * or otherwise) are uploaded so the account starts out matching what the user
 * is looking at.
 */
async function pull(localTrips: Trip[]) {
  const response = await fetch("/api/trips", { cache: "no-store" });
  if (!response.ok) return;

  const { trips } = (await response.json()) as { trips: Trip[] };

  if (trips.length > 0) {
    trips.forEach((trip) => lastPushed.set(trip.id, fingerprint(trip)));
    actions.adoptTrips(trips);
    return;
  }

  // Sequential rather than Promise.all: a first sync is rare, and hammering
  // the API with a burst of full-trip writes is a good way to get rate limited.
  const uploaded: Trip[] = [];
  for (const trip of localTrips) {
    uploaded.push((await pushTrip(trip)) ?? trip);
  }

  // Adopt the server's version straight away. Local trips carry ids like
  // "trip-goa" while Postgres stores uuids; without this the two only
  // converge on the *next* visit, and until then /trips/<id> links point at
  // a row the API cannot find.
  if (uploaded.length) actions.adoptTrips(uploaded);
}

/**
 * Begin syncing. Idempotent — calling it again while a pull is in flight
 * returns the same promise rather than starting a second one.
 */
export function startTripSync(localTrips: Trip[]): Promise<void> {
  if (pulling) return pulling;

  if (!started) {
    started = true;
    registerTripSync((next, previous) => {
      // Anything that disappeared was deleted locally.
      previous
        .filter((trip) => !next.some((candidate) => candidate.id === trip.id))
        .forEach((trip) => void removeTrip(trip.id));

      // Anything whose content differs from what we last pushed is dirty.
      next
        .filter((trip) => lastPushed.get(trip.id) !== fingerprint(trip))
        .forEach(schedulePush);
    });
  }

  pulling = pull(localTrips)
    .catch(() => {
      /* offline — localStorage carries on, sync resumes on the next visit */
    })
    .finally(() => {
      pulling = null;
    });

  return pulling;
}

/** Tear down on sign-out so the next account does not inherit this one's state. */
export function stopTripSync() {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
  lastPushed.clear();
  registerTripSync(null);
  started = false;
}
