"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCloud, ClayPlane, ClayScene, type SceneKind } from "@/components/ui/ClayIllustrations";
import { RiveCharacter } from "@/components/Dashboard/RiveCharacter";
import {
  ArrowRightIcon,
  PinIcon,
  SparkIcon,
  StarIcon,
} from "@/components/ui/Icons";
import {
  breathe,
  fadeUp,
  floatDrift,
  floatY,
  revealViewport,
  springSoft,
  stagger,
} from "@/lib/animations";
import Link from "next/link";
import { packedRatio, useActiveTrip, useAppState } from "@/lib/store";
import { useSession } from "@/lib/auth/session";
import { formatInr, greetingFor } from "@/lib/data";
import { formatRange, relativeDay } from "@/lib/dates";
import { buildHistory } from "@/lib/history";
import { useTheme } from "@/lib/theme/ThemeProvider";

function DarkHeroMoon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 0.95, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="pointer-events-none absolute right-6 top-6 sm:right-12 sm:top-8 lg:right-16 lg:top-10 z-0 flex items-center justify-center"
    >
      {/* Soft Moonlight Ambient Halo */}
      <div className="absolute h-24 w-24 rounded-full bg-[#F4E8C8]/15 blur-xl" />

      {/* Pure SVG Crescent Moon — Warm Ivory / Soft Cream (#F4E8C8) */}
      <svg
        width="52"
        height="52"
        viewBox="0 0 24 24"
        fill="none"
        className="relative text-[#F4E8C8] drop-shadow-[0_0_12px_rgba(244,232,200,0.4)]"
      >
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          fill="currentColor"
        />
      </svg>
    </motion.div>
  );
}
import { heroLine, topPick } from "@/lib/personalize";
import { SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import { TONES } from "@/lib/tones";
import { useMemo } from "react";

/** Server renders "Good evening"; the client swaps in the visitor's local
 *  time of day on hydration, so no mismatch warning and no cascading render. */
const subscribeToClock = () => () => {};
const readGreeting = () => greetingFor();
const serverGreeting = () => "Good evening";

export function HeroSection() {
  const { theme, mode } = useTheme();
  const isDark = theme === "clay" && mode === "dark";
  const greeting = useSyncExternalStore(
    subscribeToClock,
    readGreeting,
    serverGreeting,
  );

  const { trips } = useAppState();
  const trip = useActiveTrip();
  const packed = trip ? Math.round(packedRatio(trip) * 100) : 0;
  const { user } = useSession();
  const firstName = user?.name.split(" ")[0] ?? "traveller";
  const preferences = user?.preferences ?? null;

  // The hero headline slot is the highest-value real estate on the page, so
  // it shows the single best-scoring destination rather than DESTINATIONS[0].
  // Where they have already been counts as much as what they answered.
  const history = useMemo(() => buildHistory(trips), [trips]);
  const pick = useMemo(() => topPick(preferences, history), [preferences, history]);
  const tagline = useMemo(() => heroLine(preferences), [preferences]);

  return (
    <motion.section
      variants={stagger(0.1, 0.05)}
      initial="hidden"
      animate="show"
      className="relative"
    >
      <ClayCard
        radius="xl"
        depth="lg"
        className="relative overflow-hidden px-5 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:px-12 lg:py-12"
      >
        {/* ---------------------------------------------- ambient clay blobs & dark moon */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {isDark && <DarkHeroMoon />}
          <motion.div
            {...breathe(1.08, 9)}
            className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-clay-blush opacity-45 blur-2xl"
          />
          <motion.div
            {...breathe(1.06, 11, 1.4)}
            className="absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-clay-mint opacity-40 blur-2xl"
          />
          <motion.div
            {...floatDrift(16, 6, 12)}
            className="absolute right-8 top-36 hidden lg:block"
          >
            <ClayCloud size={120} opacity={0.75} />
          </motion.div>
          <motion.div
            {...floatDrift(12, 5, 9, 1.2)}
            className="absolute left-[42%] top-2 hidden opacity-80 md:block"
          >
            <ClayCloud size={92} base="#fdf4ea" />
          </motion.div>
          <motion.div
            {...floatDrift(22, 9, 10)}
            className="absolute right-[38%] top-16 hidden sm:block"
          >
            <ClayPlane size={70} base="#a9c8f4" />
          </motion.div>
        </div>

        {/* ---------------------------------------------- content */}
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
          <div>
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full bg-clay-sunken/80 border border-clay-sky px-4 py-2 font-body text-xs font-bold uppercase tracking-wider text-clay-tangerine shadow-clay-xs"
            >
              <SparkIcon size={15} />
              AI assistant online
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-5 font-display text-[2.1rem] font-semibold leading-[1.08] tracking-tight text-clay-ink sm:text-5xl lg:text-[3.4rem]"
            >
              {greeting}, {firstName}
              <motion.span
                {...floatY(6, 3.6)}
                className="ml-3 inline-block align-middle text-clay-tangerine"
              >
                <SparkIcon size={34} />
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-md font-body text-base leading-relaxed text-clay-ink-soft sm:text-lg"
            >
              {tagline}{" "}
              {trip
                ? `${trip.title} is ${packed}% packed and `
                : "Nothing on the calendar yet — "}
              {pick.destination.name} scores {pick.score} out of 100 against{" "}
              {history.isEmpty
                ? "your answers"
                : `your answers and ${history.completed.length} trip${
                    history.completed.length === 1 ? "" : "s"
                  } so far`}
              .
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              <Link href={trip ? `/trips/${trip.id}` : "/plan"}>
                <ClayButton
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRightIcon size={19} />}
                >
                  {trip ? "Continue planning" : "Plan your first trip"}
                </ClayButton>
              </Link>
              <Link href="/explore">
                <ClayButton
                  size="lg"
                  tone="surface"
                  leftIcon={<PinIcon size={18} />}
                  sound="tap"
                >
                  Explore ideas
                </ClayButton>
              </Link>
            </motion.div>

            {/* Weather used to live here. It now sits directly below the
                hero as its own strip, because there are two readings worth
                showing — here and there — and neither fits in half a row. */}
            <motion.div
              variants={stagger(0.09, 0.15)}
              className="mt-8 max-w-md"
            >
              <RecommendationCard
                name={pick.destination.name}
                price={formatInr(pick.destination.price)}
                days={pick.destination.days}
                rating={pick.destination.rating}
                scene={SCENE_BY_ID[pick.destination.id] ?? "coast"}
                hex={TONES[pick.destination.tone as keyof typeof TONES]?.hex ?? "#526B60"}
                reason={pick.reasons[0] ?? "Highest rated"}
              />
            </motion.div>
          </div>

          {/* ------------------------------------------- character */}
          <motion.div
            variants={fadeUp}
            viewport={revealViewport}
            className="relative mx-auto flex w-full max-w-sm items-center justify-center lg:max-w-none"
          >
            <motion.div
              {...breathe(1.04, 6)}
              className="absolute h-56 w-56 rounded-full bg-clay-sunken/60 border border-clay-sky/60 opacity-80 shadow-clay-xs sm:h-72 sm:w-72"
            />
            <RiveCharacter size={280} className="relative" />

            <motion.div
              {...floatY(10, 4.4, 0.6)}
              className="absolute -right-1 top-4 rounded-clay-sm bg-clay-surface border border-clay-sky px-4 py-2.5 shadow-clay-sm sm:right-4"
            >
              <p className="font-display text-xs font-semibold text-clay-ink">
                Next: {trip ? trip.country : pick.destination.name}
              </p>
              <p className="font-body text-[11px] text-clay-muted">
                {trip
                  ? trip.startDate
                    ? `${formatRange(trip.startDate, trip.endDate)} · ${relativeDay(
                        trip.startDate,
                      )}`
                    : "Dates not set"
                  : "Not booked yet"}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </ClayCard>
    </motion.section>
  );
}

/* ------------------------------- pieces ------------------------------- */

function RecommendationCard({
  name,
  price,
  days,
  rating,
  scene,
  hex,
  reason,
}: {
  name: string;
  price: string;
  days: number;
  rating: number;
  scene: SceneKind;
  hex: string;
  reason: string;
}) {
  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="surface"
        radius="md"
        depth="sm"
        interactive
        subtle
        className="flex items-center gap-4 overflow-hidden p-3"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-clay-sm shadow-clay-xs">
          <ClayScene kind={scene} base={hex} className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
            {reason}
          </p>
          <p className="font-display text-lg font-semibold leading-tight">{name}</p>
          <p className="font-body text-xs text-clay-ink-soft">
            {price} · {days} days
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-clay-butter px-2.5 py-1 font-body text-xs font-bold shadow-clay-xs">
          <StarIcon size={13} className="text-clay-tangerine" />
          {rating}
        </span>
      </ClayCard>
    </motion.div>
  );
}

export const heroTransition = springSoft;
