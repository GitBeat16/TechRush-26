"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { AnimatedNumber } from "./AnimatedNumber";
import { BudgetIcon } from "./BudgetIcons";
import { CompassIcon, RefreshIcon } from "@/components/ui/Icons";
import { formatInr } from "@/lib/data";
import { springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import {
  DEFAULT_SIMULATOR_STATE,
  SIMULATOR_LEVERS,
  simulateBudget,
  type SimulatorLeverKey,
  type SimulatorState,
} from "@/lib/budget/intelligence";
import type { ExpenseCategoryKey, ExpenseItem } from "@/types/budget";

export interface WhatIfSimulatorProps {
  expenses: ExpenseItem[];
  onCommit: (categoryTotals: Record<ExpenseCategoryKey, number>) => void;
}

/**
 * A sandbox for the question every traveller actually asks: "what if I
 * just stayed somewhere cheaper?" Nothing here touches the real budget
 * until the user commits it.
 */
export function WhatIfSimulator({ expenses, onCommit }: WhatIfSimulatorProps) {
  const [state, setState] = useState<SimulatorState>(DEFAULT_SIMULATOR_STATE);

  const result = useMemo(() => simulateBudget(expenses, state), [expenses, state]);
  const dirty = result.delta !== 0;

  const setLever = (lever: SimulatorLeverKey, choice: string) => {
    feedback("toggleOn");
    setState((prev) => ({ ...prev, [lever]: choice }));
  };

  const reset = () => {
    feedback("tap");
    setState(DEFAULT_SIMULATOR_STATE);
  };

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-6 sm:p-8">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clay-sm bg-clay-butter text-clay-ink shadow-clay-xs">
          <CompassIcon size={19} />
        </span>
        <div>
          <h3 className="font-title text-xl leading-tight text-clay-ink sm:text-2xl">
            Try a different version of this trip
          </h3>
          <p className="mt-1 max-w-lg font-body text-sm leading-relaxed text-clay-ink-soft">
            Move a lever and watch the total respond. Nothing is committed until you say so.
          </p>
        </div>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_320px]">
        {/* ---------------------------------------------------- levers */}
        <div className="space-y-6">
          {SIMULATOR_LEVERS.map((lever) => (
            <div key={lever.id}>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-sunken/80 text-clay-ink-soft shadow-clay-inset-sm">
                  <BudgetIcon icon={lever.icon} size={13} />
                </span>
                <div>
                  <p className="font-display text-sm font-bold leading-none text-clay-ink">
                    {lever.question}
                  </p>
                  <p className="mt-1 font-body text-[10px] font-extrabold uppercase tracking-[0.12em] text-clay-muted">
                    {lever.label}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {lever.choices.map((choice) => {
                  const active = state[lever.id] === choice.id;
                  return (
                    <motion.button
                      key={choice.id}
                      type="button"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      transition={springSnappy}
                      onClick={() => setLever(lever.id, choice.id)}
                      className={[
                        "rounded-clay-sm px-3 py-2.5 text-left transition-shadow duration-200",
                        active
                          ? "bg-clay-raised text-clay-ink shadow-clay-sm"
                          : "bg-clay-sunken/50 text-clay-ink-soft shadow-clay-inset-sm hover:text-clay-ink",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      <p className="font-display text-[12.5px] font-bold leading-tight">
                        {choice.label}
                      </p>
                      <p className="mt-0.5 font-body text-[10.5px] leading-tight text-clay-muted">
                        {choice.caption}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ------------------------------------------------ live result */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-clay bg-clay-sunken/50 p-5 shadow-clay-inset">
            <p className="font-body text-[10px] font-extrabold uppercase tracking-[0.14em] text-clay-muted">
              Simulated total
            </p>
            <AnimatedNumber
              value={result.projectedTotal}
              prefix="₹"
              className="mt-1 block font-title text-[2.1rem] leading-none text-clay-ink"
            />

            <div className="mt-2 flex items-center gap-2">
              <span
                className={[
                  "rounded-full px-2.5 py-1 font-display text-[11px] font-bold shadow-clay-xs",
                  result.delta < 0
                    ? "bg-clay-mint text-clay-ink"
                    : result.delta > 0
                      ? "bg-clay-blush text-clay-ink"
                      : "bg-clay-sunken text-clay-ink-soft",
                ].join(" ")}
              >
                {result.delta === 0
                  ? "No change"
                  : `${result.delta < 0 ? "−" : "+"}${formatInr(Math.abs(result.delta))}`}
              </span>
              <span className="font-body text-[11px] font-semibold text-clay-muted">
                vs {formatInr(result.baseTotal)} planned
              </span>
            </div>

            <p className="mt-3 font-body text-xs leading-relaxed text-clay-ink-soft">
              {result.verdict}
            </p>

            {/* what actually moved */}
            <AnimatePresence initial={false}>
              {result.changedCategories.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-1.5 border-t border-clay-muted/20 pt-3">
                    {result.changedCategories.map((change) => (
                      <motion.div
                        key={change.id}
                        layout
                        transition={springSoft}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <span className="truncate font-body text-[11px] text-clay-ink-soft">
                          {change.category}
                        </span>
                        <span className="shrink-0 font-body text-[11px] font-semibold text-clay-ink">
                          <span className="text-clay-muted line-through">
                            {formatInr(change.from)}
                          </span>{" "}
                          {formatInr(change.to)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex flex-wrap gap-2">
              <ClayButton
                variant="primary"
                size="sm"
                disabled={!dirty}
                onClick={() => {
                  onCommit(result.categoryTotals);
                  setState(DEFAULT_SIMULATOR_STATE);
                }}
              >
                Make this the plan
              </ClayButton>
              <ClayButton
                variant="ghost"
                size="sm"
                disabled={!dirty}
                onClick={reset}
                leftIcon={<RefreshIcon size={14} />}
              >
                Reset
              </ClayButton>
            </div>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
