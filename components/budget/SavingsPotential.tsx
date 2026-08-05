"use client";

import React from "react";
import type { SavingsPotentialData } from "@/lib/budget/recommendations";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { SparkIcon } from "@/components/ui/Icons";

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
      className={`p-5 space-y-4 border-2 border-white ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-white/80 text-emerald-800 shadow-clay-xs">
          <SparkIcon size={18} />
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

        <ClayWell radius="md" className="p-3 text-center bg-white/60">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Optimized Cost
          </span>
          <p className="font-display font-bold text-base text-emerald-800 mt-0.5">
            {formatInr(optimizedCost)}
          </p>
        </ClayWell>

        <ClayWell radius="md" className="p-3 text-center bg-emerald-100/70 border border-emerald-300">
          <span className="font-body text-[10px] font-bold uppercase tracking-wider text-emerald-900">
            Possible Savings
          </span>
          <p className="font-display font-bold text-base text-emerald-900 mt-0.5">
            {formatInr(potentialSavings)}
          </p>
        </ClayWell>
      </div>
    </ClayCard>
  );
}
