"use client";

import React from "react";
import type { ExpenseItem } from "@/types/budget";
import { formatInr } from "@/lib/data";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { useFeedback } from "@/lib/feedback";

export interface ExpenseCardProps {
  item: ExpenseItem;
  onAmountChange: (id: ExpenseItem["id"], newAmount: number) => void;
}

export function ExpenseCard({ item, onAmountChange }: ExpenseCardProps) {
  const { play } = useFeedback();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = Number(e.target.value);
    onAmountChange(item.id, newAmount);
  };

  return (
    <ClayCard
      tone={item.tone}
      radius="lg"
      depth="sm"
      className="p-4 sm:p-5 flex flex-col justify-between space-y-4 border-2 border-white/80"
    >
      {/* Category Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-raised/90 text-2xl shadow-clay-xs">
            {item.icon}
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-clay-ink leading-tight">
              {item.category}
            </h4>
            <p className="font-body text-xs text-clay-ink-soft leading-snug line-clamp-1">
              {item.label}
            </p>
          </div>
        </div>
      </div>

      {/* Styled Typography Amount Display (No default HTML number input) */}
      <ClayWell radius="md" className="p-3 flex items-center justify-between gap-3">
        <span className="font-body text-xs font-bold uppercase tracking-wide text-clay-muted">
          Estimated Cost
        </span>
        <span className="font-display text-lg font-extrabold text-clay-ink tracking-tight">
          {formatInr(item.amount)}
        </span>
      </ClayWell>

      {/* Clay Range Slider for Intuitive Live Adjustments */}
      <div className="space-y-1">
        <div className="flex justify-between font-body text-[10px] font-bold text-clay-muted px-0.5">
          <span>₹0</span>
          <span>{formatInr(item.max)}</span>
        </div>
        <input
          type="range"
          min={item.min}
          max={item.max}
          step={item.step}
          value={Math.min(item.max, item.amount)}
          onChange={handleSliderChange}
          onPointerUp={() => play("tap")}
          className="clay-range"
          aria-label={`${item.category} range slider`}
        />
      </div>
    </ClayCard>
  );
}
