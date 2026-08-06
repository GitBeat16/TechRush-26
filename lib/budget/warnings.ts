import type { ExpenseItem } from "@/types/budget";
import { formatInr } from "@/lib/data";

export interface BudgetWarning {
  id: string;
  severity: "high" | "medium";
  title: string;
  message: string;
  category?: string;
  icon: string;
}

/**
 * Evaluates current expenses and total budget against threshold rules
 * to generate active warning cards.
 */
export function generateBudgetWarnings(
  totalBudget: number,
  expenses: ExpenseItem[]
): BudgetWarning[] {
  const warnings: BudgetWarning[] = [];
  const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);

  // Warning 1: Total Budget Exceeded
  if (totalCost > totalBudget && totalBudget > 0) {
    const excess = totalCost - totalBudget;
    warnings.push({
      id: "warn-exceeded",
      severity: "high",
      icon: "warning",
      title: "Budget Limit Exceeded",
      message: `Your total estimated cost exceeds your target budget by ${formatInr(excess)}. Reduce category allocations to stay balanced.`,
    });
  }

  // Warning 2: High Accommodation Ratio (> 40% of total budget or > 45% of total cost)
  const stayItem = expenses.find((e) => e.id === "stay");
  if (stayItem && totalCost > 0) {
    const stayRatio = stayItem.amount / totalCost;
    if (stayRatio > 0.42) {
      warnings.push({
        id: "warn-stay",
        severity: "medium",
        icon: "stay",
        category: "Accommodation",
        title: "High Accommodation Share",
        message: `Accommodation takes ${Math.round(stayRatio * 100)}% of your trip spending. Consider boutique stays or guesthouses to balance costs.`,
      });
    }
  }

  // Warning 3: Low Emergency Reserve
  const emergencyItem = expenses.find((e) => e.id === "emergency");
  const emergencyAmount = emergencyItem ? emergencyItem.amount : 0;
  const minRecommendedEmergency = Math.max(2000, totalBudget * 0.05);

  if (emergencyAmount < minRecommendedEmergency) {
    warnings.push({
      id: "warn-emergency",
      severity: "medium",
      icon: "emergency",
      category: "Emergency Fund",
      title: "Low Emergency Buffer",
      message: `Emergency reserve is currently ${formatInr(emergencyAmount)}. We recommend maintaining at least ${formatInr(minRecommendedEmergency)} for unexpected detours.`,
    });
  }

  // Warning 4: Unusually High Shopping Expenses (> 20% of total cost)
  const shoppingItem = expenses.find((e) => e.id === "shopping");
  if (shoppingItem && totalCost > 0) {
    const shoppingRatio = shoppingItem.amount / totalCost;
    if (shoppingRatio > 0.20) {
      warnings.push({
        id: "warn-shopping",
        severity: "medium",
        icon: "shopping",
        category: "Shopping",
        title: "High Shopping Allocation",
        message: `Shopping represents ${Math.round(shoppingRatio * 100)}% of your overall estimate (${formatInr(shoppingItem.amount)}).`,
      });
    }
  }

  // Warning 5: High Long-Distance Transport Share
  const transportItem = expenses.find((e) => e.id === "transport");
  if (transportItem && totalCost > 0) {
    const transportRatio = transportItem.amount / totalCost;
    if (transportRatio > 0.32) {
      warnings.push({
        id: "warn-transport",
        severity: "medium",
        icon: "transport",
        category: "Transportation",
        title: "High Travel Transit Cost",
        message: `Long-distance travel takes ${Math.round(transportRatio * 100)}% of your spending. Booking earlier can save up to 25%.`,
      });
    }
  }

  return warnings;
}
