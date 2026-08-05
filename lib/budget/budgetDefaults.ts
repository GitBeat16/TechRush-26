import type { ExpenseCategoryKey, TravelStyleOption } from "@/types/budget";
import type { ClayTone } from "@/types/dashboard";

export interface CategoryAllocationPreset {
  id: ExpenseCategoryKey;
  category: string;
  label: string;
  icon: string;
  ratio: number;
  tone: ClayTone;
  min: number;
  step: number;
}

export const TRAVEL_STYLE_OPTIONS: TravelStyleOption[] = [
  {
    id: "budget",
    title: "Budget",
    subtitle: "Backpacker & Value",
    bullets: ["Hostels & Guesthouses", "Public Transport", "Budget Restaurants"],
    icon: "🎒",
    tone: "mint",
    multiplier: 0.65,
  },
  {
    id: "standard",
    title: "Standard",
    subtitle: "Comfort & Balance",
    bullets: ["3★-4★ Hotels & Resorts", "Mixed Transit & Cabs", "Popular Attractions"],
    icon: "🏨",
    tone: "peach",
    multiplier: 1.0,
  },
  {
    id: "luxury",
    title: "Luxury",
    subtitle: "Premium & Comfort",
    bullets: ["5★ Premium Hotels", "Private Chauffeured Rides", "Exclusive VIP Experiences"],
    icon: "👑",
    tone: "lilac",
    multiplier: 2.1,
  },
];

export const CATEGORY_ALLOCATIONS: CategoryAllocationPreset[] = [
  {
    id: "transport",
    category: "Transportation",
    label: "Flights, train & long distance travel",
    icon: "✈️",
    ratio: 0.22,
    tone: "sky",
    min: 0,
    step: 500,
  },
  {
    id: "stay",
    category: "Accommodation",
    label: "Hotels, resorts & stay bookings",
    icon: "🏨",
    ratio: 0.35,
    tone: "peach",
    min: 0,
    step: 500,
  },
  {
    id: "food",
    category: "Food & Dining",
    label: "Cafes, restaurants & street food",
    icon: "🍽️",
    ratio: 0.18,
    tone: "butter",
    min: 0,
    step: 250,
  },
  {
    id: "activity",
    category: "Activities",
    label: "Tours, museum passes & sight tickets",
    icon: "🎟️",
    ratio: 0.10,
    tone: "mint",
    min: 0,
    step: 250,
  },
  {
    id: "local_transport",
    category: "Local Transport",
    label: "Cabs, metro & local transit",
    icon: "🚕",
    ratio: 0.05,
    tone: "lilac",
    min: 0,
    step: 250,
  },
  {
    id: "shopping",
    category: "Shopping",
    label: "Souvenirs, markets & gifts",
    icon: "🛍️",
    ratio: 0.05,
    tone: "blush",
    min: 0,
    step: 250,
  },
  {
    id: "emergency",
    category: "Emergency Fund",
    label: "Contingency reserve & medical buffer",
    icon: "🛡️",
    ratio: 0.05,
    tone: "surface",
    min: 0,
    step: 500,
  },
];

/** Recommended target budget buffer multiplier (12% buffer over estimated cost) */
export const TARGET_BUDGET_MULTIPLIER = 1.12;
