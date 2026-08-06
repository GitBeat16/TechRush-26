import type { ClayTone, Destination } from "./dashboard";

export type ExpenseCategoryKey =
  | "transport"
  | "stay"
  | "food"
  | "activity"
  | "local_transport"
  | "shopping"
  | "emergency";

export type TravelStyleKey = "budget" | "standard" | "luxury";

export interface TravelStyleOption {
  id: TravelStyleKey;
  title: string;
  subtitle: string;
  bullets: string[];
  icon: string | React.ReactNode;
  tone: ClayTone;
  multiplier: number;
}

export interface TripDetails {
  destination: Destination;
  days: number;
  travelers: number;
  travelStyle: TravelStyleKey;
}

export interface ExpenseItem {
  id: ExpenseCategoryKey;
  category: string;
  label: string;
  amount: number;
  icon: string | React.ReactNode;
  tone: ClayTone;
  min: number;
  max: number;
  step: number;
}

export type BudgetStatus = "safe" | "warning" | "exceeded";

export interface BudgetSummaryData {
  totalBudget: number;
  totalCost: number;
  remainingBudget: number;
  percentageUsed: number;
  status: BudgetStatus;
  destination?: Destination;
}

export interface DestinationBudgetEstimate {
  destination: Destination;
  targetBudget: number;
  expenses: ExpenseItem[];
}
