"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { TripHighlightPlayer } from "@/components/trip/TripHighlightPlayer";
import { fadeUp, revealViewport, stagger } from "@/lib/animations";
import { useActiveTrip, useAppState } from "@/lib/store";
import type { Trip } from "@/types/dashboard";

const DEFAULT_TRIP: Trip = {
  id: "japan-2026",
  title: "7 days in Japan",
  country: "Japan",
  destinationId: "japan",
  startDate: "2026-08-01",
  endDate: "2026-08-07",
  days: 7,
  budget: 150000,
  currency: "INR",
  tone: "sky",
  status: "planning",
  summary: "Tokyo, Kyoto & Mount Fuji",
  travelers: [],
  milestones: [],
  itinerary: [],
  packing: [],
  expenses: [],
};

export function TravelStats() {
  const router = useRouter();
  const activeTrip = useActiveTrip();
  const { trips } = useAppState();

  const targetTrip = activeTrip || trips[0] || DEFAULT_TRIP;

  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      className="space-y-4"
    >
      <motion.div variants={fadeUp} className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Your travel memories
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">
            Photo dumps and highlight reels, pulled from your adventures
          </p>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <TripHighlightPlayer
          trip={targetTrip}
          onAddMemory={() => router.push("/memories")}
        />
      </motion.div>
    </motion.section>
  );
}
