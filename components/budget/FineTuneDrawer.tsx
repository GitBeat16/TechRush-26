"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { CategoryEditors } from "./CategoryEditors";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { ChevronDownIcon, EditIcon } from "@/components/ui/Icons";
import { springSnappy } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import type { ExpenseCategoryKey, ExpenseItem } from "@/types/budget";

export interface FineTuneDrawerProps {
  expenses: ExpenseItem[];
  baselines: Record<string, number>;
  totalCost: number;
  onAmountChange: (id: ExpenseCategoryKey, amount: number) => void;
  onCommitSimulation: (categoryTotals: Record<ExpenseCategoryKey, number>) => void;
}

/**
 * Everything a first-time visitor does not need.
 *
 * The page above this answers the question people arrive with. Per-category
 * editing and what-if modelling are for the second visit, when someone
 * already trusts the number and wants to argue with it — so they start
 * closed rather than adding two more screens of scrolling to a first look.
 */
export function FineTuneDrawer({
  expenses,
  baselines,
  totalCost,
  onAmountChange,
  onCommitSimulation,
}: FineTuneDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <ClayCard
        tone="surface"
        radius="lg"
        depth="sm"
        interactive
        subtle
        onClick={() => {
          feedback(open ? "toggleOff" : "toggleOn");
          setOpen((current) => !current);
        }}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        className="flex items-center gap-3 border-4 border-white/60 px-5 py-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-clay-sm bg-clay-peach text-clay-ink shadow-clay-xs">
          <EditIcon size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[14.5px] font-bold leading-tight text-clay-ink">
            Fine-tune it yourself
          </p>
          <p className="font-body text-[11.5px] text-clay-ink-soft">
            Adjust each category, or model a different version of the trip
          </p>
        </div>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={springSnappy}
          className="shrink-0 text-clay-muted"
        >
          <ChevronDownIcon size={18} />
        </motion.span>
      </ClayCard>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-5">
              <CategoryEditors
                expenses={expenses}
                baselines={baselines}
                totalCost={totalCost}
                onAmountChange={onAmountChange}
              />
              <WhatIfSimulator expenses={expenses} onCommit={onCommitSimulation} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
