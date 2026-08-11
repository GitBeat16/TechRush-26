"use client";

import React from "react";
import { motion } from "framer-motion";
import type { CategoryContribution } from "@/lib/budget/budgetAnalyzer";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { TONES } from "@/lib/tones";
import type { ClayTone } from "@/types/dashboard";
import { springSnappy } from "@/lib/animations";
import { BudgetIcon } from "./BudgetIcons";

export interface ExpenseAnalysisProps {
  categoryBreakdown: CategoryContribution[];
  className?: string;
}

export function ExpenseAnalysis({
  categoryBreakdown,
  className = "",
}: ExpenseAnalysisProps) {
  return (
    <ClayCard
      tone="surface"
      radius="lg"
      depth="md"
      className={`p-5 space-y-4 border border-clay-sky ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-clay-ink">
          Expense Share & Contribution Analysis
        </h3>
        <span className="font-body text-xs text-clay-muted">
          Percentage breakdown
        </span>
      </div>

      <div className="space-y-3">
        {categoryBreakdown.map((item) => {
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-clay-ink">
                <span className="flex items-center gap-2">
                  <BudgetIcon icon={item.icon} size={16} />
                  <span>{item.category}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-display text-xs font-bold text-clay-ink">
                    {formatInr(item.amount)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-clay-surface border border-clay-sky/60 text-[10px] font-bold text-clay-tangerine shadow-clay-xs">
                    {item.percentage}%
                  </span>
                </span>
              </div>

              {/* Progress bar contribution */}
              <div className="h-3.5 w-full rounded-full bg-clay-sunken/80 border border-clay-sky/60 shadow-clay-inset-sm overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-clay-tangerine shadow-clay-xs"
                  animate={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  transition={springSnappy}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ClayCard>
  );
}
