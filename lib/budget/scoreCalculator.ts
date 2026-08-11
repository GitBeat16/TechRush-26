import type { BudgetStatus, ExpenseItem } from "@/types/budget";
import type { Destination } from "@/types/dashboard";

export interface BudgetScoreResult {
  score: number;
  label: string;
  status: "excellent" | "moderate" | "needs_improvement";
  badgeColor: string;
  reasons: string[];
}

/**
 * Calculates a dynamic rule-based Smart Budget Score (0-100) reflecting destination affordability,
 * spending balance, emergency reserve, and overall budget utilization.
 */
export function calculateBudgetScore(
  totalBudget: number,
  expenses: ExpenseItem[],
  destination?: Destination
): BudgetScoreResult {
  let score = 85;
  const reasons: string[] = [];

  const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);
  const percentageUsed = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 100;

  // 1. Destination Affordability Adjustment
  if (destination) {
    const price = destination.price;
    if (price <= 30000) {
      score += 10;
      reasons.push(`${destination.name} is a highly budget-friendly destination (+10 pts)`);
    } else if (price <= 45000) {
      score += 6;
      reasons.push(`${destination.name} offers great travel value (+6 pts)`);
    } else if (price <= 85000) {
      // Standard cost tier
      reasons.push(`${destination.name} has a moderate cost index`);
    } else if (price <= 110000) {
      score -= 8;
      reasons.push(`${destination.name} is a higher-cost destination (-8 pts)`);
    } else {
      score -= 16;
      reasons.push(`${destination.name} is a premium high-cost destination (-16 pts)`);
    }
  }

  // 2. Budget Utilization Check
  if (percentageUsed > 100) {
    const excessPercentage = percentageUsed - 100;
    const penalty = Math.min(45, Math.round(excessPercentage * 1.5));
    score -= penalty;
    reasons.push(`Budget exceeded by ${Math.round(excessPercentage)}% (-${penalty} pts)`);
  } else if (percentageUsed >= 92) {
    score -= 10;
    reasons.push(`Budget utilization high at ${Math.round(percentageUsed)}% (-10 pts)`);
  } else {
    reasons.push(`Balanced budget utilization (${Math.round(percentageUsed)}%)`);
  }

  // 3. Emergency Reserve Check
  const emergencyItem = expenses.find((e) => e.id === "emergency");
  const emergencyAmount = emergencyItem ? emergencyItem.amount : 0;
  const minRecommendedEmergency = Math.max(2000, totalBudget * 0.05);

  if (emergencyAmount === 0) {
    score -= 15;
    reasons.push("No emergency fund allocated (-15 pts)");
  } else if (emergencyAmount < minRecommendedEmergency) {
    score -= 8;
    reasons.push("Emergency reserve below recommended buffer (-8 pts)");
  } else {
    reasons.push("Sufficient emergency reserve allocated");
  }

  // 4. Accommodation Ratio Check
  const stayItem = expenses.find((e) => e.id === "stay");
  if (stayItem && totalCost > 0) {
    const stayRatio = stayItem.amount / totalCost;
    if (stayRatio > 0.45) {
      score -= 10;
      reasons.push(`Accommodation takes ${Math.round(stayRatio * 100)}% of total cost (-10 pts)`);
    }
  }

  // 5. Shopping Ratio Check
  const shoppingItem = expenses.find((e) => e.id === "shopping");
  if (shoppingItem && totalCost > 0) {
    const shoppingRatio = shoppingItem.amount / totalCost;
    if (shoppingRatio > 0.25) {
      score -= 8;
      reasons.push(`Shopping exceeds 25% of total spending (-8 pts)`);
    }
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  let status: "excellent" | "moderate" | "needs_improvement" = "excellent";
  let label = "🟢 Excellent";
  let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";

  if (finalScore < 65) {
    status = "needs_improvement";
    label = "🔴 Needs Improvement";
    badgeColor = "bg-rose-100 text-rose-800 border-rose-300";
  } else if (finalScore < 82) {
    status = "moderate";
    label = "🟡 Moderate";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
  }

  return {
    score: finalScore,
    label,
    status,
    badgeColor,
    reasons,
  };
}
