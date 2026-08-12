"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PhotoDumpFeed } from "@/components/trip/PhotoDumpFeed";
import { TripHighlightPlayer } from "@/components/trip/TripHighlightPlayer";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import { CameraIcon, SparkIcon, SuitcaseIcon } from "@/components/ui/Icons";
import { feedback } from "@/lib/feedback";
import { useActiveTrip, useAppState } from "@/lib/store";

export default function MemoriesPage() {
  const { trips } = useAppState();
  const activeTrip = useActiveTrip();
  const [tripId, setTripId] = useState<string | undefined>(activeTrip?.id ?? trips[0]?.id);
  const [refreshKey, setRefreshKey] = useState(0);

  const selected = trips.find((trip) => trip.id === tripId) ?? trips[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Every trip, remembered"
        title="Memories"
        subtitle="Photo dumps and highlight reels, pulled from whichever trip you pick below."
        icon={<CameraIcon size={24} />}
      />

      {trips.length === 0 && (
        <ClayCard tone="surface" radius="lg" depth="sm" className="p-10 text-center">
          <SuitcaseIcon size={28} className="mx-auto text-clay-muted" />
          <p className="mt-2 font-display text-lg font-semibold">No trips yet</p>
          <p className="mx-auto mt-1 max-w-sm font-body text-sm text-clay-ink-soft">
            Plan a trip first — memories and highlights are built from what you post on it.
          </p>
          <Link href="/plan" onClick={() => feedback("nav")}>
            <ClayButton className="mx-auto mt-4" variant="primary" leftIcon={<SparkIcon size={16} />}>
              Plan a new trip
            </ClayButton>
          </Link>
        </ClayCard>
      )}

      {trips.length > 0 && selected && (
        <div className="space-y-8">
          {/* Trip Selector Chips */}
          <div className="flex flex-wrap gap-2">
            {trips.map((trip) => (
              <ClayChip
                key={trip.id}
                tone="peach"
                active={trip.id === selected.id}
                onClick={() => setTripId(trip.id)}
              >
                {trip.title}
              </ClayChip>
            ))}
          </div>

          {/* Section A: ✨ Your Highlights */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <SparkIcon size={20} className="text-clay-rose" />
              <h2 className="font-display text-xl font-bold tracking-tight text-clay-ink sm:text-2xl">
                Your Highlights
              </h2>
            </div>
            <TripHighlightPlayer
              key={`${selected.id}-${refreshKey}`}
              trip={selected}
              onAddMemory={() => {
                const el = document.getElementById("photo-dump-upload-area");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </section>

          {/* Section B: 📸 Your Photo Dumps */}
          <section id="photo-dump-upload-area" className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CameraIcon size={20} className="text-clay-sky" />
              <h2 className="font-display text-xl font-bold tracking-tight text-clay-ink sm:text-2xl">
                Your Photo Dumps
              </h2>
            </div>
            <PhotoDumpFeed
              trip={selected}
              onPosted={() => {
                // Instantly refresh highlight when a new memory is posted
                setRefreshKey((k) => k + 1);
              }}
            />
          </section>

          <div className="text-center pt-2">
            <Link
              href={`/trips/${selected.id}`}
              onClick={() => feedback("nav")}
              className="font-body text-xs font-semibold text-clay-muted underline-offset-2 hover:text-clay-ink hover:underline"
            >
              Open {selected.title} — itinerary, packing, budget
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
