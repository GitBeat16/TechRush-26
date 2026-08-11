"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { TripDetails } from "@/components/budget/TripDetails";
import { BudgetBreakdown } from "@/components/budget/BudgetBreakdown";
import { BudgetSummary } from "@/components/budget/BudgetSummary";
import { ExpenseList } from "@/components/budget/ExpenseList";
import { BudgetScore } from "@/components/budget/BudgetScore";
import { BudgetWarnings } from "@/components/budget/BudgetWarnings";
import { SavingsPotential } from "@/components/budget/SavingsPotential";
import { SavingsSuggestions } from "@/components/budget/SavingsSuggestions";
import { ExpenseAnalysis } from "@/components/budget/ExpenseAnalysis";
import { DestinationTips } from "@/components/budget/DestinationTips";
import { WalletIcon } from "@/components/ui/Icons";
import { DESTINATIONS } from "@/lib/data";
import { calculateSmartBudgetEstimate, getDestinationById } from "@/lib/budget/budgetEstimator";
import { calculateBudgetSummary } from "@/lib/budget/calculations";
import { analyzeBudget } from "@/lib/budget/budgetAnalyzer";
import type { Destination } from "@/types/dashboard";
import type { ExpenseItem, TravelStyleKey } from "@/types/budget";

export default function ManualSmartBudgetPlannerPage() {
  // Manual destination selection state (defaults to Goa or first destination)
  const [selectedDestination, setSelectedDestination] = useState<Destination>(() => DESTINATIONS[0]);

  // Trip parameter states
  const [days, setDays] = useState<number>(5);
  const [travelers, setTravelers] = useState<number>(2);
  const [travelStyle, setTravelStyle] = useState<TravelStyleKey>("standard");

  // Destination change handler from custom clay dropdown
  const handleDestinationChange = useCallback((destId: string) => {
    const matched = getDestinationById(destId);
    setSelectedDestination(matched);
  }, []);

  // Console debugging log as required
  useEffect(() => {
    if (selectedDestination?.name) {
      console.log("Selected destination:", selectedDestination.name);
    }
  }, [selectedDestination?.name]);

  // Calculate smart budget estimate dynamically based on trip parameters
  const smartEstimate = useMemo(() => {
    return calculateSmartBudgetEstimate({
      destination: selectedDestination,
      days,
      travelers,
      travelStyle,
    });
  }, [selectedDestination, days, travelers, travelStyle]);

  // State for total target budget & category expense items
  const [totalBudget, setTotalBudget] = useState<number>(smartEstimate.targetBudget);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(smartEstimate.expenses);

  // When trip parameters or manually selected destination changes, load recalculated smart budget automatically
  useEffect(() => {
    const estimate = calculateSmartBudgetEstimate({
      destination: selectedDestination,
      days,
      travelers,
      travelStyle,
    });
    setTotalBudget(estimate.targetBudget);
    setExpenses(estimate.expenses);
  }, [selectedDestination, days, travelers, travelStyle]);

  // Live basic summary calculation
  const summary = useMemo(() => {
    return {
      ...calculateBudgetSummary(totalBudget, expenses),
      destination: selectedDestination,
    };
  }, [totalBudget, expenses, selectedDestination]);

  // Live rule-based intelligence analysis
  const analysis = useMemo(() => {
    return analyzeBudget(totalBudget, expenses, selectedDestination);
  }, [totalBudget, expenses, selectedDestination]);

  // Handle manual category expense slider edits
  const handleAmountChange = useCallback((id: ExpenseItem["id"], newAmount: number) => {
    setExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: newAmount } : item))
    );
  }, []);

  // Handle total budget target edit
  const handleUpdateTotalBudget = useCallback((newTotal: number) => {
    setTotalBudget(newTotal);
  }, []);

  // Reset to recommended budget for current trip details
  const handleResetDefaults = useCallback(() => {
    const estimate = calculateSmartBudgetEstimate({
      destination: selectedDestination,
      days,
      travelers,
      travelStyle,
    });
    setTotalBudget(estimate.targetBudget);
    setExpenses(estimate.expenses);
  }, [selectedDestination, days, travelers, travelStyle]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Smart Travel Budget Planner"
        title="Custom Trip Cost Planner"
        subtitle="Manually select your destination, duration, travelers & travel style to generate tailored trip cost estimates and live budget analytics."
        icon={<WalletIcon size={24} />}
      />

      {/* Section 1: Trip Details Card (Custom Clay Destination Selector + Duration/Travellers Clay Dropdowns + Travel Style Cards) */}
      <TripDetails
        destination={selectedDestination}
        days={days}
        travelers={travelers}
        travelStyle={travelStyle}
        onDestinationChange={handleDestinationChange}
        onDaysChange={setDays}
        onTravelersChange={setTravelers}
        onTravelStyleChange={setTravelStyle}
      />

      {/* Section 2: Estimated Budget Breakdown Section */}
      <BudgetBreakdown
        destination={selectedDestination}
        days={days}
        travelers={travelers}
        totalCost={summary.totalCost}
        expenses={expenses}
      />

      {/* Dynamic Threshold Warnings (Appears & Disappears automatically) */}
      <BudgetWarnings warnings={analysis.warnings} />

      {/* Section 3: Live Budget Summary Overview & Allocation Control */}
      <BudgetSummary
        summary={summary}
        onUpdateTotalBudget={handleUpdateTotalBudget}
        onResetDefaults={handleResetDefaults}
      />

      {/* Section 4: Smart Budget Score & Savings Potential Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <BudgetScore scoreResult={analysis.scoreResult} />
        <SavingsPotential savingsData={analysis.savingsData} />
      </div>

      {/* Section 5: Smart Savings Suggestions */}
      <SavingsSuggestions recommendations={analysis.savingsData.recommendations} />

      {/* Section 6: Category Expense Sliders Grid */}
      <ExpenseList
        expenses={expenses}
        onAmountChange={handleAmountChange}
      />

      {/* Section 7: Expense Share Analysis & Destination Tips */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ExpenseAnalysis categoryBreakdown={analysis.categoryBreakdown} />
        <DestinationTips destination={selectedDestination} tips={analysis.destinationTips} />
      </div>
    </div>
  );
}
