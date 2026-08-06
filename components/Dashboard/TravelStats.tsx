"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  CameraIcon,
  FlameIcon,
  GlobeIcon,
  SuitcaseIcon,
  TrendIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  floatY,
  revealViewport,
  springSoft,
  stagger,
} from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import { relativeDay } from "@/lib/dates";
import { buildHistory, type TravelHistory } from "@/lib/history";
import { useAppState } from "@/lib/store";
import { useMemo } from "react";
import Link from "next/link";
import { ClayButton } from "@/components/ui/ClayButton";
import type { ClayTone, TravelStat } from "@/types/dashboard";

const ICONS = {
  globe: GlobeIcon,
  suitcase: SuitcaseIcon,
  flame: FlameIcon,
  camera: CameraIcon,
};

/**
 * The travel shelf: what the user has actually done.
 *
 * Every tile is counted from their own completed trips. There is no baseline,
 * no "typical traveller" filler and no number that survives having zero trips
 * — an empty shelf renders as an empty shelf.
 */
export function TravelStats() {
  const { trips } = useAppState();
  const history = useMemo(() => buildHistory(trips), [trips]);
  const stats = useMemo(() => shelfStats(history), [history]);

  if (history.isEmpty) return <EmptyShelf hasTrips={trips.length > 0} />;

  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp} className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Your travel shelf
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">
            Counted from your {history.completed.length} completed{" "}
            {history.completed.length === 1 ? "trip" : "trips"}
          </p>
        </div>
        {history.tripsThisYear > 0 && (
          <span className="hidden items-center gap-1.5 rounded-full bg-clay-mint px-3.5 py-2 font-body text-xs font-bold shadow-clay-xs sm:flex">
            <TrendIcon size={15} />
            {history.tripsThisYear} in the last year
          </span>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatTile key={stat.id} stat={stat} index={index} />
        ))}
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Four tiles, each one a straight count. Captions name their own source so
 * the number can be checked rather than believed — "3 countries · 5 trips"
 * beats "up 18% this year".
 */
function shelfStats(history: TravelHistory): TravelStat[] {
  const tone = (value: ClayTone) => value;

  return [
    {
      id: "countries",
      label: history.countries.length === 1 ? "Country visited" : "Countries visited",
      value: history.countries.length,
      caption: history.countries.slice(0, 3).join(", ") || "None logged yet",
      tone: tone("sky"),
      icon: "globe",
    },
    {
      id: "trips",
      label: "Trips completed",
      value: history.completed.length,
      caption: history.averageNights
        ? `Averaging ${history.averageNights} nights each`
        : "Add dates to see trip lengths",
      tone: tone("peach"),
      icon: "suitcase",
    },
    {
      id: "nights",
      label: "Nights away",
      value: history.totalNights,
      caption: history.latest
        ? `Last trip ${relativeDay(history.latest.startDate) || "logged"}`
        : "No dated trips yet",
      tone: tone("butter"),
      icon: "flame",
    },
    {
      id: "spend",
      label: "Logged spend",
      value: history.totalSpend,
      caption: history.totalSpend
        ? `Across ${history.completed.length} ${
            history.completed.length === 1 ? "trip" : "trips"
          }`
        : "No expenses recorded",
      tone: tone("lilac"),
      icon: "camera",
      prefix: "₹",
    },
  ];
}

/** Nothing travelled yet — say so, and point at the thing that fixes it. */
function EmptyShelf({ hasTrips }: { hasTrips: boolean }) {
  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp} className="mb-4 px-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Your travel shelf
        </h2>
        <p className="mt-1 font-body text-sm text-clay-ink-soft">
          Fills up as you finish trips
        </p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="xl" depth="md" className="p-8 text-center">
          <motion.span
            {...floatY(7, 5)}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-clay-sm bg-clay-sky text-clay-ink shadow-clay-sm"
          >
            <GlobeIcon size={30} />
          </motion.span>
          <p className="font-display text-lg font-semibold">
            {hasTrips ? "Nothing completed yet" : "No trips logged yet"}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm font-body text-sm leading-relaxed text-clay-ink-soft">
            {hasTrips
              ? "Countries, nights and spend appear here once a trip's end date passes — or when you mark it completed."
              : "Plan a trip, or add one you have already taken, and this shelf starts counting."}
          </p>
          <Link href={hasTrips ? "/trips" : "/plan"} className="mt-5 inline-block">
            <ClayButton size="sm" tone="mint">
              {hasTrips ? "Open my trips" : "Plan a trip"}
            </ClayButton>
          </Link>
        </ClayCard>
      </motion.div>
    </motion.section>
  );
}

function StatTile({ stat, index }: { stat: TravelStat; index: number }) {
  const { play } = useFeedback();
  const Icon = ICONS[stat.icon];

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="surface"
        radius="lg"
        depth="md"
        interactive
        subtle
        onHoverStart={() => play("pop")}
        className="h-full p-4 sm:p-5"
      >
        <motion.span
          {...floatY(5, 4 + index * 0.4, index * 0.25)}
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-clay-sm ${TONES[stat.tone].bg} text-clay-ink shadow-clay-sm`}
        >
          <Icon size={22} />
        </motion.span>

        <p className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-4xl">
          {stat.prefix && (
            <span className="text-2xl font-medium text-clay-ink-soft">
              {stat.prefix}
            </span>
          )}
          <CountUp value={stat.value} />
          {stat.suffix && (
            <span className="text-lg font-medium text-clay-ink-soft">
              {stat.suffix}
            </span>
          )}
        </p>

        <p className="mt-2 font-display text-sm font-semibold leading-tight">
          {stat.label}
        </p>
        <p className="mt-0.5 font-body text-[11px] text-clay-muted">
          {stat.caption}
        </p>
      </ClayCard>
    </motion.div>
  );
}

/** Number that rolls up the first time it scrolls into view. */
function CountUp({ value, duration = 1.6 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const count = useMotionValue(0);
  const text = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("en-IN"),
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, value, duration, count]);

  return (
    <motion.span ref={ref} transition={springSoft}>
      {text}
    </motion.span>
  );
}
