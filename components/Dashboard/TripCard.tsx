"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClaySuitcase } from "@/components/ui/ClayIllustrations";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  SunIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  floatY,
  revealViewport,
  springSoft,
  stagger,
} from "@/lib/animations";
import { TONES } from "@/lib/tones";
import {
  actions,
  isTravelled,
  packedRatio,
  tripProgress,
  tripSpend,
} from "@/lib/store";
import {
  formatDateShort,
  formatRange,
  isIsoDate,
  isWithin,
  relativeDay,
  todayIso,
  tripLength,
} from "@/lib/dates";
import { formatInr } from "@/lib/data";
import { useFeedback } from "@/lib/feedback";
import type { ClayTone, Trip } from "@/types/dashboard";

export function TripCard({ trip }: { trip: Trip }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const { play } = useFeedback();

  const progress = tripProgress(trip);
  const spent = tripSpend(trip);

  // What the badge says has to match reality, not the stored status — a trip
  // whose dates have passed is over whether or not anyone updated it.
  const today = todayIso();
  const happeningNow = isWithin(today, trip.startDate, trip.endDate);
  const finished = isTravelled(trip, today);
  const countdown = isIsoDate(trip.startDate) ? relativeDay(trip.startDate) : "";

  const phase = happeningNow
    ? "Happening now"
    : finished
      ? "Completed"
      : countdown
        ? `Leaves ${countdown}`
        : "Dates not set";

  const nights = isIsoDate(trip.startDate) && isIsoDate(trip.endDate)
    ? tripLength(trip.startDate, trip.endDate) - 1
    : Math.max(0, trip.days - 1);

  return (
    <motion.div
      ref={ref}
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <ClayCard tone="surface" radius="xl" depth="lg" className="overflow-hidden p-5 sm:p-7 lg:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-clay-jade/25 px-3 py-1.5 font-body text-[11px] font-extrabold uppercase tracking-wider">
                {phase}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-clay-sunken px-3 py-1.5 font-body text-[11px] font-bold text-clay-ink-soft shadow-clay-inset-sm">
                <SunIcon size={13} />
                {trip.country}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {trip.title}
            </motion.h2>

            <motion.p variants={fadeUp} className="mt-1.5 max-w-lg font-body text-sm text-clay-ink-soft">
              {trip.summary}
            </motion.p>

            <motion.div variants={stagger(0.06, 0.1)} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact
                icon={<CalendarIcon size={18} />}
                label="Dates"
                value={formatDateShort(trip.startDate, "Not set")}
                sub={
                  isIsoDate(trip.startDate)
                    ? formatRange(trip.startDate, trip.endDate)
                    : "Pick dates in the calendar"
                }
                tone="sky"
              />
              <Fact
                icon={<SunIcon size={18} />}
                label="Duration"
                value={`${trip.days} days`}
                sub={`${nights} ${nights === 1 ? "night" : "nights"}`}
                tone="butter"
              />
              <Fact
                icon={<UsersIcon size={18} />}
                label="Travelers"
                value={`${trip.travelers.length}`}
                sub={trip.travelers.map((t) => t.name.split(" ")[0]).join(", ")}
                tone="mint"
              />
              <Fact
                icon={<WalletIcon size={18} />}
                label="Budget"
                value={formatInr(trip.budget)}
                sub={`${formatInr(spent)} spent`}
                tone="blush"
              />
            </motion.div>

            <motion.div variants={fadeUp} className="mt-7">
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <p className="font-display text-sm font-semibold">
                  Trip preparation{" "}
                  <span className="text-clay-muted">{progress}% complete</span>
                </p>
                <p className="font-body text-xs text-clay-muted">
                  {Math.round(packedRatio(trip) * 100)}% packed
                </p>
              </div>

              <div className="h-5 w-full overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${progress}%` } : { width: 0 }}
                  transition={{ ...springSoft, delay: 0.3 }}
                  className="relative h-full rounded-full bg-clay-tangerine shadow-clay-xs"
                >
                  <motion.span
                    animate={{ opacity: [0.35, 0.8, 0.35] }}
                    transition={{ type: "tween", duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-y-1 right-1 w-8 rounded-full bg-white/60"
                  />
                </motion.div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {trip.milestones.map((milestone) => (
                  <motion.button
                    key={milestone.id}
                    variants={fadeUp}
                    whileHover={{ y: -2, scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      play(milestone.done ? "toggleOff" : "toggleOn");
                      actions.toggleMilestone(trip.id, milestone.id);
                    }}
                    aria-pressed={milestone.done}
                    className={[
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-semibold transition-all",
                      milestone.done
                        ? "bg-clay-mint text-clay-ink shadow-clay-xs"
                        : "bg-clay-sunken text-clay-muted shadow-clay-inset-sm",
                    ].join(" ")}
                  >
                    {milestone.done && <CheckIcon size={12} />}
                    {milestone.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-4">
              <Link href={`/trips/${trip.id}`} onClick={() => play("nav")}>
                <ClayButton variant="primary" rightIcon={<ArrowRightIcon size={18} />} sound={null}>
                  Open trip
                </ClayButton>
              </Link>

              <div className="flex items-center">
                {trip.travelers.map((traveler, index) => (
                  <motion.span
                    key={traveler.id}
                    whileHover={{ y: -6, scale: 1.1, zIndex: 10 }}
                    transition={springSoft}
                    style={{ marginLeft: index === 0 ? 0 : -12 }}
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${TONES[traveler.tone].bg} font-display text-xs font-bold shadow-clay-sm ring-4 ring-clay-surface`}
                    title={traveler.name}
                  >
                    {traveler.initials}
                  </motion.span>
                ))}
                <span className="ml-2 font-body text-xs text-clay-muted">travelling together</span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative mx-auto flex items-center justify-center lg:mx-0">
            <div className="absolute h-48 w-48 rounded-full bg-clay-peach/60 blur-xl sm:h-56 sm:w-56" />
            <motion.div
              {...floatY(11, 5)}
              whileHover={{ rotate: -6, scale: 1.05, transition: springSoft }}
              className="relative"
            >
              <ClaySuitcase size={230} fill={packedRatio(trip)} />
            </motion.div>
            <span className="absolute -bottom-1 rounded-full bg-clay-surface px-4 py-1.5 font-body text-xs font-bold text-clay-ink-soft shadow-clay-sm">
              {Math.round(packedRatio(trip) * 100)}% packed
            </span>
          </motion.div>
        </div>
      </ClayCard>
    </motion.div>
  );
}

function Fact({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: ClayTone;
}) {
  return (
    <motion.div variants={fadeUp}>
      <ClayCard tone="surface" radius="sm" depth="sm" interactive subtle className="h-full p-3.5">
        <span className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-full ${TONES[tone].bg} shadow-clay-xs`}>
          {icon}
        </span>
        <p className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
          {label}
        </p>
        <p className="font-display text-base font-semibold leading-tight">{value}</p>
        <p className="truncate font-body text-[11px] text-clay-muted">{sub}</p>
      </ClayCard>
    </motion.div>
  );
}
