/**
 * Shared domain types for Wanderly.
 */

export type ClayTone =
  | "blush"
  | "peach"
  | "butter"
  | "mint"
  | "sky"
  | "lilac"
  | "surface";

export interface ToneStyle {
  /** Tailwind background class for the clay body */
  bg: string;
  /** Tailwind text class for content sitting on the clay body */
  text: string;
  /** Accent used for chips, bars and glyph fills */
  accent: string;
  /** Raw hex, for SVG illustrations and canvas work */
  hex: string;
}

export interface Traveler {
  id: string;
  name: string;
  initials: string;
  tone: ClayTone;
}

/* ------------------------------------------------------------------ */
/* Itinerary                                                           */
/* ------------------------------------------------------------------ */

export type ActivityCategory =
  | "sight"
  | "food"
  | "travel"
  | "stay"
  | "activity"
  | "free";

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  note: string;
  cost: number;
  category: ActivityCategory;
  done: boolean;
}

export interface ItineraryDay {
  id: string;
  label: string;
  date: string;
  items: ItineraryItem[];
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

export type ExpenseCategory =
  | "stay"
  | "travel"
  | "food"
  | "activity"
  | "shopping"
  | "other";

export interface Expense {
  id: string;
  label: string;
  amount: number;
  category: ExpenseCategory;
  /** traveler id who paid */
  paidBy: string;
  /** traveler ids the cost is shared between (includes the payer) */
  splitWith: string[];
  date: string;
}

/* ------------------------------------------------------------------ */
/* Packing                                                             */
/* ------------------------------------------------------------------ */

export type PackingCategory =
  | "Clothes"
  | "Documents"
  | "Electronics"
  | "Essentials";

export interface PackingItem {
  id: string;
  label: string;
  category: PackingCategory;
  packed: boolean;
}

/* ------------------------------------------------------------------ */
/* Trips                                                               */
/* ------------------------------------------------------------------ */

export type TripStatus = "planning" | "upcoming" | "completed";

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface Trip {
  id: string;
  title: string;
  country: string;
  /** links a trip back to a destination in DESTINATIONS, for artwork */
  destinationId: string;
  startDate: string;
  endDate: string;
  days: number;
  budget: number;
  currency: string;
  tone: ClayTone;
  status: TripStatus;
  summary: string;
  travelers: Traveler[];
  milestones: Milestone[];
  itinerary: ItineraryDay[];
  packing: PackingItem[];
  expenses: Expense[];
}

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  price: number;
  days: number;
  tone: ClayTone;
  tagline: string;
  rating: number;
  bestSeason: string;
  vibes: string[];
}

export type MetricKind =
  | "budget"
  | "weather"
  | "activities"
  | "food"
  | "safety"
  | "difficulty";

export interface ComparisonMetric {
  id: MetricKind;
  label: string;
  /** 0-100 normalised score used for the animated bars */
  score: number;
  /** Human readable value shown next to the bar */
  display: string;
  /** true when a lower raw value is the better outcome (budget, difficulty) */
  lowerIsBetter?: boolean;
}

export interface ComparisonCandidate {
  id: string;
  name: string;
  country: string;
  tone: ClayTone;
  metrics: ComparisonMetric[];
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export interface TravelStat {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  caption: string;
  tone: ClayTone;
  icon: "globe" | "suitcase" | "flame" | "camera";
}

export interface Achievement {
  id: string;
  label: string;
  detail: string;
  tone: ClayTone;
  unlocked: boolean;
}

export interface WeatherNow {
  city: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
  icon: "sun" | "cloud" | "rain" | "snow";
}

/* ------------------------------------------------------------------ */
/* Planner                                                             */
/* ------------------------------------------------------------------ */

export type TravelStyle = "Relaxed" | "Adventure" | "Culture" | "Luxury";

export interface PlannerState {
  destination: string;
  budget: number;
  duration: number;
  style: TravelStyle;
  interests: string[];
}

/** Shape returned by /api/plan */
export interface GeneratedPlan {
  title: string;
  destination: string;
  summary: string;
  estimatedTotal: number;
  days: {
    label: string;
    items: {
      time: string;
      title: string;
      note: string;
      cost: number;
      category: ActivityCategory;
    }[];
  }[];
  packingSuggestions: string[];
  /** "model" when a real LLM answered, "local" when the offline planner did */
  source: "model" | "local";
}
