"use client";

import React from "react";
import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { AnimatedNumber } from "./AnimatedNumber";
import { BudgetIcon } from "./BudgetIcons";
import { EditIcon, PlusIcon } from "@/components/ui/Icons";
import { TONES } from "@/lib/tones";
import { formatInr } from "@/lib/data";
import { revealViewport, springSnappy, springSoft, stagger } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { CATEGORY_PREFERENCES } from "@/lib/budget/intelligence";
import type { ExpenseCategoryKey, ExpenseItem } from "@/types/budget";

export interface CategoryEditorsProps {
  expenses: ExpenseItem[];
  /** The estimator's untouched amount per category, used as the 1.0 anchor. */
  baselines: Record<string, number>;
  totalCost: number;
  onAmountChange: (id: ExpenseCategoryKey, amount: number) => void;
}

/**
 * Sliders ask "pick a number". These cards ask "how do you want to
 * travel", then do the arithmetic — with +/- for anyone who wants the
 * number after all.
 */
export function CategoryEditors({
  expenses,
  baselines,
  totalCost,
  onAmountChange,
}: CategoryEditorsProps) {
  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-6 sm:p-8">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clay-sm bg-clay-peach text-clay-ink shadow-clay-xs">
          <EditIcon size={18} />
        </span>
        <div>
          <h3 className="font-title text-xl leading-tight text-clay-ink sm:text-2xl">
            Tune it category by category
          </h3>
          <p className="mt-1 max-w-lg font-body text-sm leading-relaxed text-clay-ink-soft">
            Pick the experience you want in each area. The budget follows the choice rather than
            the other way round.
          </p>
        </div>
      </header>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mt-6 grid gap-4 md:grid-cols-2"
      >
        {expenses.map((expense) => {
          const baseline = baselines[expense.id] || expense.amount || 1;
          const preferences = CATEGORY_PREFERENCES[expense.id] ?? [];
          const ratio = expense.amount / baseline;
          const closest = preferences.reduce(
            (best, pref) =>
              Math.abs(pref.multiplier - ratio) < Math.abs(best.multiplier - ratio) ? pref : best,
            preferences[0]
          );
          const matchesPreference = closest && Math.abs(closest.multiplier - ratio) < 0.08;
          const share = totalCost > 0 ? Math.round((expense.amount / totalCost) * 100) : 0;

          return (
            <motion.div
              key={expense.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: springSoft },
              }}
              className="rounded-clay bg-clay-raised/85 p-5 shadow-clay-sm"
            >
              {/* head */}
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-clay-sm text-clay-ink shadow-clay-xs"
                  style={{ backgroundColor: TONES[expense.tone].hex }}
                >
                  <BudgetIcon icon={expense.icon} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-[15px] font-bold leading-tight text-clay-ink">
                    {expense.category}
                  </h4>
                  <p className="mt-0.5 font-body text-[11px] leading-snug text-clay-ink-soft">
                    {expense.label}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-clay-sunken/70 px-2 py-1 font-body text-[10px] font-extrabold text-clay-ink-soft shadow-clay-inset-sm">
                  {share}%
                </span>
              </div>

              {/* amount + steppers */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-clay-sm bg-clay-sunken/50 px-3 py-2.5 shadow-clay-inset-sm">
                <Stepper
                  direction="down"
                  disabled={expense.amount <= expense.min}
                  onClick={() =>
                    onAmountChange(
                      expense.id,
                      Math.max(expense.min, expense.amount - expense.step)
                    )
                  }
                />

                <div className="text-center">
                  <AnimatedNumber
                    value={expense.amount}
                    prefix="₹"
                    duration={0.4}
                    className="font-title text-xl leading-none text-clay-ink"
                  />
                  <p className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-clay-muted">
                    {formatInr(expense.step)} steps
                  </p>
                </div>

                <Stepper
                  direction="up"
                  disabled={expense.amount >= expense.max}
                  onClick={() =>
                    onAmountChange(
                      expense.id,
                      Math.min(expense.max, expense.amount + expense.step)
                    )
                  }
                />
              </div>

              {/* preference selector */}
              {preferences.length > 0 && (
                <div className="mt-4">
                  <p className="font-body text-[9px] font-extrabold uppercase tracking-[0.12em] text-clay-muted">
                    Preference
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {preferences.map((pref) => {
                      const active = matchesPreference && closest.id === pref.id;
                      return (
                        <motion.button
                          key={pref.id}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          transition={springSnappy}
                          onClick={() => {
                            feedback("toggleOn");
                            const next = Math.round((baseline * pref.multiplier) / expense.step) * expense.step;
                            onAmountChange(
                              expense.id,
                              Math.max(expense.min, Math.min(expense.max, next))
                            );
                          }}
                          className={[
                            "rounded-clay-sm px-2 py-2 text-center transition-shadow duration-200",
                            active
                              ? "bg-clay-butter text-clay-ink shadow-clay-xs"
                              : "bg-clay-sunken/50 text-clay-ink-soft shadow-clay-inset-sm hover:text-clay-ink",
                          ].join(" ")}
                          aria-pressed={active}
                          title={pref.hint}
                        >
                          <span className="block font-display text-[11px] font-bold leading-tight">
                            {pref.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="mt-2 font-body text-[11px] leading-snug text-clay-muted">
                    {matchesPreference ? closest.hint : "Custom amount"}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </ClayCard>
  );
}

function Stepper({
  direction,
  disabled,
  onClick,
}: {
  direction: "up" | "down";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      transition={springSnappy}
      disabled={disabled}
      onClick={() => {
        feedback("tap");
        onClick();
      }}
      aria-label={direction === "up" ? "Increase" : "Decrease"}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-ink shadow-clay-xs transition-shadow hover:shadow-clay-sm active:shadow-clay-pressed disabled:opacity-40"
    >
      {direction === "up" ? (
        <PlusIcon size={16} />
      ) : (
        <span className="block h-[2px] w-3.5 rounded-full bg-current" />
      )}
    </motion.button>
  );
}
