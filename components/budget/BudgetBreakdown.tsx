"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Destination } from "@/types/dashboard";
import type { ExpenseItem } from "@/types/budget";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { TONES } from "@/lib/tones";
import { fadeUp, stagger, springSnappy } from "@/lib/animations";
import { BudgetIcon } from "./BudgetIcons";

export interface BudgetBreakdownProps {
  destination: Destination;
  days: number;
  travelers: number;
  totalCost: number;
  expenses: ExpenseItem[];
  className?: string;
}

export function BudgetBreakdown({
  destination,
  days,
  travelers,
  totalCost,
  expenses,
  className = "",
}: BudgetBreakdownProps) {
  return (
    <ClayCard
      tone="surface"
      radius="xl"
      depth="lg"
      className={`p-5 sm:p-6 space-y-6 border border-clay-sky ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-clay-muted/15 pb-4">
        <div>
          <span className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
            Estimated Trip Budget Breakdown
          </span>
          <h3 className="font-display font-bold text-2xl text-clay-ink leading-tight">
            {destination.name}
          </h3>
          <p className="font-body text-xs font-semibold text-clay-ink-soft">
            {days} Days | {travelers} {travelers === 1 ? "Traveller" : "Travellers"}
          </p>
        </div>

        {/* Total Estimated Cost Badge */}
        <ClayWell radius="md" className="p-3.5 flex flex-col justify-center sm:text-right shrink-0 bg-clay-surface border border-clay-sky shadow-clay-xs">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
            Total Estimated Cost
          </span>
          <span className="font-display text-2xl font-extrabold text-clay-ink tracking-tight">
            {formatInr(totalCost)}
          </span>
        </ClayWell>
      </div>

      {/* Category Breakdown Cards Grid */}
      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {expenses.map((item) => {
          const pct = totalCost > 0 ? Math.round((item.amount / totalCost) * 100) : 0;

          return (
            <motion.div key={item.id} variants={fadeUp}>
              <ClayCard
                tone={item.tone}
                radius="lg"
                depth="sm"
                className="p-4 space-y-3 border border-clay-sky h-full flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-surface border border-clay-sky text-clay-tangerine shadow-clay-xs">
                      <BudgetIcon icon={item.icon} size={18} />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
                        {item.category}
                      </h4>
                      <span className="font-body text-[10px] text-clay-muted line-clamp-1">
                        {item.label}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-clay-surface border border-clay-sky font-body text-[10px] font-bold text-clay-tangerine shadow-clay-xs shrink-0">
                    {pct}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-clay-sky/60">
                  <span className="font-body text-xs font-bold uppercase tracking-wider text-clay-muted">
                    Allocated Amount
                  </span>
                  <span className="font-display text-base font-bold text-clay-ink">
                    {formatInr(item.amount)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-clay-sunken/80 border border-clay-sky/60 overflow-hidden shadow-clay-inset-sm p-0.5">
                  <motion.div
                    className="h-full rounded-full bg-clay-tangerine shadow-clay-xs"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    transition={springSnappy}
                  />
                </div>
              </ClayCard>
            </motion.div>
          );
        })}
      </motion.div>
    </ClayCard>
  );
}
