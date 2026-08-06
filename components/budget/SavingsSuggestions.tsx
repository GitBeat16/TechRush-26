"use client";

import React from "react";
import { motion } from "framer-motion";
import type { SavingsRecommendation } from "@/lib/budget/recommendations";
import { ClayCard } from "@/components/ui/ClayCard";
import { SparkIcon } from "@/components/ui/Icons";
import { fadeUp, stagger } from "@/lib/animations";
import { BudgetIcon } from "./BudgetIcons";

export interface SavingsSuggestionsProps {
  recommendations: SavingsRecommendation[];
  className?: string;
}

export function SavingsSuggestions({
  recommendations,
  className = "",
}: SavingsSuggestionsProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 px-1">
        <SparkIcon size={18} className="text-clay-tangerine" />
        <h3 className="font-display text-lg font-bold text-clay-ink">
          Smart Savings Suggestions
        </h3>
      </div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2"
      >
        {recommendations.map((rec) => (
          <motion.div key={rec.id} variants={fadeUp}>
            <ClayCard
              tone={rec.tone}
              radius="md"
              depth="sm"
              className="p-4 flex items-start gap-3.5 border-2 border-white/80 h-full"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-clay-ink shadow-clay-xs">
                <BudgetIcon icon={rec.icon} size={18} />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
                  {rec.title}
                </h4>
                <p className="font-body text-xs text-clay-ink-soft leading-relaxed">
                  {rec.suggestion}
                </p>
              </div>
            </ClayCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
