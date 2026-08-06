"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Destination } from "@/types/dashboard";
import type { TravelStyleKey } from "@/types/budget";
import { TRAVEL_STYLE_OPTIONS } from "@/lib/budget/budgetDefaults";
import { formatLocationName } from "./BudgetHeader";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { CalendarIcon, CheckIcon, PinIcon, SuitcaseIcon, UserIcon } from "@/components/ui/Icons";
import { springSnappy } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { BudgetIcon } from "./BudgetIcons";

export interface TripDetailsCardProps {
  destination: Destination;
  days: number;
  travelers: number;
  travelStyle: TravelStyleKey;
  onDaysChange: (days: number) => void;
  onTravelersChange: (travelers: number) => void;
  onTravelStyleChange: (style: TravelStyleKey) => void;
  className?: string;
}

const DURATION_OPTIONS = [
  { label: "1 Day", value: 1 },
  { label: "2 Days", value: 2 },
  { label: "3 Days", value: 3 },
  { label: "5 Days", value: 5 },
  { label: "7 Days", value: 7 },
  { label: "10 Days", value: 10 },
  { label: "14 Days", value: 14 },
];

const TRAVELLER_OPTIONS = [
  { label: "1 Person", value: 1 },
  { label: "2 People", value: 2 },
  { label: "3 People", value: 3 },
  { label: "4 People", value: 4 },
  { label: "5 People", value: 5 },
  { label: "6+ People", value: 6 },
];

export function TripDetailsCard({
  destination,
  days,
  travelers,
  travelStyle,
  onDaysChange,
  onTravelersChange,
  onTravelStyleChange,
  className = "",
}: TripDetailsCardProps) {
  const { play } = useFeedback();
  const formattedDestination = formatLocationName(destination.name, destination.country);

  return (
    <ClayCard
      tone="surface"
      radius="xl"
      depth="lg"
      className={`p-5 sm:p-6 space-y-5 border-4 border-white/80 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-butter shadow-clay-xs text-clay-ink">
            <SuitcaseIcon size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-clay-ink leading-tight">
              Trip Details
            </h3>
            <p className="font-body text-xs text-clay-ink-soft">
              Customize parameters to generate personalized category estimates
            </p>
          </div>
        </div>
      </div>

      {/* Inputs Grid: Readonly Destination, Duration Dropdown, Travellers Dropdown */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Destination (Read-only Pill) */}
        <ClayWell radius="md" className="p-3.5 flex flex-col justify-between">
          <span className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted flex items-center gap-1">
            <PinIcon size={12} className="text-clay-tangerine" />
            Destination
          </span>
          <div className="mt-1 font-display text-base font-bold text-clay-ink truncate">
            {formattedDestination}
          </div>
          <span className="mt-0.5 font-body text-[10px] text-clay-muted">
            Auto-selected destination
          </span>
        </ClayWell>

        {/* Duration Dropdown */}
        <ClayWell radius="md" className="p-3.5 flex flex-col justify-between">
          <label htmlFor="duration-select" className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted flex items-center gap-1">
            <CalendarIcon size={12} className="text-clay-sky" />
            Trip Duration
          </label>
          <select
            id="duration-select"
            value={days}
            onChange={(e) => {
              onDaysChange(Number(e.target.value));
              play("pop");
            }}
            className="mt-1 w-full bg-clay-surface rounded px-2.5 py-1 font-display text-sm font-bold text-clay-ink outline-none border border-white/80 shadow-clay-xs cursor-pointer hover:bg-clay-peach/20 transition-colors"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="mt-0.5 font-body text-[10px] text-clay-muted">
            Total days planned
          </span>
        </ClayWell>

        {/* Travellers Dropdown */}
        <ClayWell radius="md" className="p-3.5 flex flex-col justify-between">
          <label htmlFor="travelers-select" className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted flex items-center gap-1">
            <UserIcon size={12} className="text-clay-mint" />
            Travellers
          </label>
          <select
            id="travelers-select"
            value={travelers}
            onChange={(e) => {
              onTravelersChange(Number(e.target.value));
              play("pop");
            }}
            className="mt-1 w-full bg-clay-surface rounded px-2.5 py-1 font-display text-sm font-bold text-clay-ink outline-none border border-white/80 shadow-clay-xs cursor-pointer hover:bg-clay-peach/20 transition-colors"
          >
            {TRAVELLER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="mt-0.5 font-body text-[10px] text-clay-muted">
            Group size allocation
          </span>
        </ClayWell>
      </div>

      {/* Travel Style Interactive Clay Cards */}
      <div className="space-y-2 pt-1">
        <span className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted px-0.5">
          Select Travel Style
        </span>

        <div className="grid gap-3 sm:grid-cols-3">
          {TRAVEL_STYLE_OPTIONS.map((opt) => {
            const isSelected = travelStyle === opt.id;
            return (
              <motion.div
                key={opt.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                onClick={() => {
                  onTravelStyleChange(opt.id);
                  play("toggleOn");
                }}
                className={`relative cursor-pointer rounded-clay-lg p-4 transition-all duration-200 border-2 ${
                  isSelected
                    ? "bg-clay-butter shadow-clay-md border-clay-tangerine/60"
                    : "bg-clay-sunken/60 hover:bg-clay-surface shadow-clay-xs border-white/60"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="active-style-badge"
                    transition={springSnappy}
                    className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-clay-tangerine text-white shadow-clay-xs"
                  >
                    <CheckIcon size={12} />
                  </motion.span>
                )}

                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-raised/90 text-clay-ink shadow-clay-xs">
                    <BudgetIcon icon={opt.icon} size={18} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
                      {opt.title}
                    </h4>
                    <p className="font-body text-[10px] font-semibold text-clay-muted">
                      {opt.subtitle}
                    </p>
                  </div>
                </div>

                <ul className="space-y-0.5 pt-1 border-t border-clay-muted/15 font-body text-[11px] text-clay-ink-soft">
                  {opt.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span className="text-clay-tangerine">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ClayCard>
  );
}
