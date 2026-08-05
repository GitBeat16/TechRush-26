"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DESTINATIONS, SEED_TRIPS } from "@/lib/data";
import type {
  Expense,
  GeneratedPlan,
  ItineraryItem,
  PackingCategory,
  Trip,
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

const SEED: AppState = {
  trips: SEED_TRIPS,
  savedDestinationIds: ["japan"],
  lastPlan: null,
  activeDestinationId: "goa",
};

let state: AppState = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

/* --------------------------- persistence --------------------------- */

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    state = {
      trips: Array.isArray(parsed.trips) && parsed.trips.length ? parsed.trips : SEED.trips,
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

function commit(next: AppState) {
  state = next;
  persist();
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

export function useTrip(tripId: string | undefined) {
  const { trips } = useAppState();
  return trips.find((trip) => trip.id === tripId);
}

/** The trip the dashboard treats as "current": the next upcoming one. */
export function useActiveTrip(): Trip {
  const { trips } = useAppState();
  return (
    trips.find((trip) => trip.status === "upcoming") ??
    trips.find((trip) => trip.status === "planning") ??
    trips[0]
  );
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

  addPackingItem(tripId: string, label: string, category: PackingCategory) {
    const clean = label.trim();
    if (!clean) return;
    patchTrip(tripId, (trip) => ({
      ...trip,
      packing: [
        ...trip.packing,
        { id: uid("pk"), label: clean, category, packed: false },
      ],
    }));
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

  removeTrip(tripId: string) {
    commit({ ...state, trips: state.trips.filter((trip) => trip.id !== tripId) });
  },

  setLastPlan(plan: GeneratedPlan | null) {
    commit({ ...state, lastPlan: plan });
  },

  /** Turn a generated plan into a real trip and return its id. */
  createTripFromPlan(plan: GeneratedPlan, budget: number): string {
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
      startDate: "Dates to set",
      endDate: "",
      days: plan.days.length,
      budget,
      currency: "INR",
      tone: match?.tone ?? "lilac",
      status: "planning",
      summary: plan.summary,
      travelers: SEED_TRIPS[0].travelers.slice(0, 1),
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
