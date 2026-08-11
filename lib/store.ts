"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DESTINATIONS } from "@/lib/data";
import {
  addDays,
  isIsoDate,
  isWithin,
  todayIso,
  toIsoDate,
  tripLength,
} from "@/lib/dates";
import { makeTraveler, toneForIndex } from "@/lib/travelers";
import type { PackableIcon } from "@/lib/packing";
import type {
  Expense,
  GeneratedPlan,
  ItineraryItem,
  PackingCategory,
  Trip,
  Traveler,
  TripStatus,
} from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Wanderly app store                                                  */
/*                                                                     */
/* A single module-level store read through useSyncExternalStore.      */
/* The server always sees SEED, the client sees whatever localStorage  */
/* holds — React handles that handover during hydration, so there is   */
/* no mismatch warning and no setState-in-effect.                      */
/* ------------------------------------------------------------------ */

export interface AppState {
  trips: Trip[];
  savedDestinationIds: string[];
  lastPlan: GeneratedPlan | null;
  activeDestinationId: string;
}

const STORAGE_KEY = "wanderly:state:v1";

/**
 * The empty app.
 *
 * There is no demo trip here on purpose. Every number the dashboard shows —
 * countries visited, nights away, the pins on the globe — is counted from
 * trips the user actually created, so seeding one would make all of it a
 * lie on first run. An empty dashboard that says "no trips yet" is more
 * useful than a full one describing someone else's holiday.
 */
const SEED: AppState = {
  trips: [],
  savedDestinationIds: [],
  lastPlan: null,
  activeDestinationId: DESTINATIONS[0].id,
};

let state: AppState = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

/* --------------------------- persistence --------------------------- */

/**
 * Bring a stored trip up to the current shape.
 *
 * Dates used to be display strings ("14 Oct 2026", or the placeholder
 * "Dates to set"). They are ISO now, so anything already on disk is parsed
 * once here rather than being guessed at on every read. Whatever cannot be
 * understood becomes "", which the UI shows as "dates not set" — an honest
 * empty is better than an invented date.
 */
function migrateTrip(trip: Trip): Trip {
  const startDate = toIsoDate(trip.startDate);
  const endDate = toIsoDate(trip.endDate);
  if (startDate === trip.startDate && endDate === trip.endDate) return trip;

  return {
    ...trip,
    startDate,
    endDate,
    days: startDate && endDate ? tripLength(startDate, endDate) : trip.days,
  };
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    state = {
      trips: Array.isArray(parsed.trips) ? parsed.trips.map(migrateTrip) : SEED.trips,
      savedDestinationIds: Array.isArray(parsed.savedDestinationIds)
        ? parsed.savedDestinationIds
        : SEED.savedDestinationIds,
      lastPlan: parsed.lastPlan ?? null,
      activeDestinationId: typeof parsed.activeDestinationId === "string" ? parsed.activeDestinationId : SEED.activeDestinationId,
    };
  } catch {
    /* corrupt or blocked storage — fall back to the seed */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — the app still works, it just forgets */
  }
}

/* ------------------------------ syncing ---------------------------- */

/**
 * Set by lib/sync/trips.ts once the user is signed in. The store stays
 * completely unaware of Supabase — it just announces that trips changed, and
 * whoever cares can push them. That keeps the store usable signed-out and
 * offline, with localStorage as the fallback it always was.
 */
type SyncHandler = (next: Trip[], previous: Trip[]) => void;

let syncHandler: SyncHandler | null = null;

export function registerTripSync(handler: SyncHandler | null) {
  syncHandler = handler;
}

function commit(next: AppState, options: { silent?: boolean } = {}) {
  const previousTrips = state.trips;
  state = next;
  persist();

  // `silent` is set when the change *came from* the server — echoing it
  // straight back would be a pointless round trip and a write loop.
  if (!options.silent && syncHandler && next.trips !== previousTrips) {
    syncHandler(next.trips, previousTrips);
  }

  listeners.forEach((listener) => listener());
}

/** Convenience: replace one trip, leaving the rest untouched. */
function patchTrip(tripId: string, update: (trip: Trip) => Trip) {
  commit({
    ...state,
    trips: state.trips.map((trip) => (trip.id === tripId ? update(trip) : trip)),
  });
}

/* ----------------------------- reading ----------------------------- */

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppState {
  hydrate();
  return state;
}

function getServerSnapshot(): AppState {
  return SEED;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * The current trips, read without subscribing. For code that needs a one-off
 * snapshot — the sync layer at start-up — rather than a live binding.
 */
export function readTrips(): Trip[] {
  hydrate();
  return state.trips;
}

export function useTrip(tripId: string | undefined) {
  const { trips } = useAppState();
  return trips.find((trip) => trip.id === tripId);
}

/**
 * The trip the dashboard treats as "current".
 *
 * Preference order: one happening right now, then the soonest future trip,
 * then anything still being planned, then the most recent trip of any kind.
 * Dated trips beat undated ones, because "leaves in nine days" is a stronger
 * claim on the hero than "someday".
 *
 * Returns undefined when there are no trips at all — which is reachable, since
 * a user can delete every one of them. The old signature claimed `Trip` and
 * silently handed callers an undefined, which crashed the hero on render.
 */
export function useActiveTrip(): Trip | undefined {
  const { trips } = useAppState();
  return pickActiveTrip(trips);
}

export function pickActiveTrip(trips: Trip[], today = todayIso()): Trip | undefined {
  if (!trips.length) return undefined;

  const dated = trips.filter((trip) => isIsoDate(trip.startDate));

  const inProgress = dated
    .filter((trip) => isWithin(today, trip.startDate, trip.endDate))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (inProgress) return inProgress;

  const upcoming = dated
    .filter((trip) => trip.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (upcoming) return upcoming;

  return (
    trips.find((trip) => trip.status === "planning") ??
    dated.sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ??
    trips[0]
  );
}

/**
 * Has this trip actually happened? Either the user marked it completed, or
 * its end date is behind us. Used by the shelf, the globe and the "made for
 * you" ranking, all of which count real travel rather than intentions.
 */
export function isTravelled(trip: Trip, today = todayIso()): boolean {
  if (trip.status === "completed") return true;
  const end = trip.endDate || trip.startDate;
  return isIsoDate(end) && end < today;
}

/** Trips still ahead of us, soonest first. Undated trips sort last. */
export function upcomingTrips(trips: Trip[], today = todayIso()): Trip[] {
  return trips
    .filter((trip) => !isTravelled(trip, today))
    .sort((a, b) => {
      if (!isIsoDate(a.startDate)) return 1;
      if (!isIsoDate(b.startDate)) return -1;
      return a.startDate.localeCompare(b.startDate);
    });
}

export function useSavedDestinations() {
  const { savedDestinationIds } = useAppState();
  const saved = useCallback(
    (id: string) => savedDestinationIds.includes(id),
    [savedDestinationIds],
  );
  return { savedDestinationIds, isSaved: saved };
}

export function useActiveDestination() {
  const { activeDestinationId } = useAppState();
  const query = (activeDestinationId || "").trim().toLowerCase();
  const activeDestination = DESTINATIONS.find(
    (d) => d.id.toLowerCase() === query || d.name.toLowerCase() === query || d.country.toLowerCase() === query
  ) || DESTINATIONS[0];
  return { activeDestinationId: activeDestination.id, activeDestination };
}

/* ----------------------------- writing ----------------------------- */

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const actions = {
  /* destinations ---------------------------------------------------- */
  setActiveDestination(id: string) {
    if (!id) return;
    const query = id.trim().toLowerCase();
    const matched = DESTINATIONS.find(
      (d) => d.id.toLowerCase() === query || d.name.toLowerCase() === query || d.country.toLowerCase() === query
    );
    const targetId = matched ? matched.id : id;
    commit({
      ...state,
      activeDestinationId: targetId,
    });
  },

  toggleSavedDestination(id: string) {
    const has = state.savedDestinationIds.includes(id);
    commit({
      ...state,
      savedDestinationIds: has
        ? state.savedDestinationIds.filter((saved) => saved !== id)
        : [...state.savedDestinationIds, id],
    });
  },

  /* packing --------------------------------------------------------- */
  setPacked(tripId: string, itemId: string, packed: boolean) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      packing: trip.packing.map((item) =>
        item.id === itemId ? { ...item, packed } : item,
      ),
    }));
  },

  addPackingItem(
    tripId: string,
    label: string,
    category: PackingCategory,
    icon?: PackableIcon,
  ) {
    const clean = label.trim();
    if (!clean) return;
    patchTrip(tripId, (trip) => {
      // The same thing twice helps nobody, and a suggestion the user has
      // already added should be able to tell that it is already in the bag.
      const duplicate = trip.packing.some(
        (item) => item.label.toLowerCase() === clean.toLowerCase(),
      );
      if (duplicate) return trip;

      return {
        ...trip,
        packing: [
          ...trip.packing,
          { id: uid("pk"), label: clean, category, packed: false, icon },
        ],
      };
    });
  },

  removePackingItem(tripId: string, itemId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      packing: trip.packing.filter((item) => item.id !== itemId),
    }));
  },

  /* milestones ------------------------------------------------------ */
  toggleMilestone(tripId: string, milestoneId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      milestones: trip.milestones.map((milestone) =>
        milestone.id === milestoneId
          ? { ...milestone, done: !milestone.done }
          : milestone,
      ),
    }));
  },

  /* itinerary ------------------------------------------------------- */
  addDay(tripId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: [
        ...trip.itinerary,
        {
          id: uid("day"),
          label: `Day ${trip.itinerary.length + 1} · New day`,
          date: "",
          items: [],
        },
      ],
    }));
  },

  removeDay(tripId: string, dayId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.filter((day) => day.id !== dayId),
    }));
  },

  renameDay(tripId: string, dayId: string, label: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.map((day) =>
        day.id === dayId ? { ...day, label } : day,
      ),
    }));
  },

  addActivity(tripId: string, dayId: string, item: Omit<ItineraryItem, "id">) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.map((day) =>
        day.id === dayId
          ? { ...day, items: [...day.items, { ...item, id: uid("act") }] }
          : day,
      ),
    }));
  },

  updateActivity(
    tripId: string,
    dayId: string,
    itemId: string,
    patch: Partial<ItineraryItem>,
  ) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.map((day) =>
        day.id === dayId
          ? {
              ...day,
              items: day.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : day,
      ),
    }));
  },

  removeActivity(tripId: string, dayId: string, itemId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.map((day) =>
        day.id === dayId
          ? { ...day, items: day.items.filter((item) => item.id !== itemId) }
          : day,
      ),
    }));
  },

  reorderDayItems(tripId: string, dayId: string, items: ItineraryItem[]) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      itinerary: trip.itinerary.map((day) =>
        day.id === dayId ? { ...day, items } : day,
      ),
    }));
  },

  /* travellers ------------------------------------------------------ */

  /** Add someone to the trip. They join every future split by default. */
  addTraveler(tripId: string, name: string, email?: string) {
    const clean = name.trim();
    if (!clean) return;
    patchTrip(tripId, (trip) => {
      // Same person twice would double their share of every expense.
      const duplicate = trip.travelers.some(
        (traveler) =>
          traveler.name.toLowerCase() === clean.toLowerCase() ||
          (email && traveler.email?.toLowerCase() === email.toLowerCase()),
      );
      if (duplicate) return trip;

      return {
        ...trip,
        travelers: [
          ...trip.travelers,
          makeTraveler(clean, trip.travelers.length, { email }),
        ],
      };
    });
  },

  /**
   * Remove someone, and repair the expenses they were part of.
   *
   * Two things have to happen or the settlement maths goes wrong: they must
   * come out of every splitWith list, and any expense they paid for has to be
   * reassigned — an expense whose payer no longer exists is money that
   * appears from nowhere.
   */
  removeTraveler(tripId: string, travelerId: string) {
    patchTrip(tripId, (trip) => {
      const target = trip.travelers.find((t) => t.id === travelerId);
      if (!target || target.isYou) return trip;
      if (trip.travelers.length <= 1) return trip;

      const remaining = trip.travelers.filter((t) => t.id !== travelerId);
      const fallback = remaining.find((t) => t.isYou) ?? remaining[0];

      return {
        ...trip,
        travelers: remaining,
        expenses: trip.expenses.map((expense) => {
          const splitWith = expense.splitWith.filter((id) => id !== travelerId);
          return {
            ...expense,
            paidBy: expense.paidBy === travelerId ? fallback.id : expense.paidBy,
            // An empty split would divide by zero — fall back to everyone.
            splitWith: splitWith.length
              ? splitWith
              : remaining.map((t) => t.id),
          };
        }),
      };
    });
  },

  renameTraveler(tripId: string, travelerId: string, name: string) {
    const clean = name.trim();
    if (!clean) return;
    patchTrip(tripId, (trip) => ({
      ...trip,
      travelers: trip.travelers.map((traveler) =>
        traveler.id === travelerId
          ? makeTraveler(clean, trip.travelers.indexOf(traveler), {
              id: traveler.id,
              email: traveler.email,
              isYou: traveler.isYou,
            })
          : traveler,
      ),
    }));
  },

  /** Replace the whole roster, used when the planner hands a trip over. */
  setTravelers(tripId: string, travelers: Traveler[]) {
    if (travelers.length === 0) return;
    patchTrip(tripId, (trip) => {
      const ids = new Set(travelers.map((t) => t.id));
      return {
        ...trip,
        travelers: travelers.map((traveler, index) => ({
          ...traveler,
          tone: toneForIndex(index),
        })),
        expenses: trip.expenses.map((expense) => {
          const splitWith = expense.splitWith.filter((id) => ids.has(id));
          return {
            ...expense,
            paidBy: ids.has(expense.paidBy) ? expense.paidBy : travelers[0].id,
            splitWith: splitWith.length ? splitWith : travelers.map((t) => t.id),
          };
        }),
      };
    });
  },

  /* expenses -------------------------------------------------------- */
  addExpense(tripId: string, expense: Omit<Expense, "id">) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      expenses: [{ ...expense, id: uid("exp") }, ...trip.expenses],
    }));
  },

  removeExpense(tripId: string, expenseId: string) {
    patchTrip(tripId, (trip) => ({
      ...trip,
      expenses: trip.expenses.filter((expense) => expense.id !== expenseId),
    }));
  },

  /* trips ----------------------------------------------------------- */
  setStatus(tripId: string, status: TripStatus) {
    patchTrip(tripId, (trip) => ({ ...trip, status }));
  },

  /**
   * Edit the things the calendar exposes: name, dates, status.
   *
   * Dates are kept consistent here rather than in the UI, so no caller can
   * produce a trip that ends before it starts:
   *   · moving the start past the end drags the end along, keeping the length
   *   · an end before the start is clamped to the start
   *   · `days` is recomputed whenever both ends are known
   */
  updateTripDetails(
    tripId: string,
    patch: {
      title?: string;
      startDate?: string;
      endDate?: string;
      status?: TripStatus;
      budget?: number;
    },
  ) {
    patchTrip(tripId, (trip) => {
      const next: Trip = { ...trip };

      if (patch.title !== undefined) {
        const clean = patch.title.trim();
        if (clean) next.title = clean;
      }
      if (patch.status !== undefined) next.status = patch.status;
      if (patch.budget !== undefined && patch.budget >= 0) {
        next.budget = Math.round(patch.budget);
      }

      if (patch.startDate !== undefined) {
        const start = toIsoDate(patch.startDate);
        const heldLength =
          isIsoDate(trip.startDate) && isIsoDate(trip.endDate)
            ? tripLength(trip.startDate, trip.endDate)
            : null;

        next.startDate = start;
        if (start && heldLength && isIsoDate(next.endDate) && next.endDate < start) {
          next.endDate = addDays(start, heldLength - 1);
        }
      }

      if (patch.endDate !== undefined) {
        const end = toIsoDate(patch.endDate);
        next.endDate =
          end && isIsoDate(next.startDate) && end < next.startDate
            ? next.startDate
            : end;
      }

      if (isIsoDate(next.startDate) && isIsoDate(next.endDate)) {
        // Clamped to the same range the trips table allows, so the local copy
        // and the stored one can never disagree about how long a trip is.
        next.days = Math.min(365, tripLength(next.startDate, next.endDate));
      }

      return next;
    });
  },

  /** Shift a whole trip by a number of days, keeping its length. Used by drag. */
  moveTrip(tripId: string, byDays: number) {
    if (!byDays) return;
    patchTrip(tripId, (trip) => {
      if (!isIsoDate(trip.startDate)) return trip;
      return {
        ...trip,
        startDate: addDays(trip.startDate, byDays),
        endDate: isIsoDate(trip.endDate)
          ? addDays(trip.endDate, byDays)
          : trip.endDate,
      };
    });
  },

  removeTrip(tripId: string) {
    commit({ ...state, trips: state.trips.filter((trip) => trip.id !== tripId) });
  },

  setLastPlan(plan: GeneratedPlan | null) {
    commit({ ...state, lastPlan: plan });
  },

  /**
   * Turn a generated plan into a real trip and return its id.
   *
   * `travelers` comes from the planner's "who's coming" step. If it is
   * omitted the trip is solo, which is the honest default — inheriting the
   * demo roster used to silently put three strangers on every new trip.
   */
  createTripFromPlan(
    plan: GeneratedPlan,
    budget: number,
    travelers?: Traveler[],
  ): string {
    const id = uid("trip");
    const match = DESTINATIONS.find(
      (destination) =>
        destination.name.toLowerCase() === plan.destination.toLowerCase(),
    );

    const trip: Trip = {
      id,
      title: plan.title,
      country: match?.country ?? plan.destination,
      destinationId: match?.id ?? "japan",
      // Empty rather than a placeholder string: "not set" is a real state,
      // and the calendar needs to be able to tell it apart from a date.
      startDate: "",
      endDate: "",
      days: plan.days.length,
      budget,
      currency: "INR",
      tone: match?.tone ?? "lilac",
      status: "planning",
      summary: plan.summary,
      travelers:
        travelers && travelers.length
          ? travelers.map((traveler, index) => ({
              ...traveler,
              tone: toneForIndex(index),
            }))
          : [makeTraveler("You", 0, { id: "self", isYou: true })],
      milestones: [
        { id: "m1", label: "Dates agreed", done: false },
        { id: "m2", label: "Flights booked", done: false },
        { id: "m3", label: "Stays confirmed", done: false },
        { id: "m4", label: "Packing done", done: false },
      ],
      itinerary: plan.days.map((day, dayIndex) => ({
        id: uid(`day${dayIndex}`),
        label: day.label,
        date: "",
        items: day.items.map((item) => ({
          ...item,
          id: uid(`act${dayIndex}`),
          done: false,
        })),
      })),
      packing: plan.packingSuggestions.map((label, index) => ({
        id: uid(`pk${index}`),
        label,
        category: "Essentials" as PackingCategory,
        packed: false,
      })),
      expenses: [],
    };

    commit({ ...state, trips: [trip, ...state.trips], lastPlan: null });
    return id;
  },

  reset() {
    commit(SEED);
  },

  /**
   * Adopt trips that came from the server. Silent, so this does not bounce
   * straight back out as a save.
   */
  adoptTrips(trips: Trip[]) {
    // Rows written before the ISO switch still hold display strings.
    commit({ ...state, trips: trips.map(migrateTrip) }, { silent: true });
  },
};

/* --------------------------- derived data --------------------------- */

export function tripSpend(trip: Trip): number {
  return trip.expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function tripPlannedCost(trip: Trip): number {
  return trip.itinerary.reduce(
    (total, day) =>
      total + day.items.reduce((sum, item) => sum + item.cost, 0),
    0,
  );
}

export function packedRatio(trip: Trip): number {
  if (!trip.packing.length) return 0;
  return trip.packing.filter((item) => item.packed).length / trip.packing.length;
}

/**
 * Overall readiness. Packing is half of it, milestones a third,
 * having any itinerary at all the rest.
 */
export function tripProgress(trip: Trip): number {
  const packed = packedRatio(trip);
  const milestones = trip.milestones.length
    ? trip.milestones.filter((milestone) => milestone.done).length /
      trip.milestones.length
    : 0;
  const planned = Math.min(
    1,
    trip.itinerary.filter((day) => day.items.length > 0).length /
      Math.max(1, Math.min(trip.days, 5)),
  );
  return Math.round((packed * 0.45 + milestones * 0.35 + planned * 0.2) * 100);
}

/** Equal-split settlement: who is owed, who owes. */
export function settlement(trip: Trip) {
  const balances = new Map<string, number>();
  trip.travelers.forEach((traveler) => balances.set(traveler.id, 0));

  trip.expenses.forEach((expense) => {
    const sharers = expense.splitWith.length
      ? expense.splitWith
      : trip.travelers.map((traveler) => traveler.id);
    const share = expense.amount / sharers.length;

    balances.set(expense.paidBy, (balances.get(expense.paidBy) ?? 0) + expense.amount);
    sharers.forEach((id) => {
      balances.set(id, (balances.get(id) ?? 0) - share);
    });
  });

  return trip.travelers.map((traveler) => ({
    traveler,
    balance: Math.round(balances.get(traveler.id) ?? 0),
  }));
}
