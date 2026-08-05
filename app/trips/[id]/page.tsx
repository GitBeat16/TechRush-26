"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ItineraryBuilder } from "@/components/trip/ItineraryBuilder";
import { BudgetTracker } from "@/components/trip/BudgetTracker";
import { PackingChecklist } from "@/components/Dashboard/PackingChecklist";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import {
  CalendarIcon,
  CheckIcon,
  ReceiptIcon,
  SparkIcon,
  SuitcaseIcon,
  TrashIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSnappy, springSoft, stagger } from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import {
  actions,
  packedRatio,
  tripPlannedCost,
  tripProgress,
  tripSpend,
  useTrip,
} from "@/lib/store";
import { formatInr } from "@/lib/data";
import type { Trip } from "@/types/dashboard";

type Tab = "overview" | "itinerary" | "packing" | "budget";

const TABS: { id: Tab; label: string; icon: typeof SparkIcon }[] = [
  { id: "overview", label: "Overview", icon: SparkIcon },
  { id: "itinerary", label: "Itinerary", icon: CalendarIcon },
  { id: "packing", label: "Packing", icon: SuitcaseIcon },
  { id: "budget", label: "Budget", icon: WalletIcon },
];

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const trip = useTrip(params?.id);
  const { play } = useFeedback();
  const [tab, setTab] = useState<Tab>("overview");

  if (!trip) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Trip not found"
          subtitle="It may have been removed, or the link is out of date."
          backHref="/trips"
          backLabel="All trips"
        />
        <Link href="/trips">
          <ClayButton tone="mint">Back to my trips</ClayButton>
        </Link>
      </div>
    );
  }

  const scene = SCENE_BY_ID[trip.destinationId] ?? "coast";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${trip.status} · ${trip.country}`}
        title={trip.title}
        subtitle={trip.summary}
        backHref="/trips"
        backLabel="All trips"
      />

      {/* ------------------------------------------------ hero strip */}
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <ClayCard tone={trip.tone} radius="xl" depth="lg" className="overflow-hidden p-3">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center">
              <div className="h-36 overflow-hidden rounded-clay shadow-clay-inset-sm sm:h-40">
                <ClayScene kind={scene} base={TONES[trip.tone].hex} className="h-full w-full" />
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-2 sm:grid-cols-4">
                <Stat label="Dates" value={trip.startDate.slice(0, 6)} sub={trip.endDate.slice(0, 6) || "to set"} icon={<CalendarIcon size={16} />} />
                <Stat label="Ready" value={`${tripProgress(trip)}%`} sub={`${Math.round(packedRatio(trip) * 100)}% packed`} icon={<CheckIcon size={16} />} />
                <Stat label="Spent" value={formatInr(tripSpend(trip))} sub={`of ${formatInr(trip.budget)}`} icon={<ReceiptIcon size={16} />} />
                <Stat label="Planned" value={formatInr(tripPlannedCost(trip))} sub={`${trip.itinerary.length} days`} icon={<WalletIcon size={16} />} />
              </div>
            </div>
          </ClayCard>
        </motion.div>

        {/* ------------------------------------------------ tabs */}
        <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
          {TABS.map((option) => {
            const Icon = option.icon;
            const active = tab === option.id;
            return (
              <motion.button
                key={option.id}
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                transition={springSnappy}
                onClick={() => {
                  setTab(option.id);
                  play("nav");
                }}
                aria-current={active ? "page" : undefined}
                className="relative flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-sm font-semibold"
              >
                {active && (
                  <motion.span
                    layoutId="trip-tab"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-clay-butter shadow-clay-sm"
                  />
                )}
                <span className={`relative ${active ? "text-clay-ink" : "text-clay-ink-soft"}`}>
                  <Icon size={16} />
                </span>
                <span className={`relative ${active ? "text-clay-ink" : "text-clay-ink-soft"}`}>
                  {option.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ------------------------------------------------ panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={springSoft}
        >
          {tab === "overview" && <Overview trip={trip} onJump={setTab} />}
          {tab === "itinerary" && <ItineraryBuilder trip={trip} />}
          {tab === "packing" && <PackingChecklist trip={trip} />}
          {tab === "budget" && <BudgetTracker trip={trip} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------- overview ------------------------------- */

function Overview({ trip, onJump }: { trip: Trip; onJump: (tab: Tab) => void }) {
  const { play } = useFeedback();
  const activities = trip.itinerary.reduce((total, day) => total + day.items.length, 0);
  const packed = trip.packing.filter((item) => item.packed).length;

  return (
    <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="grid gap-4 lg:grid-cols-3">
      <motion.div variants={fadeUp} className="lg:col-span-2">
        <ClayCard tone="surface" radius="lg" depth="sm" className="h-full p-5">
          <h3 className="font-display text-lg font-semibold">Milestones</h3>
          <p className="mt-0.5 font-body text-xs text-clay-muted">
            Tap to mark done — this feeds the readiness number above
          </p>

          <div className="mt-4 space-y-2">
            {trip.milestones.map((milestone) => (
              <motion.button
                key={milestone.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
                onClick={() => {
                  play(milestone.done ? "toggleOff" : "toggleOn");
                  actions.toggleMilestone(trip.id, milestone.id);
                }}
                aria-pressed={milestone.done}
                className={`flex w-full items-center gap-3 rounded-clay-sm p-3 text-left transition-colors ${
                  milestone.done ? "bg-clay-sunken/70 shadow-clay-inset-sm" : "bg-clay-raised shadow-clay-xs"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                    milestone.done
                      ? "bg-clay-jade text-white shadow-clay-xs"
                      : "bg-clay-sunken text-transparent shadow-clay-inset-sm"
                  }`}
                >
                  <CheckIcon size={14} />
                </span>
                <span
                  className={`font-display text-sm font-semibold ${
                    milestone.done ? "text-clay-muted line-through" : "text-clay-ink"
                  }`}
                >
                  {milestone.label}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-clay-muted/15 pt-4">
            <span className="flex items-center gap-1.5 font-body text-xs text-clay-ink-soft">
              <UsersIcon size={15} />
              Travelling with
            </span>
            <div className="flex items-center">
              {trip.travelers.map((traveler, index) => (
                <span
                  key={traveler.id}
                  style={{ marginLeft: index === 0 ? 0 : -10 }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${TONES[traveler.tone].bg} font-display text-[11px] font-bold shadow-clay-xs ring-4 ring-clay-surface`}
                  title={traveler.name}
                >
                  {traveler.initials}
                </span>
              ))}
            </div>

            <ClayButton
              size="sm"
              tone="surface"
              className="ml-auto"
              leftIcon={<TrashIcon size={14} />}
              onClick={() => actions.removeTrip(trip.id)}
            >
              Delete trip
            </ClayButton>
          </div>
        </ClayCard>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        <JumpCard
          tone="sky"
          title="Itinerary"
          value={`${activities} activities`}
          hint={`across ${trip.itinerary.length} days`}
          onClick={() => onJump("itinerary")}
        />
        <JumpCard
          tone="mint"
          title="Packing"
          value={`${packed} / ${trip.packing.length}`}
          hint="items in the bag"
          onClick={() => onJump("packing")}
        />
        <JumpCard
          tone="peach"
          title="Budget"
          value={formatInr(tripSpend(trip))}
          hint={`of ${formatInr(trip.budget)}`}
          onClick={() => onJump("budget")}
        />
      </motion.div>
    </motion.div>
  );
}

function JumpCard({
  tone,
  title,
  value,
  hint,
  onClick,
}: {
  tone: "sky" | "mint" | "peach";
  title: string;
  value: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <ClayCard
      tone={tone}
      radius="lg"
      depth="sm"
      interactive
      subtle
      onClick={onClick}
      className="cursor-pointer p-4"
    >
      <p className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-ink-soft">
        {title}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold leading-tight">{value}</p>
      <p className="font-body text-xs text-clay-ink-soft">{hint}</p>
    </ClayCard>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-clay-sm bg-clay-raised/90 p-3 shadow-clay-xs">
      <span className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-clay-sunken text-clay-ink-soft shadow-clay-inset-sm">
        {icon}
      </span>
      <p className="font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
        {label}
      </p>
      <p className="font-display text-sm font-semibold leading-tight">{value}</p>
      <p className="truncate font-body text-[10px] text-clay-muted">{sub}</p>
    </div>
  );
}
