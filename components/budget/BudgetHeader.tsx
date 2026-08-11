"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Destination } from "@/types/dashboard";
import { DESTINATIONS } from "@/lib/data";
import { ClayChip } from "@/components/ui/ClayButton";
import { ClayWell } from "@/components/ui/ClayCard";
import { PinIcon } from "@/components/ui/Icons";
import { fadeUp, stagger } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";

export interface BudgetHeaderProps {
  currentDestination: Destination;
  onSelectDestination: (destination: Destination) => void;
  className?: string;
}

/**
 * Formats location string cleanly to prevent duplicate names like "Japan, Japan".
 */
export function formatLocationName(name: string, country: string): string {
  if (!name) return country || "";
  if (!country || name.trim().toLowerCase() === country.trim().toLowerCase()) {
    return name;
  }
  return `${name}, ${country}`;
}

export function BudgetHeader({
  currentDestination,
  onSelectDestination,
  className = "",
}: BudgetHeaderProps) {
  const { play } = useFeedback();

  const formattedDestinationName = formatLocationName(
    currentDestination.name,
    currentDestination.country
  );

  return (
    <motion.div
      variants={stagger(0.05)}
      initial="hidden"
      animate="show"
      className={`space-y-4 ${className}`}
    >
      {/* Active Destination Card Banner */}
      <motion.div variants={fadeUp}>
        <ClayWell radius="lg" className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-clay-surface border border-clay-sky text-clay-tangerine shadow-clay-xs">
              <PinIcon size={22} />
            </div>
            <div>
              <span className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
                Current Planning Destination
              </span>
              <h2 className="font-display text-xl font-bold text-clay-ink leading-tight">
                {formattedDestinationName}
              </h2>
              <p className="font-body text-xs text-clay-ink-soft">
                {currentDestination.tagline} · {currentDestination.days} Days Trip
              </p>
            </div>
          </div>

          {/* Quick Destination Switcher Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-clay-muted/15">
            <span className="font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted mr-1">
              Switch Destination:
            </span>
            {DESTINATIONS.map((dest) => (
              <ClayChip
                key={dest.id}
                tone={dest.tone}
                active={currentDestination.id === dest.id}
                onClick={() => {
                  onSelectDestination(dest);
                  play("tap");
                }}
              >
                <span className="font-bold text-xs">{dest.name}</span>
              </ClayChip>
            ))}
          </div>
        </ClayWell>
      </motion.div>
    </motion.div>
  );
}
