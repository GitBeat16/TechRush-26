"use client";

import React from "react";
import type { Destination } from "@/types/dashboard";
import type { TravelStyleKey } from "@/types/budget";
import { DESTINATIONS } from "@/lib/data";
import { TRAVEL_STYLE_OPTIONS } from "@/lib/budget/budgetDefaults";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayDropdown, type ClayOption } from "./ClaySelect";
import { ClayTravelStyleCard } from "./ClayTravelStyleCard";
import { CalendarIcon, PinIcon, SparkIcon, SuitcaseIcon, UserIcon, UsersIcon } from "@/components/ui/Icons";

export interface TripDetailsProps {
  destination: Destination | null;
  days: number;
  travelers: number;
  travelStyle: TravelStyleKey;
  onDestinationChange: (destId: string) => void;
  onDaysChange: (days: number) => void;
  onTravelersChange: (travelers: number) => void;
  onTravelStyleChange: (style: TravelStyleKey) => void;
  className?: string;
}

const DESTINATION_CLAY_OPTIONS: ClayOption<string>[] = DESTINATIONS.map((d) => {
  const isDuplicate = !d.country || d.name.trim().toLowerCase() === d.country.trim().toLowerCase();
  const label = isDuplicate ? d.name : `${d.name}, ${d.country}`;
  return {
    value: d.id,
    label,
    icon: <PinIcon size={14} className="text-clay-tangerine" />,
  };
});

const DURATION_CLAY_OPTIONS: ClayOption<number>[] = [
  { value: 1, label: "1 Day", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 2, label: "2 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 3, label: "3 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 5, label: "5 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 7, label: "7 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 10, label: "10 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
  { value: 14, label: "14 Days", icon: <CalendarIcon size={14} className="text-clay-sky" /> },
];

const TRAVELLER_CLAY_OPTIONS: ClayOption<number>[] = [
  { value: 1, label: "1 Traveller", icon: <UserIcon size={14} className="text-clay-mint" /> },
  { value: 2, label: "2 Travellers", icon: <UsersIcon size={14} className="text-clay-mint" /> },
  { value: 3, label: "3 Travellers", icon: <UsersIcon size={14} className="text-clay-mint" /> },
  { value: 4, label: "4 Travellers", icon: <UsersIcon size={14} className="text-clay-mint" /> },
  { value: 5, label: "5 Travellers", icon: <UsersIcon size={14} className="text-clay-mint" /> },
  { value: 6, label: "6+ Travellers", icon: <UsersIcon size={14} className="text-clay-mint" /> },
];

export function TripDetails({
  destination,
  days,
  travelers,
  travelStyle,
  onDestinationChange,
  onDaysChange,
  onTravelersChange,
  onTravelStyleChange,
  className = "",
}: TripDetailsProps) {
  return (
    <ClayCard
      tone="surface"
      radius="xl"
      depth="lg"
      className={`p-3 sm:p-4 space-y-2.5 border-4 border-white/80 ${className}`}
    >
      {/* Sleek Compact Header */}
      <div className="flex items-center justify-between border-b border-clay-muted/15 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-butter shadow-clay-xs text-clay-ink">
            <SuitcaseIcon size={14} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-clay-ink leading-tight">
              Trip Details
            </h3>
            <p className="font-body text-[10px] text-clay-ink-soft">
              Configure parameters to estimate trip costs
            </p>
          </div>
        </div>
      </div>

      {/* Compact Equal-Spaced Centered Controls */}
      <div className="space-y-2.5">
        {/* Step 1: Centered Destination Selector */}
        <div className="space-y-0.5 max-w-md mx-auto text-center">
          <label className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted inline-flex items-center gap-1">
            <PinIcon size={11} className="text-clay-tangerine" />
            DESTINATION
          </label>
          <div>
            <ClayDropdown
              options={DESTINATION_CLAY_OPTIONS}
              value={destination?.id || ""}
              onChange={onDestinationChange}
              placeholder="Select Destination"
            />
          </div>
          {destination && (
            <p className="font-body text-[10px] font-semibold text-clay-ink-soft pt-0.5">
              {destination.tagline} · {destination.days} Days Base Package
            </p>
          )}
        </div>

        {/* Step 2: Centered Duration Selector */}
        <div className="space-y-0.5 max-w-md mx-auto text-center">
          <label className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted inline-flex items-center gap-1">
            <CalendarIcon size={11} className="text-clay-sky" />
            DURATION
          </label>
          <div>
            <ClayDropdown
              options={DURATION_CLAY_OPTIONS}
              value={days}
              onChange={onDaysChange}
              placeholder="Select Duration"
            />
          </div>
        </div>

        {/* Step 3: Centered Travellers Selector */}
        <div className="space-y-0.5 max-w-md mx-auto text-center">
          <label className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted inline-flex items-center gap-1">
            <UserIcon size={11} className="text-clay-mint" />
            TRAVELLERS
          </label>
          <div>
            <ClayDropdown
              options={TRAVELLER_CLAY_OPTIONS}
              value={travelers}
              onChange={onTravelersChange}
              placeholder="Select Travellers"
            />
          </div>
        </div>

        {/* Step 4: Compact Travel Style Section */}
        <div className="space-y-1.5 pt-1.5 border-t border-clay-muted/15">
          <div className="text-center">
            <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted inline-flex items-center gap-1">
              <SparkIcon size={11} className="text-clay-tangerine" />
              TRAVEL STYLE
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {TRAVEL_STYLE_OPTIONS.map((opt) => (
              <ClayTravelStyleCard
                key={opt.id}
                option={opt}
                selected={travelStyle === opt.id}
                onSelect={onTravelStyleChange}
              />
            ))}
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
