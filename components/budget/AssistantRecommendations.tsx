"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { BudgetIcon } from "./BudgetIcons";
import { ArrowRightIcon, CheckIcon, SparkIcon } from "@/components/ui/Icons";
import { TONES } from "@/lib/tones";
import { formatInr } from "@/lib/data";
import { revealViewport, springSoft, stagger } from "@/lib/animations";
import type { BudgetAction } from "@/lib/budget/intelligence";

/** More than three asks the user to do homework rather than make a decision. */
const MAX_VISIBLE = 3;

export interface AssistantRecommendationsProps {
  actions: BudgetAction[];
  appliedIds: string[];
  onApply: (action: BudgetAction) => void;
}

/**
 * The three highest-value swaps, each one a single decision: what changes,
 * what it saves, and a button that commits it.
 */
export function AssistantRecommendations({
  actions,
  appliedIds,
  onApply,
}: AssistantRecommendationsProps) {
  // Biggest wins first, but anything already applied holds its place so the
  // list does not reshuffle under the cursor as you work down it.
  const visible = useMemo(() => {
    const applied = actions.filter((a) => appliedIds.includes(a.id));
    const pending = [...actions]
      .filter((a) => !appliedIds.includes(a.id))
      .sort((a, b) => Math.abs(b.expectedSavings) - Math.abs(a.expectedSavings));
    return [...applied, ...pending].slice(0, MAX_VISIBLE);
  }, [actions, appliedIds]);

  if (visible.length === 0) {
    return (
      <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-6 text-center">
        <p className="font-display text-sm font-bold text-clay-ink">Nothing left to trim</p>
        <p className="mt-1 font-body text-[12.5px] text-clay-ink-soft">
          Every category is already inside its healthy band for this trip.
        </p>
      </ClayCard>
    );
  }

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-6 sm:p-7">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-clay-sm bg-clay-lilac text-clay-ink shadow-clay-xs">
          <SparkIcon size={17} />
        </span>
        <h3 className="font-title text-lg leading-tight text-clay-ink sm:text-xl">Ways to save</h3>
      </header>

      <motion.div
        variants={stagger(0.07)}
        initial="hidden"
        whileInView="show"
        viewport={revealViewport}
        className="mt-5 space-y-2.5"
      >
        {visible.map((action) => {
          const applied = appliedIds.includes(action.id);
          const isIncrease = action.expectedSavings < 0;

          return (
            <motion.article
              key={action.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: springSoft },
              }}
              className={[
                "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-clay p-4 transition-shadow duration-300",
                applied ? "bg-clay-mint/45 shadow-clay-inset" : "bg-clay-raised/85 shadow-clay-sm",
              ].join(" ")}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-clay-ink shadow-clay-xs"
                style={{ backgroundColor: TONES[action.tone].hex }}
              >
                <BudgetIcon icon={action.icon} size={16} />
              </span>

              <div className="min-w-[180px] flex-1">
                <h4 className="font-display text-[14.5px] font-bold leading-snug text-clay-ink">
                  {action.title}
                </h4>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-body text-[11.5px] text-clay-ink-soft">
                  <span className="text-clay-muted line-through">{action.currentChoice}</span>
                  <ArrowRightIcon size={12} />
                  <span className="font-semibold text-clay-ink">{action.suggestedChange}</span>
                </p>
              </div>

              <div className="text-right">
                <p className="font-body text-[9px] font-extrabold uppercase tracking-[0.12em] text-clay-muted">
                  {isIncrease ? "Extra cover" : "Saves"}
                </p>
                <p className={`font-title text-base leading-none ${isIncrease ? "text-clay-ocean" : "text-clay-jade"}`}>
                  {formatInr(Math.abs(action.expectedSavings))}
                </p>
              </div>

              <ClayButton
                size="sm"
                tone={applied ? "mint" : "butter"}
                onClick={() => onApply(action)}
                disabled={applied}
                leftIcon={applied ? <CheckIcon size={14} /> : undefined}
                className="min-w-[88px]"
              >
                {applied ? "Applied" : "Apply"}
              </ClayButton>
            </motion.article>
          );
        })}
      </motion.div>
    </ClayCard>
  );
}
