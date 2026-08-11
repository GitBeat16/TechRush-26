"use client";

import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClayButton } from "@/components/ui/ClayButton";
import { RefreshIcon, WalletIcon } from "@/components/ui/Icons";
import { TripIntelligenceHero } from "@/components/budget/TripIntelligenceHero";
import { BudgetAllocationStudio } from "@/components/budget/BudgetAllocationStudio";
import { AssistantRecommendations } from "@/components/budget/AssistantRecommendations";
import { FineTuneDrawer } from "@/components/budget/FineTuneDrawer";
import { DESTINATIONS } from "@/lib/data";
import {
  calculateSmartBudgetEstimate,
  getDestinationById,
} from "@/lib/budget/budgetEstimator";
import { buildBudgetIntelligence, type BudgetAction } from "@/lib/budget/intelligence";
import { fadeUp, revealViewport } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import type { Destination } from "@/types/dashboard";
import type { ExpenseCategoryKey, ExpenseItem, TravelStyleKey } from "@/types/budget";

/**
 * Smart Budget Planner
 * ---------------------------------------------------------------------------
 * Structured as a single narrative rather than a grid of widgets:
 *   what this trip costs → where the money goes → is that healthy →
 *   what is driving it → what to change → what if → fine tuning.
 */
export default function SmartBudgetPlannerPage() {
  const [destination, setDestination] = useState<Destination>(() => DESTINATIONS[0]);
  const [days, setDays] = useState(5);
  const [travelers, setTravelers] = useState(2);
  const [travelStyle, setTravelStyle] = useState<TravelStyleKey>("standard");

  /* The untouched estimate for the current trip shape. Doubles as the
     anchor the category preference selectors multiply against. */
  const estimate = useMemo(
    () => calculateSmartBudgetEstimate({ destination, days, travelers, travelStyle }),
    [destination, days, travelers, travelStyle]
  );

  const [expenses, setExpenses] = useState<ExpenseItem[]>(estimate.expenses);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  /* Any change to the trip shape invalidates every manual edit. Adjusted
     during render rather than in an effect, so the page never paints a
     frame of stale numbers. */
  const shapeKey = `${destination.id}|${days}|${travelers}|${travelStyle}`;
  const [lastShapeKey, setLastShapeKey] = useState(shapeKey);
  if (lastShapeKey !== shapeKey) {
    setLastShapeKey(shapeKey);
    setExpenses(estimate.expenses);
    setAppliedIds([]);
  }

  const baselines = useMemo(() => {
    const map: Record<string, number> = {};
    estimate.expenses.forEach((item) => {
      map[item.id] = item.amount;
    });
    return map;
  }, [estimate]);

  const intelligence = useMemo(
    () => buildBudgetIntelligence({ destination, days, travelers, travelStyle, expenses }),
    [destination, days, travelers, travelStyle, expenses]
  );

  /* --------------------------------------------------------- handlers */

  const handleDestinationChange = useCallback((id: string) => {
    setDestination(getDestinationById(id));
  }, []);

  const handleAmountChange = useCallback((id: ExpenseCategoryKey, amount: number) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: Math.max(item.min, amount) } : item))
    );
  }, []);

  const applyAction = useCallback((action: BudgetAction) => {
    feedback("success");
    setExpenses((prev) =>
      prev.map((item) =>
        item.id === action.categoryKey
          ? { ...item, amount: Math.max(item.min, action.targetAmount) }
          : item
      )
    );
    setAppliedIds((prev) => (prev.includes(action.id) ? prev : [...prev, action.id]));
  }, []);

  /** The hero CTA: commits every money-saving recommendation at once. */
  const handleOptimize = useCallback(() => {
    const savers = intelligence.actions.filter((a) => a.expectedSavings > 0);
    if (savers.length === 0) return;
    feedback("success");
    setExpenses((prev) =>
      prev.map((item) => {
        const action = savers.find((a) => a.categoryKey === item.id);
        return action ? { ...item, amount: Math.max(item.min, action.targetAmount) } : item;
      })
    );
    setAppliedIds((prev) => Array.from(new Set([...prev, ...savers.map((a) => a.id)])));
  }, [intelligence.actions]);

  const handleCommitSimulation = useCallback(
    (categoryTotals: Record<ExpenseCategoryKey, number>) => {
      feedback("success");
      setExpenses((prev) =>
        prev.map((item) => ({
          ...item,
          amount: Math.max(item.min, categoryTotals[item.id] ?? item.amount),
        }))
      );
      setAppliedIds([]);
    },
    []
  );

  const handleReset = useCallback(() => {
    feedback("tap");
    setExpenses(estimate.expenses);
    setAppliedIds([]);
  }, [estimate]);

  /* ------------------------------------------------------------ view */

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow="AI travel finance"
        title="Smart Budget Planner"
        subtitle="Your assistant prices the trip, explains the number, and tells you exactly what to change."
        icon={<WalletIcon size={24} />}
        action={
          <ClayButton
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<RefreshIcon size={15} />}
          >
            Reset to recommended
          </ClayButton>
        }
      />

      {/* Three questions, in the order people ask them: what does it cost,
          what is it made of, how do I make it cheaper. Anything past that
          lives in the drawer. */}
      <div className="space-y-5">
        <Section>
          <TripIntelligenceHero
            destination={destination}
            days={days}
            travelers={travelers}
            travelStyle={travelStyle}
            totalCost={intelligence.totalCost}
            perPersonPerDay={intelligence.perPersonPerDay}
            peer={intelligence.peer}
            health={intelligence.health}
            opportunity={intelligence.totalOpportunity}
            onDestinationChange={handleDestinationChange}
            onDaysChange={setDays}
            onTravelersChange={setTravelers}
            onTravelStyleChange={setTravelStyle}
            onOptimize={handleOptimize}
          />
        </Section>

        <Section>
          <BudgetAllocationStudio
            allocation={intelligence.allocation}
            totalCost={intelligence.totalCost}
            days={days}
            travelers={travelers}
          />
        </Section>

        <Section>
          <AssistantRecommendations
            actions={intelligence.actions}
            appliedIds={appliedIds}
            onApply={applyAction}
          />
        </Section>

        <Section>
          <FineTuneDrawer
            expenses={expenses}
            baselines={baselines}
            totalCost={intelligence.totalCost}
            onAmountChange={handleAmountChange}
            onCommitSimulation={handleCommitSimulation}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      {children}
    </motion.section>
  );
}
