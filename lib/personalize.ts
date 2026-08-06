import { DESTINATIONS } from "@/lib/data";
import { favouriteVibes, type TravelHistory } from "@/lib/history";
import type {
  BudgetTier,
  DestinationType,
  TravelGroup,
  TravelPreferences,
  TravelStyle,
  TripDuration,
} from "@/types/auth";
import type { Destination } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Personalisation                                                     */
/*                                                                     */
/* The questionnaire produces six answers. This module turns them into  */
/* the numbers and copy the dashboard actually needs: which places to   */
/* show first and why, what budget to prefill, how long a trip to       */
/* assume, and how many people are probably coming.                     */
/*                                                                     */
/* Everything here is pure, so it runs identically on server and        */
/* client and can be unit tested without a DOM.                         */
/* ------------------------------------------------------------------ */

/** Which destination vibes each "kind of place" answer rewards. */
const DESTINATION_VIBES: Record<DestinationType, string[]> = {
  beaches: ["Beaches", "Relaxed"],
  mountains: ["Hiking", "Nature", "Scenic"],
  heritage: ["Culture"],
  islands: ["Beaches", "Nature", "Scenic"],
  cities: ["Cities", "Food"],
};

/** Which vibes each travel style rewards. */
const STYLE_VIBES: Record<TravelStyle, string[]> = {
  relaxation: ["Relaxed", "Beaches"],
  adventure: ["Adventure", "Hiking", "Nature"],
  cultural: ["Culture", "Scenic"],
  food: ["Food"],
  nightlife: ["Cities"],
};

/** Rupee band each budget tier maps onto, used for scoring and prefills. */
export const BUDGET_BANDS: Record<BudgetTier, { min: number; max: number; typical: number }> = {
  budget: { min: 0, max: 55_000, typical: 40_000 },
  "mid-range": { min: 45_000, max: 115_000, typical: 85_000 },
  luxury: { min: 100_000, max: Number.POSITIVE_INFINITY, typical: 160_000 },
};

/** Day count each duration answer maps onto. */
export const DURATION_DAYS: Record<TripDuration, number> = {
  weekend: 3,
  "3-5-days": 5,
  "one-week": 7,
  "two-weeks-plus": 14,
};

/** How many people a group answer implies, the user included. */
export const GROUP_SIZE: Record<TravelGroup, number> = {
  solo: 1,
  partner: 2,
  friends: 4,
  family: 4,
};

export const GROUP_LABEL: Record<TravelGroup, string> = {
  solo: "Solo",
  partner: "With a partner",
  friends: "With friends",
  family: "With family",
};

export const STYLE_LABEL: Record<TravelStyle, string> = {
  relaxation: "Relaxation",
  adventure: "Adventure",
  cultural: "Cultural",
  food: "Food",
  nightlife: "Nightlife",
};

export const DURATION_LABEL: Record<TripDuration, string> = {
  weekend: "A weekend",
  "3-5-days": "3–5 days",
  "one-week": "About a week",
  "two-weeks-plus": "Two weeks or more",
};

export const DESTINATION_LABEL: Record<DestinationType, string> = {
  beaches: "Beaches",
  mountains: "Mountains",
  heritage: "Heritage",
  islands: "Islands",
  cities: "Cities",
};

export interface ScoredDestination {
  destination: Destination;
  /** 0-100. Not a probability, just a sortable fit number. */
  score: number;
  /** Short human explanations, at most three, for the "why" chips. */
  reasons: string[];
}

function overlap(vibes: string[], wanted: string[]): number {
  return vibes.filter((vibe) => wanted.includes(vibe)).length;
}

/**
 * Rank every destination against a set of preferences.
 *
 * Weights are deliberately lopsided: the kind of place someone likes matters
 * roughly twice as much as their budget, because a mismatch on scenery ruins
 * a trip in a way that a slightly expensive week does not.
 */
export function rankDestinations(
  preferences: TravelPreferences | null | undefined,
  history?: TravelHistory | null,
): ScoredDestination[] {
  // What someone has actually done outranks what they said in a form, so the
  // history adjustments below are applied last and can override the answers.
  const favourites = history ? favouriteVibes(history, 3) : [];

  const list = DESTINATIONS.map((destination) => {
    let score = 50;
    const reasons: string[] = [];

    if (!preferences) {
      return finish(destination, score, reasons, history, favourites);
    }

    /* ------------------------------------------- kind of place (max +30) */
    const wantedVibes = preferences.preferredDestinations.flatMap(
      (kind) => DESTINATION_VIBES[kind] ?? [],
    );
    const placeHits = overlap(destination.vibes, wantedVibes);
    if (placeHits > 0) {
      score += Math.min(30, placeHits * 15);
      const matched = preferences.preferredDestinations.find((kind) =>
        overlap(destination.vibes, DESTINATION_VIBES[kind] ?? []) > 0,
      );
      if (matched) reasons.push(DESTINATION_LABEL[matched]);
    }

    /* ------------------------------------------------ travel style (+18) */
    if (preferences.travelStyle) {
      const styleHits = overlap(
        destination.vibes,
        STYLE_VIBES[preferences.travelStyle] ?? [],
      );
      if (styleHits > 0) {
        score += Math.min(18, styleHits * 12);
        reasons.push(`${STYLE_LABEL[preferences.travelStyle]} pace`);
      }
    }

    /* ----------------------------------------------------- budget (±16) */
    if (preferences.budget) {
      const band = BUDGET_BANDS[preferences.budget];
      if (destination.price >= band.min && destination.price <= band.max) {
        score += 16;
        reasons.push("In your budget");
      } else {
        // Penalise proportionally to how far outside the band it sits, so a
        // slightly pricey option still surfaces above a wildly wrong one.
        const distance =
          destination.price > band.max
            ? (destination.price - band.max) / Math.max(band.max, 1)
            : (band.min - destination.price) / Math.max(band.min, 1);
        score -= Math.min(20, Math.round(distance * 30));
      }
    }

    /* ---------------------------------------------------- duration (+10) */
    if (preferences.tripDuration) {
      const wanted = DURATION_DAYS[preferences.tripDuration];
      const gap = Math.abs(destination.days - wanted);
      if (gap <= 1) {
        score += 10;
        reasons.push(`${destination.days} days fits`);
      } else if (gap <= 3) {
        score += 4;
      }
    }

    /* ------------------------------------------------------- rating (+6) */
    score += Math.round((destination.rating - 4.5) * 12);

    return finish(destination, score, reasons, history, favourites);
  });

  return list.sort((a, b) => b.score - a.score);
}

/**
 * Fold real travel history into a score.
 *
 * Three signals, in order of strength:
 *   · already visited (−28) — the list is for deciding where to go next, and
 *     a place you have just been is rarely the answer. It still appears, far
 *     down, labelled honestly, because people do return somewhere they loved.
 *   · matches the vibes you keep choosing (+14) — revealed preference beats
 *     the questionnaire, so this is worth more than the style answer.
 *   · a region you have never been to (+9) — a mild nudge outward, not enough
 *     to beat a strong fit.
 */
function finish(
  destination: Destination,
  score: number,
  reasons: string[],
  history: TravelHistory | null | undefined,
  favourites: string[],
): ScoredDestination {
  if (history && !history.isEmpty) {
    const visited = history.places.find(
      (place) => place.destination.id === destination.id,
    );

    if (visited) {
      score -= 28;
      reasons.unshift(
        visited.visits > 1 ? `Visited ${visited.visits}×` : "You have been here",
      );
    } else {
      const vibeHits = destination.vibes.filter((vibe) =>
        favourites.includes(vibe),
      );
      if (vibeHits.length) {
        score += Math.min(14, vibeHits.length * 8);
        reasons.unshift(`You keep picking ${vibeHits[0].toLowerCase()}`);
      }

      if (!history.regions.includes(destination.region)) {
        score += 9;
        reasons.push(`New region for you`);
      }
    }
  }

  return {
    destination,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: reasons.slice(0, 3),
  };
}

/** The single best fit, for the hero "picked for you" slot. */
export function topPick(
  preferences: TravelPreferences | null | undefined,
  history?: TravelHistory | null,
): ScoredDestination {
  return rankDestinations(preferences, history)[0];
}

/** Sensible planner prefills derived from the questionnaire. */
export function plannerDefaults(preferences: TravelPreferences | null | undefined) {
  const days = preferences?.tripDuration
    ? DURATION_DAYS[preferences.tripDuration]
    : 7;
  const perPerson = preferences?.budget
    ? BUDGET_BANDS[preferences.budget].typical
    : 90_000;
  const groupSize = preferences?.travelGroup
    ? GROUP_SIZE[preferences.travelGroup]
    : 1;

  return {
    days,
    groupSize,
    /** Total pot, not per head — the budget tracker works in trip totals. */
    budget: Math.round((perPerson * (days / 7)) / 1000) * 1000 || 40_000,
    style: preferences?.travelStyle ?? null,
  };
}

/**
 * One line of hero copy that reflects what they told us, so the dashboard
 * doesn't greet everyone identically.
 */
export function heroLine(preferences: TravelPreferences | null | undefined): string {
  if (!preferences?.preferredDestinations.length) {
    return "Tell Wanderly what you like and the dashboard reshapes around it.";
  }

  const kinds = preferences.preferredDestinations
    .map((kind) => DESTINATION_LABEL[kind].toLowerCase())
    .slice(0, 2);
  const kindText =
    kinds.length === 2 ? `${kinds[0]} and ${kinds[1]}` : kinds[0];

  const group = preferences.travelGroup
    ? {
        solo: "on your own",
        partner: "for two",
        friends: "with the group",
        family: "with the family",
      }[preferences.travelGroup]
    : "";

  const duration = preferences.tripDuration
    ? DURATION_LABEL[preferences.tripDuration].toLowerCase()
    : "";

  return `Built around ${kindText}${duration ? `, ${duration}` : ""}${
    group ? `, ${group}` : ""
  }.`;
}

/** Order the dashboard shortcuts so the most relevant one leads. */
export function shortcutOrder(
  preferences: TravelPreferences | null | undefined,
): string[] {
  const base = ["/plan", "/explore", "/trips", "/compare"];
  if (!preferences?.travelStyle) return base;

  // Someone chasing adventure wants ideas first; a budget-conscious planner
  // wants the comparison table first.
  const lead =
    preferences.budget === "budget"
      ? "/compare"
      : preferences.travelStyle === "relaxation"
        ? "/explore"
        : "/plan";

  return [lead, ...base.filter((href) => href !== lead)];
}
