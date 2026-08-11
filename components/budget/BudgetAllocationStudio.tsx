"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { AnimatedNumber } from "./AnimatedNumber";
import { BudgetIcon } from "./BudgetIcons";
import { ChartPieIcon } from "@/components/ui/Icons";
import { TONES } from "@/lib/tones";
import { formatInr } from "@/lib/data";
import { springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import type { AllocationGroupKey, AllocationSlice } from "@/lib/budget/intelligence";

const RADIUS = 78;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const VERDICT_COPY: Record<AllocationSlice["verdict"], string> = {
  lean: "Leaner than most trips of this shape",
  balanced: "Sitting inside the healthy band",
  heavy: "Heavier than the healthy band",
};

const VERDICT_TONE: Record<AllocationSlice["verdict"], string> = {
  lean: "text-clay-ocean",
  balanced: "text-clay-jade",
  heavy: "text-clay-rose",
};

export interface BudgetAllocationStudioProps {
  allocation: AllocationSlice[];
  totalCost: number;
  days: number;
  travelers: number;
}

/**
 * The allocation donut. Reading a budget is a spatial task before it is a
 * numeric one — the ring shows the shape of the trip, and the centre
 * answers whatever the user just clicked.
 */
export function BudgetAllocationStudio({
  allocation,
  totalCost,
  days,
  travelers,
}: BudgetAllocationStudioProps) {
  const [activeId, setActiveId] = useState<AllocationGroupKey | null>(null);

  const segments = useMemo(() => {
    const fractions = allocation.map((slice) =>
      totalCost > 0 ? slice.amount / totalCost : 0
    );
    return allocation.map((slice, index) => {
      const preceding = fractions
        .slice(0, index)
        .reduce((sum, fraction) => sum + fraction, 0);
      return {
        slice,
        length: fractions[index] * CIRCUMFERENCE,
        offset: preceding * CIRCUMFERENCE,
      };
    });
  }, [allocation, totalCost]);

  // Biggest spend first, so the list reads as a ranking of what is driving
  // the total. The donut keeps its own fixed order so the bands stay put.
  const ranked = useMemo(
    () => [...allocation].sort((a, b) => b.amount - a.amount),
    [allocation]
  );

  const active = allocation.find((s) => s.id === activeId) ?? null;
  const centerValue = active ? active.amount : totalCost;
  const centerLabel = active ? active.label : "Total trip cost";
  const centerCaption = active
    ? `${active.percentage}% of the budget`
    : `${allocation.length} categories · ${days} days`;

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-6 sm:p-8">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-clay-sm bg-clay-mint text-clay-ink shadow-clay-xs">
          <ChartPieIcon size={17} />
        </span>
        <h3 className="font-title text-lg leading-tight text-clay-ink sm:text-xl">
          Where the money goes
        </h3>
        <span className="ml-auto font-body text-[11px] font-semibold text-clay-muted">
          Tap a band for detail
        </span>
      </header>

      <div className="mt-6 grid items-center gap-7 lg:grid-cols-[minmax(0,300px)_1fr]">
        {/* ------------------------------------------------- the donut */}
        <div className="relative mx-auto w-full max-w-[300px]">
          <motion.svg
            viewBox="0 0 220 220"
            className="w-full"
            initial={{ opacity: 0, scale: 0.88, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={springSoft}
          >
            {/* recessed track */}
            <circle
              cx="110"
              cy="110"
              r={RADIUS}
              fill="none"
              stroke="var(--color-clay-sunken)"
              strokeWidth={STROKE + 6}
            />

            <g transform="rotate(-90 110 110)">
              {segments.map(({ slice, length, offset }) => {
                const isActive = slice.id === activeId;
                const dimmed = activeId !== null && !isActive;
                return (
                  <circle
                    key={slice.id}
                    cx="110"
                    cy="110"
                    r={RADIUS}
                    fill="none"
                    stroke={TONES[slice.tone].accent}
                    strokeWidth={isActive ? STROKE + 10 : STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(0, length - 4)} ${CIRCUMFERENCE - Math.max(0, length - 4)}`}
                    strokeDashoffset={-offset - 2}
                    opacity={dimmed ? 0.32 : 1}
                    onClick={() => {
                      feedback(isActive ? "toggleOff" : "toggleOn");
                      setActiveId(isActive ? null : slice.id);
                    }}
                    className="cursor-pointer"
                    style={{
                      transition:
                        "stroke-dasharray 0.75s var(--ease-clay), stroke-dashoffset 0.75s var(--ease-clay), stroke-width 0.3s ease, opacity 0.3s ease",
                    }}
                  />
                );
              })}
            </g>
          </motion.svg>

          {/* ------------------------------------------- donut centre */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={`${centerLabel}-label`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="font-body text-[10px] font-extrabold uppercase tracking-[0.14em] text-clay-muted"
              >
                {centerLabel}
              </motion.p>
            </AnimatePresence>
            <AnimatedNumber
              value={centerValue}
              prefix="₹"
              className="mt-1 font-title text-2xl leading-none text-clay-ink"
            />
            <AnimatePresence mode="wait">
              <motion.p
                key={`${centerCaption}-caption`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1.5 font-body text-[11px] font-semibold text-clay-ink-soft"
              >
                {centerCaption}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* ------------------------------------------------- the legend */}
        <div className="space-y-2">
          {ranked.map((slice) => {
            const isActive = slice.id === activeId;
            return (
              <motion.button
                key={slice.id}
                type="button"
                layout
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.99 }}
                transition={springSnappy}
                onClick={() => {
                  feedback(isActive ? "toggleOff" : "toggleOn");
                  setActiveId(isActive ? null : slice.id);
                }}
                className={[
                  "w-full rounded-clay-sm px-4 py-3 text-left transition-shadow duration-200",
                  isActive
                    ? "bg-clay-raised shadow-clay-sm"
                    : "bg-clay-surface/60 shadow-clay-inset-sm hover:bg-clay-raised/70",
                ].join(" ")}
                aria-expanded={isActive}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-clay-ink shadow-clay-xs"
                    style={{ backgroundColor: TONES[slice.tone].hex }}
                  >
                    <BudgetIcon icon={slice.icon} size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-display text-sm font-bold text-clay-ink">
                        {slice.label}
                      </p>
                      <p className="shrink-0 font-body text-[12px] font-semibold text-clay-ink">
                        {formatInr(slice.amount)}
                        <span className="ml-1.5 text-clay-muted">{slice.percentage}%</span>
                      </p>
                    </div>

                    {/* The share bar doubles as the spend ranking — the rows
                        are already ordered by amount, so a separate drivers
                        chart was the same data drawn twice. */}
                    <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset-sm">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ backgroundColor: TONES[slice.tone].accent }}
                        initial={{ width: 0 }}
                        animate={{ width: `${slice.percentage}%` }}
                        transition={springSoft}
                      />
                    </span>
                  </div>
                </div>

                {/* ------------------------------ click-to-reveal detail */}
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 space-y-2.5 border-t border-clay-muted/20 pt-3">
                        <p className="font-body text-[11.5px] text-clay-ink-soft">
                          <span className={`font-bold ${VERDICT_TONE[slice.verdict]}`}>
                            {VERDICT_COPY[slice.verdict]}
                          </span>
                          {" · "}
                          {formatInr(slice.perPersonPerDay)}{" "}
                          {travelers === 1 ? "a day" : "per person, per day"}
                        </p>

                        {slice.members.length > 1 && (
                          <div className="space-y-1.5">
                            {slice.members.map((member) => (
                              <div key={member.id} className="flex items-center gap-2">
                                <span className="w-28 shrink-0 truncate font-body text-[11px] text-clay-ink-soft">
                                  {member.category}
                                </span>
                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset-sm">
                                  <motion.span
                                    className="block h-full rounded-full"
                                    style={{ backgroundColor: TONES[slice.tone].accent }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${member.percentage}%` }}
                                    transition={springSoft}
                                  />
                                </span>
                                <span className="w-20 shrink-0 text-right font-body text-[11px] font-semibold text-clay-ink">
                                  {formatInr(member.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </ClayCard>
  );
}
