/**
 * Budget Intelligence Engine
 * ---------------------------------------------------------------------------
 * A deterministic, rule-based "financial assistant" for a trip budget.
 *
 * Everything the redesigned Smart Budget Planner narrates — the peer
 * comparison, the one-line insight, the health verdict, the spend drivers,
 * the actionable recommendations and the what-if projections — is derived
 * here, so the UI layer stays purely presentational.
 */

import type { Destination } from "@/types/dashboard";
import type { ClayTone } from "@/types/dashboard";
import type { ExpenseCategoryKey, ExpenseItem, TravelStyleKey } from "@/types/budget";
import { formatInr } from "@/lib/data";
import { TRAVEL_STYLE_OPTIONS } from "./budgetDefaults";
import { calculateSmartBudgetEstimate } from "./budgetEstimator";

/* ------------------------------------------------------------------ */
/* Allocation groups — 7 raw categories folded into 5 human buckets     */
/* ------------------------------------------------------------------ */

export type AllocationGroupKey =
  | "accommodation"
  | "food"
  | "transport"
  | "activities"
  | "others";

export interface AllocationGroupDef {
  id: AllocationGroupKey;
  label: string;
  blurb: string;
  icon: string;
  tone: ClayTone;
  members: ExpenseCategoryKey[];
  /** Healthy share of total spend for this bucket, as a 0-1 range. */
  healthyRange: [number, number];
}

export const ALLOCATION_GROUPS: AllocationGroupDef[] = [
  {
    id: "accommodation",
    label: "Accommodation",
    blurb: "Where you sleep every night",
    icon: "stay",
    tone: "peach",
    members: ["stay"],
    healthyRange: [0.25, 0.42],
  },
  {
    id: "food",
    label: "Food & Dining",
    blurb: "Meals, cafes and street food",
    icon: "food",
    tone: "butter",
    members: ["food"],
    healthyRange: [0.12, 0.28],
  },
  {
    id: "transport",
    label: "Transport",
    blurb: "Getting there and getting around",
    icon: "transport",
    tone: "sky",
    members: ["transport", "local_transport"],
    healthyRange: [0.15, 0.32],
  },
  {
    id: "activities",
    label: "Activities",
    blurb: "The reason you booked the trip",
    icon: "activity",
    tone: "mint",
    members: ["activity"],
    healthyRange: [0.08, 0.22],
  },
  {
    id: "others",
    label: "Shopping & Buffer",
    blurb: "Souvenirs and your safety net",
    icon: "shopping",
    tone: "lilac",
    members: ["shopping", "emergency"],
    healthyRange: [0.05, 0.18],
  },
];

const GROUP_OF: Record<ExpenseCategoryKey, AllocationGroupKey> = {
  stay: "accommodation",
  food: "food",
  transport: "transport",
  local_transport: "transport",
  activity: "activities",
  shopping: "others",
  emergency: "others",
};

export interface AllocationSlice {
  id: AllocationGroupKey;
  label: string;
  blurb: string;
  icon: string;
  tone: ClayTone;
  amount: number;
  percentage: number;
  perDay: number;
  perPersonPerDay: number;
  /** How this bucket sits against its healthy band. */
  verdict: "lean" | "balanced" | "heavy";
  members: {
    id: ExpenseCategoryKey;
    category: string;
    amount: number;
    percentage: number;
    icon: string | React.ReactNode;
  }[];
}

/* ------------------------------------------------------------------ */
/* Category preferences — the human-friendly editor levers              */
/* ------------------------------------------------------------------ */

export interface CategoryPreference {
  id: string;
  label: string;
  hint: string;
  /** Multiplier applied to the category's baseline amount. */
  multiplier: number;
}

export const CATEGORY_PREFERENCES: Record<ExpenseCategoryKey, CategoryPreference[]> = {
  stay: [
    { id: "hostel", label: "Hostels", hint: "Dorms and social stays", multiplier: 0.55 },
    { id: "midrange", label: "Mid-range", hint: "3 star hotels and B&Bs", multiplier: 1 },
    { id: "premium", label: "Premium", hint: "4 to 5 star and resorts", multiplier: 1.65 },
  ],
  food: [
    { id: "street", label: "Street & local", hint: "Markets and local joints", multiplier: 0.6 },
    { id: "mixed", label: "Mixed", hint: "Local food plus a few dinners", multiplier: 1 },
    { id: "fine", label: "Fine dining", hint: "Restaurants and tasting menus", multiplier: 1.7 },
  ],
  transport: [
    { id: "slow", label: "Bus & rail", hint: "Slower, far cheaper", multiplier: 0.6 },
    { id: "economy", label: "Economy flights", hint: "Booked in advance", multiplier: 1 },
    { id: "flexible", label: "Flexible fares", hint: "Premium seats, late booking", multiplier: 1.55 },
  ],
  local_transport: [
    { id: "public", label: "Public transit", hint: "Metro cards and day passes", multiplier: 0.5 },
    { id: "mixed", label: "Mixed", hint: "Transit plus occasional cabs", multiplier: 1 },
    { id: "private", label: "Private cabs", hint: "Door to door every time", multiplier: 1.7 },
  ],
  activity: [
    { id: "light", label: "Light", hint: "Mostly free sights and walking", multiplier: 0.55 },
    { id: "balanced", label: "Balanced", hint: "A paid experience every other day", multiplier: 1 },
    { id: "packed", label: "Packed", hint: "Tours, tickets and day trips", multiplier: 1.6 },
  ],
  shopping: [
    { id: "minimal", label: "Minimal", hint: "A couple of keepsakes", multiplier: 0.5 },
    { id: "moderate", label: "Moderate", hint: "Gifts for people back home", multiplier: 1 },
    { id: "generous", label: "Generous", hint: "Serious souvenir energy", multiplier: 1.8 },
  ],
  emergency: [
    { id: "slim", label: "Slim buffer", hint: "Around 3% of the trip", multiplier: 0.6 },
    { id: "standard", label: "Standard buffer", hint: "Recommended safety net", multiplier: 1 },
    { id: "cautious", label: "Cautious", hint: "Medical and delay cover", multiplier: 1.6 },
  ],
};

/* ------------------------------------------------------------------ */
/* Peer comparison                                                      */
/* ------------------------------------------------------------------ */

export interface PeerComparison {
  peerAverage: number;
  delta: number;
  deltaPercentage: number;
  position: "below" | "typical" | "above";
  headline: string;
  detail: string;
}

/**
 * Models what a typical traveller spends on the same destination, duration
 * and party size. The baseline is the standard-style estimate nudged up by
 * the small premium most travellers pay for booking late and improvising.
 */
export function calculatePeerAverage(
  destination: Destination,
  days: number,
  travelers: number
): number {
  const baseline = calculateSmartBudgetEstimate({
    destination,
    days,
    travelers,
    travelStyle: "standard",
  });
  const baselineCost = baseline.expenses.reduce((sum, e) => sum + e.amount, 0);
  // Travellers who do not plan tend to land ~8% above a planned standard trip.
  return Math.round((baselineCost * 1.08) / 500) * 500;
}

export function comparePeers(totalCost: number, peerAverage: number, destinationName: string): PeerComparison {
  const delta = totalCost - peerAverage;
  const deltaPercentage = peerAverage > 0 ? Math.round((delta / peerAverage) * 100) : 0;
  const magnitude = Math.abs(deltaPercentage);

  let position: PeerComparison["position"] = "typical";
  if (deltaPercentage <= -6) position = "below";
  else if (deltaPercentage >= 6) position = "above";

  const headline =
    position === "below"
      ? `${magnitude}% below the average traveller`
      : position === "above"
        ? `${magnitude}% above the average traveller`
        : "Right on the average traveller";

  const detail =
    position === "below"
      ? `Most people spend about ${formatInr(peerAverage)} on a trip like this to ${destinationName}. Your plan comes in ${formatInr(Math.abs(delta))} lighter.`
      : position === "above"
        ? `Most people spend about ${formatInr(peerAverage)} on a trip like this to ${destinationName}. You are running ${formatInr(Math.abs(delta))} richer, which is fine if it is deliberate.`
        : `Most people spend about ${formatInr(peerAverage)} on a trip like this to ${destinationName}. Your plan sits comfortably in that band.`;

  return { peerAverage, delta, deltaPercentage, position, headline, detail };
}

/* ------------------------------------------------------------------ */
/* Financial health                                                     */
/* ------------------------------------------------------------------ */

export type HealthStatus = "excellent" | "good" | "warning";

export interface HealthFactor {
  id: string;
  label: string;
  detail: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface SavingOpportunity {
  id: string;
  label: string;
  amount: number;
  detail: string;
}

export interface FinancialHealth {
  status: HealthStatus;
  title: string;
  summary: string;
  score: number;
  tone: ClayTone;
  factors: HealthFactor[];
  opportunities: SavingOpportunity[];
}

/* ------------------------------------------------------------------ */
/* Actionable recommendations                                           */
/* ------------------------------------------------------------------ */

export interface BudgetAction {
  id: string;
  title: string;
  icon: string;
  tone: ClayTone;
  categoryKey: ExpenseCategoryKey;
  currentChoice: string;
  suggestedChange: string;
  rationale: string;
  expectedSavings: number;
  /** Absolute amount the category becomes once applied. */
  targetAmount: number;
}

/* ------------------------------------------------------------------ */
/* Drivers                                                              */
/* ------------------------------------------------------------------ */

export interface BudgetDriver {
  id: AllocationGroupKey;
  label: string;
  icon: string;
  tone: ClayTone;
  amount: number;
  percentage: number;
  /** Relative bar width against the largest driver, 0-100. */
  relative: number;
  note: string;
}

/* ------------------------------------------------------------------ */
/* The complete report                                                  */
/* ------------------------------------------------------------------ */

export interface BudgetIntelligence {
  totalCost: number;
  perPersonCost: number;
  perPersonPerDay: number;
  peer: PeerComparison;
  insight: string;
  allocation: AllocationSlice[];
  drivers: BudgetDriver[];
  health: FinancialHealth;
  actions: BudgetAction[];
  optimizedTotal: number;
  totalOpportunity: number;
}

export interface IntelligenceInput {
  destination: Destination;
  days: number;
  travelers: number;
  travelStyle: TravelStyleKey;
  expenses: ExpenseItem[];
}

const round = (value: number, step = 250) => Math.max(0, Math.round(value / step) * step);

export function buildBudgetIntelligence(input: IntelligenceInput): BudgetIntelligence {
  const { destination, days, travelers, travelStyle, expenses } = input;
  const validDays = Math.max(1, days);
  const validTravelers = Math.max(1, travelers);

  const totalCost = expenses.reduce((sum, item) => sum + item.amount, 0);
  const amountOf = (id: ExpenseCategoryKey) => expenses.find((e) => e.id === id)?.amount ?? 0;

  /* ---------------------------------------------- allocation buckets */
  const grouped = ALLOCATION_GROUPS.map<AllocationSlice>((group) => {
    const members = expenses.filter((e) => GROUP_OF[e.id] === group.id);
    const amount = members.reduce((sum, e) => sum + e.amount, 0);
    const share = totalCost > 0 ? amount / totalCost : 0;
    const verdict: AllocationSlice["verdict"] =
      share < group.healthyRange[0] ? "lean" : share > group.healthyRange[1] ? "heavy" : "balanced";

    return {
      id: group.id,
      label: group.label,
      blurb: group.blurb,
      icon: group.icon,
      tone: group.tone,
      amount,
      percentage: Math.round(share * 1000) / 10,
      perDay: Math.round(amount / validDays),
      perPersonPerDay: Math.round(amount / validDays / validTravelers),
      verdict,
      members: members.map((m) => ({
        id: m.id,
        category: m.category,
        amount: m.amount,
        percentage: amount > 0 ? Math.round((m.amount / amount) * 100) : 0,
        icon: m.icon,
      })),
    };
  }).filter((slice) => slice.amount > 0);

  /* --------------------------------------------------------- drivers */
  const sortedByAmount = [...grouped].sort((a, b) => b.amount - a.amount);
  const largest = sortedByAmount[0]?.amount || 1;
  const drivers: BudgetDriver[] = sortedByAmount.map((slice, index) => ({
    id: slice.id,
    label: slice.label,
    icon: slice.icon,
    tone: slice.tone,
    amount: slice.amount,
    percentage: slice.percentage,
    relative: Math.max(6, Math.round((slice.amount / largest) * 100)),
    note:
      index === 0
        ? `Your single biggest driver at ${formatInr(slice.perPersonPerDay)} per person each day`
        : slice.verdict === "heavy"
          ? `Running heavy for this trip shape`
          : slice.verdict === "lean"
            ? `Lean — there may be room to spend more here`
            : `${formatInr(slice.perDay)} a day across the group`,
  }));

  /* ---------------------------------------------------------- peer */
  const peerAverage = calculatePeerAverage(destination, validDays, validTravelers);
  const peer = comparePeers(totalCost, peerAverage, destination.name);

  /* ------------------------------------------------------- actions */
  const styleLabel =
    TRAVEL_STYLE_OPTIONS.find((s) => s.id === travelStyle)?.title ?? "Standard";
  const actions: BudgetAction[] = [];

  const stay = amountOf("stay");
  const stayShare = totalCost > 0 ? stay / totalCost : 0;
  if (stay > 0 && stayShare > 0.3) {
    const target = round(stay * 0.78, 500);
    actions.push({
      id: "act-stay",
      title: "Trade the resort for a boutique stay",
      icon: "stay",
      tone: "peach",
      categoryKey: "stay",
      currentChoice: `${styleLabel} hotels at ${formatInr(stay)} for ${validDays} nights`,
      suggestedChange: `Verified boutique stays or apartments at ${formatInr(target)}`,
      rationale: `Accommodation is ${Math.round(stayShare * 100)}% of your trip. Trimming it barely changes the days you actually experience.`,
      expectedSavings: stay - target,
      targetAmount: target,
    });
  }

  const transport = amountOf("transport");
  if (transport >= 3000) {
    const target = round(transport * 0.82, 500);
    actions.push({
      id: "act-transport",
      title: "Lock in fares three weeks out",
      icon: "transport",
      tone: "sky",
      categoryKey: "transport",
      currentChoice: `Flexible or late-booked fares at ${formatInr(transport)}`,
      suggestedChange: `Advance economy fares at ${formatInr(target)}`,
      rationale: "Fares to this region typically bottom out 21 to 28 days before departure.",
      expectedSavings: transport - target,
      targetAmount: target,
    });
  }

  const localTransport = amountOf("local_transport");
  if (localTransport >= 1200) {
    const target = round(localTransport * 0.68, 250);
    actions.push({
      id: "act-local",
      title: "Switch to a transit day pass",
      icon: "local_transport",
      tone: "mint",
      categoryKey: "local_transport",
      currentChoice: `Cabs and ride hailing at ${formatInr(localTransport)}`,
      suggestedChange: `Metro and day passes at ${formatInr(target)}`,
      rationale: `${destination.name} is compact enough that passes beat point-to-point cabs on most days.`,
      expectedSavings: localTransport - target,
      targetAmount: target,
    });
  }

  const food = amountOf("food");
  if (food >= 2500) {
    const target = round(food * 0.84, 250);
    actions.push({
      id: "act-food",
      title: "Two local meals for every restaurant one",
      icon: "food",
      tone: "butter",
      categoryKey: "food",
      currentChoice: `Restaurant-led dining at ${formatInr(food)}`,
      suggestedChange: `Mixed local and restaurant dining at ${formatInr(target)}`,
      rationale: "Local kitchens and markets are usually the better meal anyway, not just the cheaper one.",
      expectedSavings: food - target,
      targetAmount: target,
    });
  }

  const shopping = amountOf("shopping");
  if (shopping >= 2000) {
    const target = round(shopping * 0.75, 250);
    actions.push({
      id: "act-shopping",
      title: "Cap souvenirs at a set number",
      icon: "shopping",
      tone: "lilac",
      categoryKey: "shopping",
      currentChoice: `Open-ended shopping budget of ${formatInr(shopping)}`,
      suggestedChange: `A capped ${formatInr(target)} spent on local artisans`,
      rationale: "Shopping is the category most likely to overrun once you are on the ground.",
      expectedSavings: shopping - target,
      targetAmount: target,
    });
  }

  const emergency = amountOf("emergency");
  const recommendedBuffer = Math.max(2500, Math.round(totalCost * 0.06));
  if (emergency < recommendedBuffer * 0.8) {
    const target = round(recommendedBuffer, 500);
    actions.push({
      id: "act-buffer",
      title: "Top up your safety buffer",
      icon: "emergency",
      tone: "blush",
      categoryKey: "emergency",
      currentChoice: `Buffer of ${formatInr(emergency)}, under 6% of the trip`,
      suggestedChange: `Reserve ${formatInr(target)} for delays and medical cover`,
      rationale: "This is the one line item worth increasing. A thin buffer is what turns a hiccup into a crisis.",
      expectedSavings: -(target - emergency),
      targetAmount: target,
    });
  }

  const savingActions = actions.filter((a) => a.expectedSavings > 0);
  const totalOpportunity = savingActions.reduce((sum, a) => sum + a.expectedSavings, 0);
  const optimizedTotal = Math.max(0, totalCost - totalOpportunity);

  /* -------------------------------------------------------- health */
  const factors: HealthFactor[] = [];
  let score = 78;

  if (peer.position === "below") {
    score += 12;
    factors.push({
      id: "peer",
      label: `${Math.abs(peer.deltaPercentage)}% under the local average`,
      detail: `A comparable trip to ${destination.name} typically runs ${formatInr(peerAverage)}. You are planning below that without cutting the trip short.`,
      sentiment: "positive",
    });
  } else if (peer.position === "above") {
    score -= Math.min(20, Math.abs(peer.deltaPercentage));
    factors.push({
      id: "peer",
      label: `${Math.abs(peer.deltaPercentage)}% above the local average`,
      detail: `Comparable trips land near ${formatInr(peerAverage)}. Worth checking that the extra is buying something you actually want.`,
      sentiment: "negative",
    });
  } else {
    factors.push({
      id: "peer",
      label: "In line with what travellers actually spend",
      detail: `Your plan sits within a few percent of the ${formatInr(peerAverage)} average for this trip.`,
      sentiment: "neutral",
    });
  }

  if (stayShare > 0.45) {
    score -= 12;
    factors.push({
      id: "stay-heavy",
      label: `Accommodation eats ${Math.round(stayShare * 100)}% of the budget`,
      detail: "Above 45%, the room starts crowding out the experiences you travelled for.",
      sentiment: "negative",
    });
  } else if (stayShare >= 0.25 && stayShare <= 0.42) {
    score += 5;
    factors.push({
      id: "stay-ok",
      label: "Accommodation is proportionate",
      detail: `At ${Math.round(stayShare * 100)}% of spend, your stay leaves room for everything else.`,
      sentiment: "positive",
    });
  }

  const bufferShare = totalCost > 0 ? emergency / totalCost : 0;
  if (emergency === 0) {
    score -= 18;
    factors.push({
      id: "buffer-none",
      label: "No emergency buffer at all",
      detail: "A single missed connection or clinic visit would come straight out of the rest of the trip.",
      sentiment: "negative",
    });
  } else if (bufferShare < 0.04) {
    score -= 8;
    factors.push({
      id: "buffer-thin",
      label: `Buffer is only ${Math.round(bufferShare * 100)}% of spend`,
      detail: `Aim for around ${formatInr(recommendedBuffer)} so a surprise does not reshape the itinerary.`,
      sentiment: "negative",
    });
  } else {
    score += 8;
    factors.push({
      id: "buffer-ok",
      label: `Healthy ${formatInr(emergency)} safety net`,
      detail: "Enough to absorb a delay, a clinic visit or a last-minute rebooking.",
      sentiment: "positive",
    });
  }

  const activitiesShare = totalCost > 0 ? amountOf("activity") / totalCost : 0;
  if (activitiesShare < 0.07) {
    score -= 6;
    factors.push({
      id: "activity-lean",
      label: "Experiences are underfunded",
      detail: `Only ${Math.round(activitiesShare * 100)}% goes to the things you will remember. Most of this is worth protecting before anything else.`,
      sentiment: "negative",
    });
  } else if (activitiesShare > 0.1) {
    score += 5;
    factors.push({
      id: "activity-ok",
      label: "Experiences are properly funded",
      detail: `${Math.round(activitiesShare * 100)}% of your budget goes to what you actually came for.`,
      sentiment: "positive",
    });
  }

  if (travelStyle === "luxury" && peer.position === "above") {
    factors.push({
      id: "style",
      label: "Luxury style chosen deliberately",
      detail: "The overage is a style decision, not an accident. Judged against luxury travellers, this is normal.",
      sentiment: "neutral",
    });
    score += 6;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const status: HealthStatus =
    finalScore >= 84 ? "excellent" : finalScore >= 66 ? "good" : "warning";

  const health: FinancialHealth = {
    status,
    score: finalScore,
    tone: status === "excellent" ? "mint" : status === "good" ? "sky" : "blush",
    title:
      status === "excellent"
        ? "This budget is in excellent shape"
        : status === "good"
          ? "A solid budget with a few soft spots"
          : "This budget needs attention before you book",
    summary:
      status === "excellent"
        ? `Your ${validDays}-day plan for ${destination.name} is balanced, buffered and priced below what most travellers pay. Book with confidence.`
        : status === "good"
          ? `The shape of this budget is right. Two or three adjustments would move it from workable to comfortable.`
          : `The allocation is unbalanced enough that something will have to give mid-trip. The fixes below are the highest-leverage ones.`,
    factors,
    opportunities: savingActions.slice(0, 4).map((a) => ({
      id: a.id,
      label: a.title,
      amount: a.expectedSavings,
      detail: a.suggestedChange,
    })),
  };

  /* ------------------------------------------------------- insight */
  const topDriver = drivers[0];
  let insight: string;
  if (status === "warning" && totalOpportunity > 0) {
    insight = `${topDriver.label} is absorbing ${topDriver.percentage}% of your trip. Rebalancing it frees roughly ${formatInr(totalOpportunity)} without shortening a single day.`;
  } else if (peer.position === "below") {
    insight =
      totalOpportunity > 0
        ? `You are planning ${Math.abs(peer.deltaPercentage)}% under the ${destination.name} average, and there is still ${formatInr(totalOpportunity)} of slack in ${topDriver.label.toLowerCase()} if you want it.`
        : `You are planning ${Math.abs(peer.deltaPercentage)}% under the ${destination.name} average with nothing left worth trimming. This is about as efficient as ${destination.name} gets.`;
  } else if (peer.position === "above") {
    insight = `You are ${Math.abs(peer.deltaPercentage)}% above the ${destination.name} average, driven mostly by ${topDriver.label.toLowerCase()} at ${formatInr(topDriver.amount)}.`;
  } else {
    insight =
      totalOpportunity > 0
        ? `A textbook ${validDays}-day ${destination.name} budget — ${topDriver.label.toLowerCase()} leads at ${topDriver.percentage}%, with ${formatInr(totalOpportunity)} still recoverable.`
        : `A textbook ${validDays}-day ${destination.name} budget — ${topDriver.label.toLowerCase()} leads at ${topDriver.percentage}% and every category sits inside its healthy band.`;
  }

  return {
    totalCost,
    perPersonCost: Math.round(totalCost / validTravelers),
    perPersonPerDay: Math.round(totalCost / validTravelers / validDays),
    peer,
    insight,
    allocation: grouped,
    drivers,
    health,
    actions,
    optimizedTotal,
    totalOpportunity,
  };
}

/* ------------------------------------------------------------------ */
/* What-if simulator                                                    */
/* ------------------------------------------------------------------ */

export type SimulatorLeverKey = "stayTier" | "styleShift" | "activityLevel" | "transportMode";

export interface SimulatorChoice {
  id: string;
  label: string;
  caption: string;
  /** Category multipliers applied against the live budget. */
  effects: Partial<Record<ExpenseCategoryKey, number>>;
}

export interface SimulatorLever {
  id: SimulatorLeverKey;
  label: string;
  question: string;
  icon: string;
  tone: ClayTone;
  choices: SimulatorChoice[];
}

export const SIMULATOR_LEVERS: SimulatorLever[] = [
  {
    id: "stayTier",
    label: "Where you sleep",
    question: "What if you changed hotels?",
    icon: "stay",
    tone: "peach",
    choices: [
      { id: "keep", label: "As planned", caption: "No change", effects: {} },
      { id: "boutique", label: "Boutique & apartments", caption: "Around 22% cheaper", effects: { stay: 0.78 } },
      { id: "hostel", label: "Hostels & guesthouses", caption: "Around 45% cheaper", effects: { stay: 0.55 } },
      { id: "upgrade", label: "Upgrade a tier", caption: "Around 35% dearer", effects: { stay: 1.35 } },
    ],
  },
  {
    id: "styleShift",
    label: "Travel style",
    question: "What if you travelled differently?",
    icon: "spark",
    tone: "butter",
    choices: [
      { id: "keep", label: "As planned", caption: "No change", effects: {} },
      {
        id: "leaner",
        label: "One tier leaner",
        caption: "Trims across the board",
        effects: { stay: 0.82, food: 0.78, local_transport: 0.8, shopping: 0.75 },
      },
      {
        id: "backpacker",
        label: "Full backpacker",
        caption: "Maximum frugality",
        effects: { stay: 0.6, food: 0.6, local_transport: 0.55, shopping: 0.5, transport: 0.85 },
      },
      {
        id: "elevated",
        label: "One tier richer",
        caption: "More comfort throughout",
        effects: { stay: 1.3, food: 1.25, local_transport: 1.3 },
      },
    ],
  },
  {
    id: "activityLevel",
    label: "Experiences",
    question: "What if you did fewer paid activities?",
    icon: "activity",
    tone: "mint",
    choices: [
      { id: "keep", label: "As planned", caption: "No change", effects: {} },
      { id: "trim", label: "Trim a quarter", caption: "Drop the weakest tours", effects: { activity: 0.75 } },
      { id: "half", label: "Halve them", caption: "Free sights and walking", effects: { activity: 0.5 } },
      { id: "more", label: "Add more", caption: "Say yes to the day trips", effects: { activity: 1.4 } },
    ],
  },
  {
    id: "transportMode",
    label: "Getting around",
    question: "What if you changed how you move?",
    icon: "local_transport",
    tone: "sky",
    choices: [
      { id: "keep", label: "As planned", caption: "No change", effects: {} },
      { id: "mixed", label: "Mostly transit", caption: "Cabs only at night", effects: { local_transport: 0.7 } },
      {
        id: "public",
        label: "Public only",
        caption: "Passes and slower fares",
        effects: { local_transport: 0.45, transport: 0.88 },
      },
      { id: "private", label: "Private transfers", caption: "Door to door", effects: { local_transport: 1.65 } },
    ],
  },
];

export type SimulatorState = Record<SimulatorLeverKey, string>;

export const DEFAULT_SIMULATOR_STATE: SimulatorState = {
  stayTier: "keep",
  styleShift: "keep",
  activityLevel: "keep",
  transportMode: "keep",
};

export interface SimulationResult {
  projectedTotal: number;
  baseTotal: number;
  delta: number;
  deltaPercentage: number;
  categoryTotals: Record<ExpenseCategoryKey, number>;
  changedCategories: { id: ExpenseCategoryKey; category: string; from: number; to: number }[];
  verdict: string;
}

/** Applies every active lever multiplicatively over the live expense set. */
export function simulateBudget(expenses: ExpenseItem[], state: SimulatorState): SimulationResult {
  const multipliers = {} as Record<ExpenseCategoryKey, number>;
  expenses.forEach((e) => {
    multipliers[e.id] = 1;
  });

  (Object.keys(state) as SimulatorLeverKey[]).forEach((leverId) => {
    const lever = SIMULATOR_LEVERS.find((l) => l.id === leverId);
    const choice = lever?.choices.find((c) => c.id === state[leverId]);
    if (!choice) return;
    (Object.keys(choice.effects) as ExpenseCategoryKey[]).forEach((cat) => {
      if (multipliers[cat] === undefined) return;
      multipliers[cat] *= choice.effects[cat] as number;
    });
  });

  const categoryTotals = {} as Record<ExpenseCategoryKey, number>;
  const changedCategories: SimulationResult["changedCategories"] = [];

  expenses.forEach((e) => {
    const projected = Math.round((e.amount * multipliers[e.id]) / 50) * 50;
    categoryTotals[e.id] = projected;
    if (projected !== e.amount) {
      changedCategories.push({ id: e.id, category: e.category, from: e.amount, to: projected });
    }
  });

  const baseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const projectedTotal = expenses.reduce((sum, e) => sum + categoryTotals[e.id], 0);
  const delta = projectedTotal - baseTotal;
  const deltaPercentage = baseTotal > 0 ? Math.round((delta / baseTotal) * 100) : 0;

  const verdict =
    delta === 0
      ? "Move a lever to see how the total responds."
      : delta < 0
        ? `This version of the trip saves ${formatInr(Math.abs(delta))}.`
        : `This version costs ${formatInr(delta)} more.`;

  return { projectedTotal, baseTotal, delta, deltaPercentage, categoryTotals, changedCategories, verdict };
}
