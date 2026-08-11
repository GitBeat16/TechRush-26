"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Destination } from "@/types/dashboard";
import { formatInr } from "@/lib/data";
import { Map } from "./Map";
import type { MapLocation } from "./LeafletMapContainer";
import { ClayCard } from "@/components/ui/ClayCard";
import { GlobeIcon, PinIcon, StarIcon } from "@/components/ui/Icons";
import { fadeUp, springSnappy, stagger } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";

export interface TripNestMapSectionProps {
  /** Array of filtered destination objects passed directly from ExploreView */
  destinations: Destination[];
  className?: string;
}

export function TripNestMapSection({
  destinations = [],
  className = "",
}: TripNestMapSectionProps) {
  const { play } = useFeedback();
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | undefined>(undefined);

  // Filter destinations that have valid geographic coordinates
  const validDestinations = useMemo(() => {
    return destinations.filter(
      (d) => d.coordinates && d.coordinates.lat !== undefined && d.coordinates.lng !== undefined
    );
  }, [destinations]);

  // Currently active/selected destination
  const selectedDestination = useMemo(() => {
    return validDestinations.find((d) => d.id === selectedDestinationId);
  }, [validDestinations, selectedDestinationId]);

  // Compute map center:
  // 1. If a destination is selected in the sidebar or via marker click, center on it.
  // 2. Else if filtered destinations exist, center on the first valid destination.
  // 3. Default world view center.
  const mapCenter = useMemo(() => {
    if (selectedDestination?.coordinates) {
      return selectedDestination.coordinates;
    }
    if (validDestinations.length > 0 && validDestinations[0].coordinates) {
      return validDestinations[0].coordinates;
    }
    return { lat: 30.0, lng: 20.0 };
  }, [selectedDestination, validDestinations]);

  // Set appropriate zoom level
  const mapZoom = selectedDestination ? 6 : validDestinations.length === 1 ? 6 : 3;

  // Convert destination objects to Leaflet map markers
  const locations: MapLocation[] = useMemo(() => {
    return validDestinations.map((d) => ({
      id: d.id,
      name: `${d.name}, ${d.country}`,
      latitude: d.coordinates!.lat,
      longitude: d.coordinates!.lng,
      category: d.region,
      description: d.tagline,
      estimatedCost: formatInr(d.price),
      visitDuration: `${d.days} days · ${d.bestSeason}`,
      tone: d.tone,
      rating: d.rating,
    }));
  }, [validDestinations]);

  const handleDestinationSelect = (d: Destination) => {
    setSelectedDestinationId(d.id);
    play("pop");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-2">
        <motion.div variants={fadeUp} className="flex items-center gap-2 text-clay-ink-soft">
          <GlobeIcon size={20} className="text-clay-tangerine" />
          <span className="font-body text-xs font-bold uppercase tracking-wide text-clay-muted">
            TripNest OpenStreetMap View
          </span>
        </motion.div>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold text-clay-ink">
              Explore Destinations on Map
            </h2>
            <p className="font-body text-xs text-clay-ink-soft">
              Interactive OpenStreetMap view updates automatically with your active search, budget, region, and vibe filters.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-clay-xs text-clay-ink w-fit border border-white/60">
            {validDestinations.length} {validDestinations.length === 1 ? "Destination" : "Destinations"} on map
          </span>
        </motion.div>
      </motion.div>

      {/* Main Map & Destinations Sidebar Grid */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* OpenStreetMap Card */}
        <div className="lg:col-span-8">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            locations={locations}
            height="500px"
            tone="surface"
            selectedLocationId={selectedDestinationId}
            onMarkerClick={(loc) => {
              const matched = validDestinations.find((d) => d.id === loc.id);
              if (matched) setSelectedDestinationId(matched.id);
              play("pop");
            }}
          />
        </div>

        {/* Sidebar: Destinations List (reflects current filtered results from ExploreView) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="px-1 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-clay-ink">
              Matching Destinations
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white shadow-clay-xs text-clay-ink">
              {validDestinations.length}
            </span>
          </div>

          {validDestinations.length === 0 ? (
            <ClayCard tone="surface" radius="md" depth="sm" className="p-6 text-center">
              <p className="font-display text-sm font-semibold">No destinations match filters</p>
              <p className="mt-1 font-body text-xs text-clay-ink-soft">
                Try widening your budget or clearing vibe/region filters above.
              </p>
            </ClayCard>
          ) : (
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
              {validDestinations.map((destination) => {
                const isSelected = destination.id === selectedDestinationId;
                return (
                  <motion.div
                    key={destination.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={springSnappy}
                    onClick={() => handleDestinationSelect(destination)}
                    className="cursor-pointer"
                  >
                    <ClayCard
                      tone={isSelected ? "peach" : destination.tone}
                      radius="md"
                      depth={isSelected ? "md" : "sm"}
                      className={`p-3.5 border-2 transition-all ${
                        isSelected ? "border-clay-tangerine shadow-clay" : "border-white/70 shadow-clay-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-clay-sunken/60 text-clay-ink shrink-0">
                            <PinIcon size={14} />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
                              {destination.name}
                            </h4>
                            <span className="font-body text-[11px] font-semibold text-clay-muted">
                              {destination.country} · {destination.region}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="font-display text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                            {formatInr(destination.price)}
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-700 mt-1">
                            <StarIcon size={11} /> {destination.rating}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 font-body text-xs text-clay-ink-soft line-clamp-2">
                        {destination.tagline}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-clay-muted/15 pt-2 font-body text-[11px] text-clay-muted">
                        <span>{destination.days} days · {destination.bestSeason}</span>
                        <span className="font-bold text-clay-ink-soft">
                          {isSelected ? "Active on map ✓" : "Click to center →"}
                        </span>
                      </div>
                    </ClayCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripNestMapSection;
