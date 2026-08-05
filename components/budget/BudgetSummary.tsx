"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import type { BudgetSummaryData } from "@/types/budget";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { CircularBudgetProgress, LinearBudgetProgress } from "./BudgetProgress";
import { ReceiptIcon, WalletIcon } from "@/components/ui/Icons";
import { springSnappy } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";

export interface BudgetSummaryProps {
  summary: BudgetSummaryData;
  onUpdateTotalBudget?: (newTotal: number) => void;
  onResetDefaults?: () => void;
  className?: string;
}

export function BudgetSummary({
  summary,
  onUpdateTotalBudget,
  onResetDefaults,
  className = "",
}: BudgetSummaryProps) {
  const { play } = useFeedback();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(summary.totalBudget.toString());

  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(budgetValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && onUpdateTotalBudget) {
      onUpdateTotalBudget(parsed);
      play("pop");
    }
    setIsEditingBudget(false);
  };

  const isExceeded = summary.status === "exceeded";

  return (
    <ClayCard
      tone="surface"
      radius="xl"
      depth="lg"
      className={`p-5 sm:p-6 border-4 border-white/80 ${className}`}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Stats Grid */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-clay-ink-soft">
              <WalletIcon size={20} className="text-clay-tangerine" />
              <span className="font-body text-xs font-bold uppercase tracking-wider text-clay-muted">
                Smart Budget Overview
              </span>
            </div>

            {onResetDefaults && (
              <button
                onClick={() => {
                  onResetDefaults();
                  play("toggleOff");
                }}
                className="rounded-full bg-clay-sunken px-3.5 py-1.5 font-body text-xs font-bold text-clay-ink shadow-clay-xs hover:bg-clay-peach transition-colors border border-white/60"
              >
                ↺ Reset to Recommended Budget
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Total Budget Card */}
            <ClayWell radius="md" className="p-3.5 flex flex-col justify-between">
              <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
                Trip Budget
              </span>
              {isEditingBudget ? (
                <form onSubmit={handleBudgetSubmit} className="mt-1 flex items-center gap-1">
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="w-full bg-clay-surface rounded px-2 py-1 font-display text-sm font-bold text-clay-ink outline-none border border-clay-tangerine"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-1 rounded bg-clay-peach text-xs font-bold text-clay-ink"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <div
                  onClick={() => {
                    setBudgetValue(summary.totalBudget.toString());
                    setIsEditingBudget(true);
                    play("tap");
                  }}
                  title="Click to edit total budget limit"
                  className="mt-1 cursor-pointer group flex items-baseline justify-between"
                >
                  <span className="font-display text-xl font-bold text-clay-ink group-hover:text-clay-tangerine transition-colors">
                    {formatInr(summary.totalBudget)}
                  </span>
                  <span className="text-[10px] font-bold text-clay-muted opacity-60 group-hover:opacity-100">
                    ✎ Edit
                  </span>
                </div>
              )}
              <span className="mt-1 font-body text-[10px] text-clay-muted">
                Target allocation
              </span>
            </ClayWell>

            {/* Estimated Trip Cost */}
            <ClayWell radius="md" className="p-3.5 flex flex-col justify-between">
              <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
                Estimated Cost
              </span>
              <span className="mt-1 font-display text-xl font-bold text-clay-ink">
                {formatInr(summary.totalCost)}
              </span>
              <span className="mt-1 font-body text-[10px] text-clay-muted">
                Live category total
              </span>
            </ClayWell>

            {/* Remaining Budget */}
            <ClayWell
              radius="md"
              className={`p-3.5 flex flex-col justify-between col-span-2 sm:col-span-1 ${
                isExceeded ? "bg-rose-50/70 border border-rose-200" : ""
              }`}
            >
              <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
                {isExceeded ? "Over Budget By" : "Remaining"}
              </span>
              <span
                className={`mt-1 font-display text-xl font-bold ${
                  isExceeded ? "text-rose-700" : "text-emerald-800"
                }`}
              >
                {formatInr(Math.abs(summary.remainingBudget))}
              </span>
              <span className="mt-1 font-body text-[10px] text-clay-muted">
                {isExceeded ? "Action needed" : "Unallocated buffer"}
              </span>
            </ClayWell>
          </div>

          {/* Linear Progress Bar */}
          <div className="pt-1">
            <LinearBudgetProgress percentageUsed={summary.percentageUsed} status={summary.status} />
          </div>
        </div>

        {/* Right Circular Progress Ring & Badge */}
        <div className="flex flex-col items-center justify-center lg:pl-6 lg:border-l lg:border-clay-muted/15">
          <CircularBudgetProgress percentageUsed={summary.percentageUsed} status={summary.status} size={120} strokeWidth={11} />
        </div>
      </div>
    </ClayCard>
  );
}
