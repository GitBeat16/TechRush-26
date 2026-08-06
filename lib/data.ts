import type {
  ComparisonCandidate,
  Destination,
  TravelStyle,
} from "@/types/dashboard";

/**
 * Static reference data only.
 *
 * Anything that describes *this user* — their trips, their stats, the weather
 * where they are going — is derived from real state at runtime and lives in
 * lib/store.ts, lib/history.ts and lib/weather.ts. Nothing in this file is a
 * stand-in for something a user is supposed to have created.
 */

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

export const DESTINATIONS: Destination[] = [
  {
    id: "japan", name: "Japan", country: "Japan", region: "Asia",
    price: 80000, days: 7, tone: "blush",
    tagline: "Temples, ramen alleys and bullet trains",
    rating: 4.9, bestSeason: "Mar - May",
    vibes: ["Culture", "Food", "Cities"],
    coordinates: { lat: 35.6762, lng: 139.6503 },
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", region: "Asia",
    price: 35000, days: 5, tone: "mint",
    tagline: "Rice terraces, warm water, slow mornings",
    rating: 4.7, bestSeason: "Apr - Oct",
    vibes: ["Beaches", "Nature", "Relaxed"],
    coordinates: { lat: -8.4095, lng: 115.1889 },
  },
  {
    id: "switzerland", name: "Switzerland", country: "Switzerland", region: "Europe",
    price: 120000, days: 8, tone: "sky",
    tagline: "Alpine trains and impossibly green valleys",
    rating: 4.8, bestSeason: "Jun - Sep",
    vibes: ["Nature", "Hiking", "Scenic"],
    coordinates: { lat: 46.8182, lng: 8.2275 },
  },
  {
    id: "iceland", name: "Iceland", country: "Iceland", region: "Nordics",
    price: 145000, days: 6, tone: "lilac",
    tagline: "Black beaches, geysers and northern lights",
    rating: 4.8, bestSeason: "Sep - Mar",
    vibes: ["Nature", "Adventure", "Scenic"],
    coordinates: { lat: 64.9631, lng: -19.0208 },
  },
  {
    id: "vietnam", name: "Vietnam", country: "Vietnam", region: "Asia",
    price: 42000, days: 6, tone: "butter",
    tagline: "Limestone bays and street food marathons",
    rating: 4.6, bestSeason: "Nov - Apr",
    vibes: ["Food", "Nature", "Budget"],
    coordinates: { lat: 14.0583, lng: 108.2772 },
  },
  {
    id: "portugal", name: "Portugal", country: "Portugal", region: "Europe",
    price: 95000, days: 7, tone: "peach",
    tagline: "Tiled streets, cliff coasts and pastéis",
    rating: 4.7, bestSeason: "May - Sep",
    vibes: ["Culture", "Beaches", "Food"],
    coordinates: { lat: 39.3999, lng: -8.2245 },
  },
];

export const REGIONS = ["All", "Asia", "Europe", "Nordics"] as const;
export const VIBES = [
  "Culture", "Food", "Nature", "Beaches", "Adventure", "Hiking", "Scenic",
  "Cities", "Relaxed", "Budget",
];

/* ------------------------------------------------------------------ */
/* Comparison                                                          */
/* ------------------------------------------------------------------ */

export const COMPARISON_CANDIDATES: ComparisonCandidate[] = [
  {
    id: "japan", name: "Japan", country: "Asia", tone: "blush",
    metrics: [
      { id: "budget", label: "Total budget", score: 42, display: "Rs 80,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 88, display: "18 - 24 C" },
      { id: "activities", label: "Activities", score: 94, display: "Very high" },
      { id: "food", label: "Food", score: 96, display: "Legendary" },
      { id: "safety", label: "Safety", score: 97, display: "Excellent" },
      { id: "difficulty", label: "Travel difficulty", score: 34, display: "Easy", lowerIsBetter: true },
    ],
  },
  {
    id: "bali", name: "Bali", country: "Indonesia", tone: "mint",
    metrics: [
      { id: "budget", label: "Total budget", score: 22, display: "Rs 35,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 78, display: "26 - 31 C" },
      { id: "activities", label: "Activities", score: 82, display: "High" },
      { id: "food", label: "Food", score: 85, display: "Excellent" },
      { id: "safety", label: "Safety", score: 79, display: "Good" },
      { id: "difficulty", label: "Travel difficulty", score: 28, display: "Very easy", lowerIsBetter: true },
    ],
  },
  {
    id: "switzerland", name: "Switzerland", country: "Europe", tone: "sky",
    metrics: [
      { id: "budget", label: "Total budget", score: 78, display: "Rs 1,20,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 72, display: "9 - 18 C" },
      { id: "activities", label: "Activities", score: 88, display: "High" },
      { id: "food", label: "Food", score: 74, display: "Very good" },
      { id: "safety", label: "Safety", score: 98, display: "Excellent" },
      { id: "difficulty", label: "Travel difficulty", score: 45, display: "Moderate", lowerIsBetter: true },
    ],
  },
  {
    id: "vietnam", name: "Vietnam", country: "Asia", tone: "butter",
    metrics: [
      { id: "budget", label: "Total budget", score: 25, display: "Rs 42,000", lowerIsBetter: true },
      { id: "weather", label: "Weather", score: 74, display: "24 - 30 C" },
      { id: "activities", label: "Activities", score: 80, display: "High" },
      { id: "food", label: "Food", score: 92, display: "Outstanding" },
      { id: "safety", label: "Safety", score: 76, display: "Good" },
      { id: "difficulty", label: "Travel difficulty", score: 40, display: "Moderate", lowerIsBetter: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Planner options                                                     */
/* ------------------------------------------------------------------ */

export const TRAVEL_STYLES: TravelStyle[] = ["Relaxed", "Adventure", "Culture", "Luxury"];

export const INTERESTS = [
  "Food", "Nature", "Museums", "Nightlife", "Shopping", "Hiking", "Beaches", "Photography",
];

export const AI_STEPS = [
  "Reading your travel style",
  "Scanning routes and stays",
  "Balancing budget against days",
  "Shaping a day by day plan",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatShort(value: number): string {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `Rs ${Math.round(value / 1000)}k`;
  return `Rs ${value}`;
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
