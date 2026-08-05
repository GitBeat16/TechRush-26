"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCloud, ClayPlane, ClayScene } from "@/components/ui/ClayIllustrations";
import { RiveCharacter } from "@/components/Dashboard/RiveCharacter";
import {
  ArrowRightIcon,
  CloudIcon,
  PinIcon,
  SparkIcon,
  StarIcon,
  SunIcon,
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
import { packedRatio, useActiveTrip } from "@/lib/store";
import { useSession } from "@/lib/auth/session";
import { DESTINATIONS, WEATHER, formatInr, greetingFor } from "@/lib/data";

/** Server renders "Good evening"; the client swaps in the visitor's local
 *  time of day on hydration, so no mismatch warning and no cascading render. */
const subscribeToClock = () => () => {};
const readGreeting = () => greetingFor();
const serverGreeting = () => "Good evening";

export function HeroSection() {
  const greeting = useSyncExternalStore(
    subscribeToClock,
    readGreeting,
    serverGreeting,
  );

  const pick = DESTINATIONS[0];
  const trip = useActiveTrip();
  const packed = Math.round(packedRatio(trip) * 100);
  const { user } = useSession();
  const firstName = user?.name.split(" ")[0] ?? "traveller";

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
        {/* ---------------------------------------------- ambient clay blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            className="absolute right-6 top-8 hidden lg:block"
          >
            <ClayCloud size={130} opacity={0.85} />
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
              className="inline-flex items-center gap-2 rounded-full bg-clay-butter px-4 py-2 font-body text-xs font-bold uppercase tracking-wider text-clay-ink shadow-clay-xs"
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
              Ready for your next adventure? {trip.title} is {packed}% packed
              and three new routes just came in under budget.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              <Link href={`/trips/${trip.id}`}>
                <ClayButton
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRightIcon size={19} />}
                >
                  Continue planning
                </ClayButton>
              </Link>
              <Link href="/explore">
                <ClayButton
                  size="lg"
                  tone="mint"
                  leftIcon={<PinIcon size={18} />}
                  sound="tap"
                >
                  Explore ideas
                </ClayButton>
              </Link>
            </motion.div>

            {/* weather + recommendation */}
            <motion.div
              variants={stagger(0.09, 0.15)}
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              <WeatherCard />
              <RecommendationCard
                name={pick.name}
                price={formatInr(pick.price)}
                days={pick.days}
                rating={pick.rating}
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
              className="absolute h-56 w-56 rounded-full bg-clay-peach opacity-60 shadow-clay-inset sm:h-72 sm:w-72"
            />
            <RiveCharacter size={280} className="relative" />

            <motion.div
              {...floatY(10, 4.4, 0.6)}
              className="absolute -right-1 top-4 rounded-clay-sm bg-clay-surface px-4 py-2.5 shadow-clay-sm sm:right-4"
            >
              <p className="font-display text-xs font-semibold text-clay-ink">
                Next: {trip.country}
              </p>
              <p className="font-body text-[11px] text-clay-muted">
                {trip.startDate}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </ClayCard>
    </motion.section>
  );
}

/* ------------------------------- pieces ------------------------------- */

function WeatherCard() {
  const Icon = WEATHER.icon === "sun" ? SunIcon : CloudIcon;

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="sky"
        radius="md"
        depth="sm"
        interactive
        subtle
        className="flex items-center gap-4 p-4"
      >
        <motion.span
          {...floatY(5, 3.8)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-ocean shadow-clay-xs"
        >
          <Icon size={28} />
        </motion.span>
        <div className="min-w-0">
          <p className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-ink-soft">
            {WEATHER.city} right now
          </p>
          <p className="font-display text-2xl font-semibold leading-tight">
            {WEATHER.temperature}
            <span className="text-base align-top">C</span>
          </p>
          <p className="truncate font-body text-xs text-clay-ink-soft">
            {WEATHER.condition} · {WEATHER.high} / {WEATHER.low}
          </p>
        </div>
      </ClayCard>
    </motion.div>
  );
}

function RecommendationCard({
  name,
  price,
  days,
  rating,
}: {
  name: string;
  price: string;
  days: number;
  rating: number;
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
          <ClayScene kind="torii" base="#ffd3d8" className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
            Picked for you
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
