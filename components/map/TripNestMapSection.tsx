"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Destination } from "@/types/dashboard";
import { formatInr, getDestinationPlaces } from "@/lib/data";
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
  const [selectedPlaceCoords, setSelectedPlaceCoords] = useState<{lat: number, lng: number} | null>(null);

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
  // 1. If a specific place is clicked, center on it.
  // 2. If a destination is selected in the sidebar or via marker click, center on it.
  // 3. Else if filtered destinations exist, center on the first valid destination.
  // 4. Default world view center.
  const mapCenter = useMemo(() => {
    if (selectedPlaceCoords) {
      return selectedPlaceCoords;
    }
    if (selectedDestination?.coordinates) {
      return selectedDestination.coordinates;
    }
    if (validDestinations.length > 0 && validDestinations[0].coordinates) {
      return validDestinations[0].coordinates;
    }
    return { lat: 30.0, lng: 20.0 };
  }, [selectedPlaceCoords, selectedDestination, validDestinations]);

  // Set appropriate zoom level
  const mapZoom = selectedPlaceCoords ? 10 : selectedDestination ? 6 : validDestinations.length === 1 ? 6 : 3;

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
    setSelectedPlaceCoords(null);
    play("pop");
  };

  const handlePlaceSelect = (placeId: string, destId: string) => {
    // Rough coordinates for places
    const PLACE_COORDS: Record<string, {lat: number, lng: number}> = {
      "tokyo": { lat: 35.6762, lng: 139.6503 },
      "kyoto": { lat: 35.0116, lng: 135.7681 },
      "osaka": { lat: 34.6937, lng: 135.5023 },
      "mount-fuji": { lat: 35.3606, lng: 138.7274 },
      "nara": { lat: 34.6851, lng: 135.8048 },
      "hokkaido": { lat: 43.2203, lng: 142.8635 },
      "okinawa": { lat: 26.2124, lng: 127.6809 },
      "ubud": { lat: -8.5069, lng: 115.2625 },
      "seminyak": { lat: -8.6913, lng: 115.1682 },
      "canggu": { lat: -8.6478, lng: 115.1385 },
      "uluwatu": { lat: -8.8291, lng: 115.0889 },
      "nusa-penida": { lat: -8.7278, lng: 115.5444 },
      "kuta": { lat: -8.7233, lng: 115.1723 },
      "tanah-lot": { lat: -8.6212, lng: 115.0868 },
      "zurich": { lat: 47.3769, lng: 8.5417 },
      "lucerne": { lat: 47.0502, lng: 8.3093 },
      "interlaken": { lat: 46.6863, lng: 7.8632 },
      "zermatt": { lat: 46.0207, lng: 7.7491 },
      "lauterbrunnen": { lat: 46.5935, lng: 7.9091 },
      "grindelwald": { lat: 46.6241, lng: 8.0414 },
      "lake-geneva": { lat: 46.4312, lng: 6.5244 },
      "hanoi": { lat: 21.0285, lng: 105.8542 },
      "ha-long-bay": { lat: 20.8988, lng: 107.1352 },
      "ho-chi-minh-city": { lat: 10.8231, lng: 106.6297 },
      "da-nang": { lat: 16.0544, lng: 108.2022 },
      "hoi-an": { lat: 15.8801, lng: 108.3380 },
      "nha-trang": { lat: 12.2388, lng: 109.1967 },
      "phu-quoc": { lat: 10.2899, lng: 103.9840 },
      "lisbon": { lat: 38.7223, lng: -9.1393 },
      "porto": { lat: 41.1579, lng: -8.6291 },
      "sintra": { lat: 38.8029, lng: -9.3817 },
      "algarve": { lat: 37.0194, lng: -7.9304 },
      "madeira": { lat: 32.7607, lng: -16.9595 },
      "coimbra": { lat: 40.2056, lng: -8.4195 },
      "lagos": { lat: 37.1028, lng: -8.6730 },
      "reykjavik": { lat: 64.1466, lng: -21.9426 },
      "blue-lagoon": { lat: 63.8804, lng: -22.4495 },
      "golden-circle": { lat: 64.2559, lng: -21.1304 },
      "vik": { lat: 63.4186, lng: -19.0060 },
      "jokulsarlon": { lat: 64.0484, lng: -16.1794 },
      "akureyri": { lat: 65.6835, lng: -18.1105 },
      "snaefellsnes": { lat: 64.8725, lng: -23.0805 }
    };
    
    if (PLACE_COORDS[placeId]) {
      setSelectedPlaceCoords(PLACE_COORDS[placeId]);
    } else {
      // Fallback to destination center
      const dest = validDestinations.find(d => d.id === destId);
      if (dest && dest.coordinates) setSelectedPlaceCoords(dest.coordinates);
    }
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

          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-clay-surface shadow-clay-xs text-clay-ink w-fit border border-clay-muted/20">
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
              if (matched) {
                setSelectedDestinationId(matched.id);
                setSelectedPlaceCoords(null);
              }
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
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-clay-surface shadow-clay-xs text-clay-ink">
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
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
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
                          <span className="font-display text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                            {formatInr(destination.price)}
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                            <StarIcon size={11} /> {destination.rating}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 font-body text-xs text-clay-ink-soft line-clamp-2">
                        {destination.tagline}
                      </p>

                      {isSelected && getDestinationPlaces(destination.id).length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-clay-muted/15 pt-3">
                          <p className="font-display font-bold text-[11px] uppercase tracking-wide text-clay-ink">
                            Top places in {destination.name}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {getDestinationPlaces(destination.id).map(place => (
                              <button 
                                key={place.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlaceSelect(place.id, destination.id);
                                }}
                                className="flex items-center gap-2 overflow-hidden rounded-md bg-clay-surface/50 hover:bg-clay-surface p-1.5 shadow-clay-xs transition-colors text-left"
                              >
                                <img src={place.image} alt={place.name} className="h-7 w-7 shrink-0 rounded object-cover shadow-clay-xs" />
                                <span className="truncate font-body text-[11px] font-bold text-clay-ink">
                                  {place.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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
