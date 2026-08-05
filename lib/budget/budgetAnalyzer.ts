import type { ExpenseItem } from "@/types/budget";
import type { Destination } from "@/types/dashboard";
import { calculateBudgetScore, type BudgetScoreResult } from "./scoreCalculator";
import { generateBudgetWarnings, type BudgetWarning } from "./warnings";
import { generateSavingsRecommendations, type SavingsPotentialData } from "./recommendations";
import { getDestinationTips, type DestinationTip } from "./tips";

export interface CategoryContribution {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  icon: string;
  tone: string;
}

export interface CompleteBudgetAnalysis {
  scoreResult: BudgetScoreResult;
  warnings: BudgetWarning[];
  savingsData: SavingsPotentialData;
  categoryBreakdown: CategoryContribution[];
  destinationTips: DestinationTip[];
}

/**
 * Runs complete local rule-based budget analysis for current expenses and destination.
 */
export function analyzeBudget(
  totalBudget: number,
  expenses: ExpenseItem[],
  destination?: Destination
): CompleteBudgetAnalysis {
  const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);

  // 1. Calculate Smart Budget Score with Destination Affordability
  const scoreResult = calculateBudgetScore(totalBudget, expenses, destination);

  // 2. Generate Active Budget Warnings
  const warnings = generateBudgetWarnings(totalBudget, expenses);

  // 3. Generate Personalized Savings Suggestions & Savings Potential
  const savingsData = generateSavingsRecommendations(expenses, destination);

  // 4. Calculate Percentage Contribution per Expense Category
  const categoryBreakdown: CategoryContribution[] = expenses.map((item) => {
    const pct = totalCost > 0 ? (item.amount / totalCost) * 100 : 0;
    return {
      id: item.id,
      category: item.category,
      amount: item.amount,
      percentage: Math.round(pct),
      icon: item.icon,
      tone: item.tone,
    };
  }).sort((a, b) => b.amount - a.amount);

  // 5. Retrieve Destination-Specific Tips
  const destinationTips = getDestinationTips(destination);

  return {
    scoreResult,
    warnings,
    savingsData,
    categoryBreakdown,
    destinationTips,
  };
}
