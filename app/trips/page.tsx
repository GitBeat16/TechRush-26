"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import {
  ArrowRightIcon,
  CalendarIcon,
  PlusIcon,
  SparkIcon,
  SuitcaseIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSoft, stagger } from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { feedback } from "@/lib/feedback";
import { packedRatio, tripProgress, tripSpend, useAppState } from "@/lib/store";
import { formatInr } from "@/lib/data";
import type { Trip, TripStatus } from "@/types/dashboard";

const FILTERS: { id: TripStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "planning", label: "Planning" },
  { id: "completed", label: "Completed" },
];

export default function TripsPage() {
  const { trips } = useAppState();
  const [filter, setFilter] = useState<TripStatus | "all">("all");

  const visible = filter === "all" ? trips : trips.filter((trip) => trip.status === filter);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Your journeys"
        title="My Trips"
        subtitle="Every trip carries its own itinerary, packing list and budget. Open one to build it out."
        icon={<SuitcaseIcon size={24} />}
        action={
          <Link href="/plan" onClick={() => feedback("nav")}>
            <ClayButton variant="primary" leftIcon={<SparkIcon size={17} />} sound={null}>
              Plan a new trip
            </ClayButton>
          </Link>
        }
      />

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <ClayChip
              key={option.id}
              tone="peach"
              active={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
              <span className="ml-1.5 opacity-60">
                {option.id === "all"
                  ? trips.length
                  : trips.filter((trip) => trip.status === option.id).length}
              </span>
            </ClayChip>
          ))}
        </motion.div>

        {visible.length === 0 ? (
          <motion.div variants={fadeUp}>
            <ClayCard tone="surface" radius="lg" depth="sm" className="p-10 text-center">
              <p className="font-display text-lg font-semibold">Nothing here yet</p>
              <p className="mt-1 font-body text-sm text-clay-ink-soft">
                Generate a plan and save it, and it will appear in this list.
              </p>
              <Link href="/plan" className="mt-4 inline-block">
                <ClayButton size="sm" tone="mint" leftIcon={<PlusIcon size={15} />}>
                  Plan a trip
                </ClayButton>
              </Link>
            </ClayCard>
          </motion.div>
        ) : (
          <motion.div layout transition={springSoft} className="grid gap-4 lg:grid-cols-2">
            {visible.map((trip) => (
              <motion.div key={trip.id} variants={fadeUp} layout>
                <TripRow trip={trip} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function TripRow({ trip }: { trip: Trip }) {
  const scene = SCENE_BY_ID[trip.destinationId] ?? "coast";
  const progress = tripProgress(trip);
  const spent = tripSpend(trip);
  const activities = trip.itinerary.reduce((total, day) => total + day.items.length, 0);

  return (
    <Link href={`/trips/${trip.id}`} onClick={() => feedback("nav")} className="block h-full">
      <ClayCard tone="surface" radius="lg" depth="md" interactive className="h-full overflow-hidden p-3">
        <div className="flex gap-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-clay shadow-clay-inset-sm sm:h-32 sm:w-32">
            <ClayScene kind={scene} base={TONES[trip.tone].hex} className="h-full w-full" />
            <span className="absolute bottom-2 left-2 rounded-full bg-clay-surface/95 px-2 py-0.5 font-body text-[10px] font-extrabold uppercase tracking-wide shadow-clay-xs">
              {trip.status}
            </span>
          </div>

          <div className="min-w-0 flex-1 py-1 pr-1">
            <h3 className="truncate font-display text-xl font-semibold leading-tight">
              {trip.title}
            </h3>
            <p className="mt-0.5 line-clamp-2 font-body text-xs leading-relaxed text-clay-ink-soft">
              {trip.summary}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Pill icon={<CalendarIcon size={12} />}>{trip.days} days</Pill>
              <Pill icon={<UsersIcon size={12} />}>{trip.travelers.length}</Pill>
              <Pill icon={<WalletIcon size={12} />}>{formatInr(trip.budget)}</Pill>
              <Pill icon={<SparkIcon size={12} />}>{activities} activities</Pill>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset-sm">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ...springSoft, delay: 0.2 }}
                  className="block h-full rounded-full bg-clay-tangerine"
                />
              </span>
              <span className="shrink-0 font-body text-[11px] font-bold text-clay-muted">
                {progress}% ready
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-body text-[11px] text-clay-muted">
                {formatInr(spent)} spent · {Math.round(packedRatio(trip) * 100)}% packed
              </span>
              <span className="flex items-center gap-1 font-body text-[11px] font-bold text-clay-ink-soft">
                Open
                <ArrowRightIcon size={13} />
              </span>
            </div>
          </div>
        </div>
      </ClayCard>
    </Link>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-clay-sunken px-2 py-0.5 font-body text-[10px] font-bold text-clay-ink-soft shadow-clay-inset-sm">
      {icon}
      {children}
    </span>
  );
}
