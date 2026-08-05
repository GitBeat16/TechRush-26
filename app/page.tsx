"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { HeroSection } from "@/components/Dashboard/HeroSection";
import { TripCard } from "@/components/Dashboard/TripCard";
import { DestinationCarousel } from "@/components/Dashboard/DestinationCard";
import { TravelStats } from "@/components/Dashboard/TravelStats";
import { ArrowRightIcon } from "@/components/ui/Icons";
import { fadeUp, revealViewport, springSnappy, stagger } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { NAV } from "@/lib/nav";
import { TONES } from "@/lib/tones";
import { useActiveTrip } from "@/lib/store";
import type { ClayTone } from "@/types/dashboard";

const SHORTCUT_TONES: Record<string, ClayTone> = {
  "/plan": "lilac",
  "/explore": "mint",
  "/trips": "peach",
  "/compare": "sky",
};

export default function HomePage() {
  const trip = useActiveTrip();

  return (
    <div className="space-y-10 sm:space-y-12 lg:space-y-14">
      <HeroSection />

      <Shortcuts />

      {trip && <TripCard trip={trip} />}

      <DestinationCarousel />

      <TravelStats />
    </div>
  );
}

/** Entry points to the other sections, now that the app has real routes. */
function Shortcuts() {
  const items = NAV.filter((item) => SHORTCUT_TONES[item.href]);

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp} className="mb-4 px-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Jump back in
        </h2>
        <p className="mt-1 font-body text-sm text-clay-ink-soft">
          Every part of Wanderly has its own space now
        </p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const tone = SHORTCUT_TONES[item.href];

          return (
            <motion.div key={item.href} variants={fadeUp}>
              <Link href={item.href} onClick={() => feedback("nav")}>
                <ClayCard
                  tone={tone}
                  radius="lg"
                  depth="md"
                  interactive
                  className="group h-full p-5"
                >
                  <motion.span
                    whileHover={{ rotate: -8, scale: 1.08 }}
                    transition={springSnappy}
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-clay-sm bg-clay-raised shadow-clay-xs"
                    style={{ color: TONES[tone].accent }}
                  >
                    <Icon size={22} />
                  </motion.span>
                  <p className="font-display text-lg font-semibold leading-tight">
                    {item.label}
                  </p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-clay-ink-soft">
                    {item.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wide text-clay-ink-soft">
                    Open
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ type: "tween", duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex"
                    >
                      <ArrowRightIcon size={14} />
                    </motion.span>
                  </span>
                </ClayCard>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
