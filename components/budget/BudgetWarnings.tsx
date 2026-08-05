"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BudgetWarning } from "@/lib/budget/warnings";
import { fadeUp, springSnappy } from "@/lib/animations";

export interface BudgetWarningsProps {
  warnings: BudgetWarning[];
  className?: string;
}

export function BudgetWarnings({ warnings, className = "" }: BudgetWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      <AnimatePresence>
        {warnings.map((warn) => {
          const isHigh = warn.severity === "high";
          return (
            <motion.div
              key={warn.id}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={springSnappy}
              className={`p-4 rounded-clay-sm flex items-start gap-3.5 shadow-clay-xs border-2 ${
                isHigh
                  ? "bg-rose-50/95 border-rose-300 text-rose-950"
                  : "bg-amber-50/95 border-amber-300 text-amber-950"
              }`}
            >
              <span className="text-2xl shrink-0 leading-none">{warn.icon}</span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm leading-tight">
                    {warn.title}
                  </h4>
                  {warn.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/70 shadow-clay-xs">
                      {warn.category}
                    </span>
                  )}
                </div>
                <p className="font-body text-xs leading-relaxed opacity-90">
                  {warn.message}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
