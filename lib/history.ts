import { DESTINATIONS } from "@/lib/data";
import { isIsoDate, nightsBetween, todayIso } from "@/lib/dates";
import { isTravelled, tripSpend } from "@/lib/store";
import type { Destination, Trip, TripStatus } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Travel history                                                      */
/*                                                                     */
/* Everything the dashboard claims about where someone has been is      */
/* counted here, from trips they created. Nothing is assumed and        */
/* nothing is invented: a user with no trips has an empty history, and  */
/* the UI is expected to say so rather than show a zero dressed up as   */
/* an achievement.                                                      */
/*                                                                     */
/* Pure functions only, so this runs the same on the server and in a    */
/* test.                                                                */
/* ------------------------------------------------------------------ */

export interface VisitedPlace {
  destination: Destination;
  /** How many completed trips went here. */
  visits: number;
  /** Nights actually spent, summed across those trips. */
  nights: number;
  /** ISO date of the most recent visit, "" when the trip had no dates. */
  lastVisit: string;
}

export interface TravelHistory {
  /** Trips that have happened, most recent first. */
  completed: Trip[];
  /** Distinct places visited, most visited first. */
  places: VisitedPlace[];
  countries: string[];
  regions: string[];
  /** Vibe → how many completed trips featured it. Drives "more like this". */
  vibeCounts: Record<string, number>;
  totalNights: number;
  totalSpend: number;
  /** Average nights per completed trip, rounded. 0 when nothing is dated. */
  averageNights: number;
  /** Completed trips that started in the last 365 days. */
  tripsThisYear: number;
  /** The most recent completed trip, if there is one. */
  latest: Trip | null;
  /** True when the user has never completed a trip. */
  isEmpty: boolean;
}

const EMPTY: TravelHistory = {
  completed: [],
  places: [],
  countries: [],
  regions: [],
  vibeCounts: {},
  totalNights: 0,
  totalSpend: 0,
  averageNights: 0,
  tripsThisYear: 0,
  latest: null,
  isEmpty: true,
};

function destinationFor(trip: Trip): Destination | undefined {
  return (
    DESTINATIONS.find((d) => d.id === trip.destinationId) ??
    DESTINATIONS.find(
      (d) => d.country.toLowerCase() === trip.country.trim().toLowerCase(),
    )
  );
}

/**
 * Reduce a trip list to what actually happened.
 *
 * A trip counts as travel when the user marked it completed *or* its end date
 * has passed — someone who logs last year's holiday should see it on the
 * globe without having to remember to flip a status.
 */
export function buildHistory(trips: Trip[], today = todayIso()): TravelHistory {
  const completed = trips
    .filter((trip) => isTravelled(trip, today))
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));

  if (!completed.length) return EMPTY;

  const byDestination = new Map<string, VisitedPlace>();
  const vibeCounts: Record<string, number> = {};
  let totalNights = 0;
  let totalSpend = 0;
  let datedTrips = 0;
  let tripsThisYear = 0;

  const yearAgo = new Date(`${today}T12:00:00Z`);
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  const yearAgoIso = yearAgo.toISOString().slice(0, 10);

  completed.forEach((trip) => {
    const nights =
      isIsoDate(trip.startDate) && isIsoDate(trip.endDate)
        ? nightsBetween(trip.startDate, trip.endDate)
        : 0;

    if (nights > 0) {
      totalNights += nights;
      datedTrips += 1;
    }
    totalSpend += tripSpend(trip);
    if (isIsoDate(trip.startDate) && trip.startDate >= yearAgoIso) {
      tripsThisYear += 1;
    }

    const destination = destinationFor(trip);
    if (!destination) return;

    destination.vibes.forEach((vibe) => {
      vibeCounts[vibe] = (vibeCounts[vibe] ?? 0) + 1;
    });

    const existing = byDestination.get(destination.id);
    if (existing) {
      existing.visits += 1;
      existing.nights += nights;
      if (trip.startDate > existing.lastVisit) existing.lastVisit = trip.startDate;
    } else {
      byDestination.set(destination.id, {
        destination,
        visits: 1,
        nights,
        lastVisit: isIsoDate(trip.startDate) ? trip.startDate : "",
      });
    }
  });

  const places = [...byDestination.values()].sort(
    (a, b) => b.visits - a.visits || b.nights - a.nights,
  );

  return {
    completed,
    places,
    countries: [...new Set(places.map((place) => place.destination.country))],
    regions: [...new Set(places.map((place) => place.destination.region))],
    vibeCounts,
    totalNights,
    totalSpend,
    averageNights: datedTrips ? Math.round(totalNights / datedTrips) : 0,
    tripsThisYear,
    latest: completed[0] ?? null,
    isEmpty: false,
  };
}

/* ------------------------------------------------------------------ */
/* Trips that have not happened yet                                     */
/* ------------------------------------------------------------------ */

export interface PlannedPlace {
  destination: Destination;
  tripId: string;
  title: string;
  /** ISO start date, or "" for a trip with no dates agreed yet. */
  startDate: string;
  status: TripStatus;
}

/**
 * Where the user is going next, one entry per destination.
 *
 * Undated trips are included rather than filtered out — someone planning a
 * trip to Japan wants to see Japan light up on the globe before they have
 * settled on a week. They simply sort last.
 */
export function plannedPlaces(trips: Trip[], today = todayIso()): PlannedPlace[] {
  const byDestination = new Map<string, PlannedPlace>();

  trips
    .filter((trip) => !isTravelled(trip, today))
    .forEach((trip) => {
      const destination = destinationFor(trip);
      if (!destination) return;

      const entry: PlannedPlace = {
        destination,
        tripId: trip.id,
        title: trip.title,
        startDate: isIsoDate(trip.startDate) ? trip.startDate : "",
        status: trip.status,
      };

      // Two trips to the same place: the sooner one owns the pin.
      const existing = byDestination.get(destination.id);
      if (
        !existing ||
        (entry.startDate && (!existing.startDate || entry.startDate < existing.startDate))
      ) {
        byDestination.set(destination.id, entry);
      }
    });

  return [...byDestination.values()].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate.localeCompare(b.startDate);
  });
}

/** The vibes someone keeps going back to, strongest first. */
export function favouriteVibes(history: TravelHistory, limit = 3): string[] {
  return Object.entries(history.vibeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([vibe]) => vibe);
}

export function hasVisited(history: TravelHistory, destinationId: string): boolean {
  return history.places.some((place) => place.destination.id === destinationId);
}
