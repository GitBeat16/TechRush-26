"use client";

import React from "react";
import { motion } from "framer-motion";
import type { BudgetScoreResult } from "@/lib/budget/scoreCalculator";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { SparkIcon } from "@/components/ui/Icons";
import { springSnappy } from "@/lib/animations";

export interface BudgetScoreProps {
  scoreResult: BudgetScoreResult;
  className?: string;
}

export function BudgetScore({ scoreResult, className = "" }: BudgetScoreProps) {
  const { score, label, status, badgeColor, reasons } = scoreResult;

  return (
    <ClayCard
      tone={status === "excellent" ? "mint" : status === "moderate" ? "peach" : "blush"}
      radius="lg"
      depth="md"
      className={`p-5 flex flex-col justify-between space-y-4 border-2 border-white ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-clay-raised/80 text-clay-ink shadow-clay-xs">
            <SparkIcon size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-clay-ink">
              Smart Budget Score
            </h3>
            <p className="font-body text-xs text-clay-ink-soft">
              Real-time financial health index
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full font-display text-xs font-bold shadow-clay-xs border ${badgeColor}`}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Score Circle Gauge */}
        <div className="relative flex items-center justify-center w-24 h-24 shrink-0 bg-white/70 rounded-full shadow-clay-sm border-2 border-white">
          <span className="font-display font-extrabold text-3xl text-clay-ink">
            {score}
          </span>
          <span className="absolute bottom-2 font-body text-[9px] font-bold uppercase tracking-wider text-clay-muted">
            Out of 100
          </span>
        </div>

        {/* Breakdown Reasons */}
        <div className="flex-1 space-y-1.5">
          {reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} className="flex items-center gap-2 font-body text-xs text-clay-ink-soft">
              <span className="text-clay-tangerine">•</span>
              <span className="line-clamp-1">{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </ClayCard>
  );
}
