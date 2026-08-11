"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { HeroSection } from "@/components/Dashboard/HeroSection";
import { WeatherStrip } from "@/components/Dashboard/WeatherStrip";
import { TripCard } from "@/components/Dashboard/TripCard";
import { TripCalendar } from "@/components/Dashboard/TripCalendar";
import { TravelGlobe } from "@/components/Dashboard/TravelGlobe";
import { DestinationCarousel } from "@/components/Dashboard/DestinationCard";
import { PersonalizedPicks } from "@/components/Dashboard/PersonalizedPicks";
import { TravelStats } from "@/components/Dashboard/TravelStats";
import { ClaySuitcase } from "@/components/ui/ClayIllustrations";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { fadeUp, floatY, revealViewport, stagger } from "@/lib/animations";
import { useActiveTrip, useAppState } from "@/lib/store";

/**
 * The dashboard, in the order someone actually reads it:
 *
 *   1. who they are and what is imminent   — hero
 *   1b. the weather here and the weather there — strip
 *   2. the trip they are in the middle of  — current trip
 *   3. where to go next                    — made for you
 *   4. when it is all happening            — calendar
 *   5. browsing, when nothing is pressing  — destinations
 *   6. what they have already done         — shelf, then globe
 *
 * Every section reads from real state. Sections with nothing to say render
 * their own empty state rather than filler.
 */
export default function HomePage() {
  const trip = useActiveTrip();

  return (
    <div className="space-y-10 sm:space-y-12 lg:space-y-14">
      <HeroSection />

      <WeatherStrip />

      {trip ? <TripCard trip={trip} /> : <NoTripYet />}

      <PersonalizedPicks />

      <TripCalendar />

      <DestinationCarousel />

      <TravelStats />

      <TravelGlobe />
    </div>
  );
}

/**
 * Shown in the current-trip slot when there is nothing planned. It is a
 * prompt, not a fake trip — the one thing this space must never do is imply
 * the user has a holiday booked.
 */
function NoTripYet() {
  const { trips } = useAppState();

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="xl" depth="lg" className="p-6 sm:p-9">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <motion.div {...floatY(9, 5.4)} className="shrink-0">
              <ClaySuitcase size={104} />
            </motion.div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
                Current trip
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {trips.length
                  ? "Nothing coming up"
                  : "No trips on the board yet"}
              </h2>
              <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-clay-ink-soft">
                {trips.length
                  ? "Every trip you have is in the past. Plan the next one and this space fills with countdowns, packing progress and live weather."
                  : "Once you plan a trip it lives here — dates, budget, packing and how ready you are, all in one place."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
                <Link href="/plan">
                  <ClayButton
                    variant="primary"
                    rightIcon={<ArrowRightIcon size={18} />}
                  >
                    Plan a trip
                  </ClayButton>
                </Link>
                {trips.length > 0 && (
                  <Link href="/trips">
                    <ClayButton tone="mint" sound="nav">
                      See past trips
                    </ClayButton>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </ClayCard>
      </motion.div>
    </motion.section>
  );
}
