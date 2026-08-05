import { DESTINATIONS } from "@/lib/data";
import type { Destination } from "@/types/dashboard";
import type { DestinationBudgetEstimate, ExpenseItem, TripDetails } from "@/types/budget";
import { CATEGORY_ALLOCATIONS, TARGET_BUDGET_MULTIPLIER, TRAVEL_STYLE_OPTIONS } from "./budgetDefaults";

/**
 * Finds a destination by ID or name from DESTINATIONS.
 */
export function getDestinationById(id: string | undefined): Destination {
  if (!id) return DESTINATIONS[0];
  const matched = DESTINATIONS.find(
    (d) => d.id.toLowerCase() === id.toLowerCase() || d.name.toLowerCase() === id.toLowerCase()
  );
  return matched || DESTINATIONS[0];
}

/**
 * Calculates a realistic smart budget estimate based on complete trip details:
 * Destination + Duration + Travellers + Travel Style.
 */
export function calculateSmartBudgetEstimate(tripDetails: TripDetails): DestinationBudgetEstimate {
  const { destination, days, travelers, travelStyle } = tripDetails;
  const styleOption = TRAVEL_STYLE_OPTIONS.find((s) => s.id === travelStyle) || TRAVEL_STYLE_OPTIONS[1];
  const styleMultiplier = styleOption.multiplier;

  const validDays = Math.max(1, days);
  const validTravelers = Math.max(1, travelers);
  const roomsNeeded = Math.ceil(validTravelers / 2);

  // Daily base price per person derived from destination single-person package price
  const basePrice = Math.max(12000, destination.price);
  const baseDailyPricePerPerson = basePrice / Math.max(1, destination.days);

  // Category specific calculations
  const stayAmount = Math.round((baseDailyPricePerPerson * 0.70 * styleMultiplier * validDays * roomsNeeded) / 500) * 500;
  const foodAmount = Math.round((baseDailyPricePerPerson * 0.35 * styleMultiplier * validDays * validTravelers) / 250) * 250;
  const transportAmount = Math.round((baseDailyPricePerPerson * 0.75 * (styleMultiplier === 2.1 ? 1.4 : 1.0) * validTravelers) / 500) * 500;
  const localTransportAmount = Math.round((baseDailyPricePerPerson * 0.12 * styleMultiplier * validDays * Math.ceil(validTravelers / 2)) / 250) * 250;
  const activityAmount = Math.round((baseDailyPricePerPerson * 0.20 * styleMultiplier * validDays * validTravelers) / 250) * 250;
  const shoppingAmount = Math.round((baseDailyPricePerPerson * 0.15 * styleMultiplier * validTravelers) / 250) * 250;
  const emergencyAmount = Math.round(Math.max(2500, baseDailyPricePerPerson * 0.18 * styleMultiplier * validTravelers) / 500) * 500;

  const categoryMap: Record<string, number> = {
    transport: Math.max(1000, transportAmount),
    stay: Math.max(1500, stayAmount),
    food: Math.max(1000, foodAmount),
    activity: Math.max(500, activityAmount),
    local_transport: Math.max(500, localTransportAmount),
    shopping: Math.max(500, shoppingAmount),
    emergency: Math.max(1000, emergencyAmount),
  };

  const expenses: ExpenseItem[] = CATEGORY_ALLOCATIONS.map((preset) => {
    const amount = categoryMap[preset.id] || 1000;
    return {
      id: preset.id,
      category: preset.category,
      label: preset.label,
      amount,
      icon: preset.icon,
      tone: preset.tone,
      min: preset.min,
      max: Math.max(amount * 3, 25000),
      step: preset.step,
    };
  });

  const estimatedCost = expenses.reduce((sum, item) => sum + item.amount, 0);
  const targetBudget = Math.round((estimatedCost * TARGET_BUDGET_MULTIPLIER) / 1000) * 1000;

  return {
    destination,
    targetBudget,
    expenses,
  };
}

/**
 * Backward compatible wrapper for legacy calls.
 */
export function getRecommendedBudgetForDestination(destination: Destination): DestinationBudgetEstimate {
  return calculateSmartBudgetEstimate({
    destination,
    days: 5,
    travelers: 2,
    travelStyle: "standard",
  });
}
