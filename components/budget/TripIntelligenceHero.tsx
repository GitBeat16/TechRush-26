"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayDropdown, type ClayOption } from "./ClaySelect";
import { AnimatedNumber } from "./AnimatedNumber";
import { BudgetIcon } from "./BudgetIcons";
import {
  AlertTriangleIcon,
  AwardIcon,
  CalendarIcon,
  ChevronDownIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import { DESTINATIONS, formatInr } from "@/lib/data";
import { TRAVEL_STYLE_OPTIONS } from "@/lib/budget/budgetDefaults";
import { springSnappy } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import type { Destination } from "@/types/dashboard";
import type { TravelStyleKey } from "@/types/budget";
import type { FinancialHealth, HealthStatus, PeerComparison } from "@/lib/budget/intelligence";

const DESTINATION_OPTIONS: ClayOption<string>[] = DESTINATIONS.map((d) => {
  const duplicate = !d.country || d.name.trim().toLowerCase() === d.country.trim().toLowerCase();
  return {
    value: d.id,
    label: duplicate ? d.name : `${d.name}, ${d.country}`,
    icon: <PinIcon size={14} className="text-clay-tangerine" />,
  };
});

const DURATION_OPTIONS: ClayOption<number>[] = [1, 2, 3, 5, 7, 10, 14].map((n) => ({
  value: n,
  label: n === 1 ? "1 day" : `${n} days`,
  icon: <CalendarIcon size={14} className="text-clay-ocean" />,
}));

const TRAVELLER_OPTIONS: ClayOption<number>[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: n,
  label: n === 1 ? "Solo" : n === 6 ? "6+ travellers" : `${n} travellers`,
  icon: n === 1 ? <UserIcon size={14} className="text-clay-jade" /> : <UsersIcon size={14} className="text-clay-jade" />,
}));

const HEALTH_LABEL: Record<HealthStatus, string> = {
  excellent: "Looks healthy",
  good: "Mostly solid",
  warning: "Needs attention",
};

const HEALTH_CHIP: Record<HealthStatus, string> = {
  excellent: "bg-clay-mint",
  good: "bg-clay-sky",
  warning: "bg-clay-blush",
};

export interface TripIntelligenceHeroProps {
  destination: Destination;
  days: number;
  travelers: number;
  travelStyle: TravelStyleKey;
  totalCost: number;
  perPersonPerDay: number;
  peer: PeerComparison;
  health: FinancialHealth;
  opportunity: number;
  onDestinationChange: (id: string) => void;
  onDaysChange: (days: number) => void;
  onTravelersChange: (travelers: number) => void;
  onTravelStyleChange: (style: TravelStyleKey) => void;
  onOptimize: () => void;
}

/**
 * The whole answer, above the fold: set up the trip on the right, read the
 * number on the left.
 *
 * Everything here earns its place by answering a question a first-time
 * visitor actually asks — what does this cost, is that normal, is anything
 * wrong. The reasoning behind "is anything wrong" is one tap away rather
 * than always on screen.
 */
export function TripIntelligenceHero({
  destination,
  days,
  travelers,
  travelStyle,
  totalCost,
  perPersonPerDay,
  peer,
  health,
  opportunity,
  onDestinationChange,
  onDaysChange,
  onTravelersChange,
  onTravelStyleChange,
  onOptimize,
}: TripIntelligenceHeroProps) {
  const [showWhy, setShowWhy] = useState(false);
  const styleOption = TRAVEL_STYLE_OPTIONS.find((s) => s.id === travelStyle) ?? TRAVEL_STYLE_OPTIONS[1];

  const HealthIcon =
    health.status === "excellent" ? AwardIcon : health.status === "good" ? ShieldIcon : AlertTriangleIcon;

  const peerTone =
    peer.position === "below" ? "text-clay-jade" : peer.position === "above" ? "text-clay-rose" : "text-clay-ocean";

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="overflow-hidden border-4 border-white/70">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ---------------------------------------------- the answer */}
        <div className="relative p-6 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-clay-peach/45 blur-3xl"
          />

          <div className="relative">
            <p className="font-body text-[11px] font-extrabold uppercase tracking-[0.16em] text-clay-muted">
              {days} days in {destination.name} · {travelers === 1 ? "solo" : `${travelers} travellers`} ·{" "}
              {styleOption.title.toLowerCase()}
            </p>

            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
              <AnimatedNumber
                value={totalCost}
                prefix="₹"
                className="font-title text-5xl leading-none text-clay-ink sm:text-6xl"
              />
              <span className="pb-1.5 font-body text-sm font-semibold text-clay-ink-soft">
                {formatInr(perPersonPerDay)} per person / day
              </span>
            </div>

            {/* one line instead of a gauge and a paragraph */}
            <p className={`mt-2.5 font-display text-sm font-bold ${peerTone}`}>
              {peer.headline}
              <span className="ml-1.5 font-body font-semibold text-clay-muted">
                (avg {formatInr(peer.peerAverage)})
              </span>
            </p>

            {/* ------------------------------- health, as a chip */}
            <div className="mt-5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={springSnappy}
                onClick={() => {
                  feedback(showWhy ? "toggleOff" : "toggleOn");
                  setShowWhy((current) => !current);
                }}
                aria-expanded={showWhy}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-display text-[12.5px] font-bold text-clay-ink shadow-clay-xs ${HEALTH_CHIP[health.status]}`}
              >
                <HealthIcon size={14} />
                {HEALTH_LABEL[health.status]}
                <motion.span
                  animate={{ rotate: showWhy ? 180 : 0 }}
                  transition={springSnappy}
                  className="opacity-60"
                >
                  <ChevronDownIcon size={13} />
                </motion.span>
              </motion.button>

              <AnimatePresence initial={false}>
                {showWhy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 space-y-1.5">
                      {health.factors.map((factor) => (
                        <li key={factor.id} className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              factor.sentiment === "positive"
                                ? "bg-clay-jade"
                                : factor.sentiment === "negative"
                                  ? "bg-clay-rose"
                                  : "bg-clay-muted"
                            }`}
                          />
                          <span className="font-body text-[12.5px] leading-snug text-clay-ink-soft">
                            {factor.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ------------------------------------------------- CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ClayButton
                variant="primary"
                size="md"
                onClick={onOptimize}
                disabled={opportunity <= 0}
                leftIcon={<SparkIcon size={17} />}
              >
                Optimize budget
              </ClayButton>
              {opportunity > 0 && (
                <p className="font-body text-xs font-semibold text-clay-ink-soft">
                  Saves <span className="font-display font-bold text-clay-jade">{formatInr(opportunity)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ the setup */}
        <div className="border-t border-clay-muted/15 bg-clay-sunken/40 p-6 sm:p-7 lg:border-l lg:border-t-0">
          <div className="space-y-3.5">
            <Field label="Destination">
              <ClayDropdown
                options={DESTINATION_OPTIONS}
                value={destination.id}
                onChange={onDestinationChange}
                placeholder="Select destination"
              />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Duration">
                <ClayDropdown options={DURATION_OPTIONS} value={days} onChange={onDaysChange} placeholder="Duration" />
              </Field>
              <Field label="Travellers">
                <ClayDropdown
                  options={TRAVELLER_OPTIONS}
                  value={travelers}
                  onChange={onTravelersChange}
                  placeholder="Travellers"
                />
              </Field>
            </div>

            <Field label="Travel style">
              <div className="grid grid-cols-3 gap-2">
                {TRAVEL_STYLE_OPTIONS.map((option) => {
                  const active = option.id === travelStyle;
                  return (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      transition={springSnappy}
                      onClick={() => {
                        feedback(active ? "tap" : "toggleOn");
                        onTravelStyleChange(option.id);
                      }}
                      className={[
                        "flex flex-col items-center gap-1.5 rounded-clay-sm px-2 py-2.5 text-center transition-shadow duration-200",
                        active
                          ? "bg-clay-peach text-clay-ink shadow-clay-sm"
                          : "bg-clay-surface/70 text-clay-ink-soft shadow-clay-inset-sm hover:text-clay-ink",
                      ].join(" ")}
                      aria-pressed={active}
                    >
                      <BudgetIcon icon={option.icon} size={16} />
                      <span className="font-display text-[11px] font-bold leading-none">{option.title}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-[10px] font-extrabold uppercase tracking-[0.14em] text-clay-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
