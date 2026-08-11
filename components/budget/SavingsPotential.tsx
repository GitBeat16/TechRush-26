"use client";

import React from "react";
import type { SavingsPotentialData } from "@/lib/budget/recommendations";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { PiggyBankIcon } from "@/components/ui/Icons";

export interface SavingsPotentialProps {
  savingsData: SavingsPotentialData;
  className?: string;
}

export function SavingsPotential({
  savingsData,
  className = "",
}: SavingsPotentialProps) {
  const { currentCost, optimizedCost, potentialSavings } = savingsData;

  return (
    <ClayCard
      tone="mint"
      radius="lg"
      depth="md"
      className={`p-5 space-y-4 border border-clay-sky ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-clay-surface border border-clay-sky text-clay-tangerine shadow-clay-xs">
          <PiggyBankIcon size={18} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-clay-ink">
            Estimated Savings Potential
          </h3>
          <p className="font-body text-xs text-clay-ink-soft">
            Based on rule-based optimizations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <ClayWell radius="md" className="p-3 text-center">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
            Current Cost
          </span>
          <p className="font-display font-bold text-base text-clay-ink mt-0.5">
            {formatInr(currentCost)}
          </p>
        </ClayWell>

        <ClayWell radius="md" className="p-3 text-center bg-clay-surface/80 border border-clay-sky">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-tangerine">
            Optimized Cost
          </span>
          <p className="font-display font-bold text-base text-clay-tangerine mt-0.5">
            {formatInr(optimizedCost)}
          </p>
        </ClayWell>

        <ClayWell radius="md" className="p-3 text-center bg-clay-sunken/90 border border-clay-tangerine/40">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-tangerine">
            Possible Savings
          </span>
          <p className="font-display font-bold text-base text-clay-tangerine mt-0.5">
            {formatInr(potentialSavings)}
          </p>
        </ClayWell>
      </div>
    </ClayCard>
  );
}
