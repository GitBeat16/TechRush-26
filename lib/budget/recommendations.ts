import type { ExpenseItem } from "@/types/budget";
import type { Destination } from "@/types/dashboard";
import { formatInr } from "@/lib/data";

export interface SavingsRecommendation {
  id: string;
  icon: string;
  title: string;
  suggestion: string;
  potentialSavingAmount: number;
  categoryKey?: string;
  tone: "peach" | "sky" | "mint" | "butter" | "lilac";
}

export interface SavingsPotentialData {
  currentCost: number;
  optimizedCost: number;
  potentialSavings: number;
  recommendations: SavingsRecommendation[];
}

/**
 * Evaluates current expenses and destination to generate 3-5 personalized
 * savings suggestions and compute potential optimized cost.
 */
export function generateSavingsRecommendations(
  expenses: ExpenseItem[],
  destination?: Destination
): SavingsPotentialData {
  const recommendations: SavingsRecommendation[] = [];
  const currentCost = expenses.reduce((sum, item) => sum + item.amount, 0);

  const stayItem = expenses.find((e) => e.id === "stay");
  const transportItem = expenses.find((e) => e.id === "transport");
  const localTransportItem = expenses.find((e) => e.id === "local_transport");
  const shoppingItem = expenses.find((e) => e.id === "shopping");
  const foodItem = expenses.find((e) => e.id === "food");
  const emergencyItem = expenses.find((e) => e.id === "emergency");

  // 1. Accommodation Optimization
  if (stayItem && stayItem.amount > 4000) {
    const saving = Math.round((stayItem.amount * 0.22) / 250) * 250;
    recommendations.push({
      id: "rec-stay",
      icon: "💡",
      categoryKey: "stay",
      tone: "peach",
      title: "Optimize Stay Bookings",
      suggestion: `Opting for verified boutique stays or guesthouses instead of luxury resorts can save up to ${formatInr(saving)}.`,
      potentialSavingAmount: saving,
    });
  }

  // 2. Transportation / Booking Early
  if (transportItem && transportItem.amount > 3000) {
    const saving = Math.round((transportItem.amount * 0.18) / 250) * 250;
    recommendations.push({
      id: "rec-transport",
      icon: "✈️",
      categoryKey: "transport",
      tone: "sky",
      title: "Advance Flight/Rail Booking",
      suggestion: `Booking flights or regional train passes 3+ weeks in advance reduces transit costs by up to ${formatInr(saving)}.`,
      potentialSavingAmount: saving,
    });
  }

  // 3. Local Transit & Passes
  if (localTransportItem && localTransportItem.amount > 1200) {
    const saving = Math.round((localTransportItem.amount * 0.30) / 250) * 250;
    recommendations.push({
      id: "rec-local-transport",
      icon: "🚕",
      categoryKey: "local_transport",
      tone: "mint",
      title: "Public Transit & Day Passes",
      suggestion: `Utilizing day passes or metro rail instead of taxi cabs saves around ${formatInr(saving)} for ${destination?.name || "your trip"}.`,
      potentialSavingAmount: saving,
    });
  }

  // 4. Dining / Street Markets
  if (foodItem && foodItem.amount > 2500) {
    const saving = Math.round((foodItem.amount * 0.15) / 250) * 250;
    recommendations.push({
      id: "rec-food",
      icon: "🍽️",
      categoryKey: "food",
      tone: "butter",
      title: "Local Food & Street Markets",
      suggestion: `Balancing formal dining with iconic local food stalls and cafes reduces food expenses by ${formatInr(saving)}.`,
      potentialSavingAmount: saving,
    });
  }

  // 5. Shopping Capping
  if (shoppingItem && shoppingItem.amount > 2000) {
    const saving = Math.round((shoppingItem.amount * 0.25) / 250) * 250;
    recommendations.push({
      id: "rec-shopping",
      icon: "🛍️",
      categoryKey: "shopping",
      tone: "lilac",
      title: "Focus on Local Artisans",
      suggestion: `Focusing on authentic local artisan markets rather than tourist souvenir shops saves ${formatInr(saving)}.`,
      potentialSavingAmount: saving,
    });
  }

  // Ensure 3-5 recommendations are returned
  const activeRecs = recommendations.slice(0, 5);

  const totalPotentialSavings = activeRecs.reduce(
    (sum, r) => sum + r.potentialSavingAmount,
    0
  );
  const optimizedCost = Math.max(0, currentCost - totalPotentialSavings);

  return {
    currentCost,
    optimizedCost,
    potentialSavings: totalPotentialSavings,
    recommendations: activeRecs,
  };
}
