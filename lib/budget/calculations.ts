import type { BudgetSummaryData, BudgetStatus, ExpenseItem } from "@/types/budget";

/**
 * Calculates the total cost of all expense items.
 */
export function calculateTotalCost(expenses: ExpenseItem[]): number {
  return expenses.reduce((sum, item) => sum + (Math.max(0, item.amount) || 0), 0);
}

/**
 * Calculates remaining budget (totalBudget - totalCost).
 */
export function calculateRemainingBudget(totalBudget: number, totalCost: number): number {
  return totalBudget - totalCost;
}

/**
 * Calculates percentage of budget used (0 to 100+).
 */
export function calculatePercentageUsed(totalBudget: number, totalCost: number): number {
  if (totalBudget <= 0) return 100;
  const percentage = (totalCost / totalBudget) * 100;
  return Math.min(Math.max(0, Math.round(percentage)), 999);
}

/**
 * Determines budget status based on percentage used.
 * - safe: < 85%
 * - warning: 85% - 100%
 * - exceeded: > 100%
 */
export function calculateBudgetStatus(percentageUsed: number): BudgetStatus {
  if (percentageUsed > 100) return "exceeded";
  if (percentageUsed >= 85) return "warning";
  return "safe";
}

/**
 * Computes full budget summary data object.
 */
export function calculateBudgetSummary(
  totalBudget: number,
  expenses: ExpenseItem[]
): BudgetSummaryData {
  const safeBudget = Math.max(0, totalBudget);
  const totalCost = calculateTotalCost(expenses);
  const remainingBudget = calculateRemainingBudget(safeBudget, totalCost);
  const percentageUsed = calculatePercentageUsed(safeBudget, totalCost);
  const status = calculateBudgetStatus(percentageUsed);

  return {
    totalBudget: safeBudget,
    totalCost,
    remainingBudget,
    percentageUsed,
    status,
  };
}
