"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DestinationCard } from "@/components/Dashboard/DestinationCard";
import { PageHeader } from "@/components/shell/PageHeader";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { ClayChip } from "@/components/ui/ClayButton";
import { GoogleMapCard, TripNestMapSection, type MapMarkerProps } from "@/components/map";
import {
  BookmarkIcon,
  GlobeIcon,
  PinIcon,
  SearchIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSoft, stagger } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { useSavedDestinations } from "@/lib/store";
import { DESTINATIONS, REGIONS, VIBES, formatInr } from "@/lib/data";

type Sort = "recommended" | "price" | "duration" | "rating";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "price", label: "Cheapest" },
  { id: "duration", label: "Shortest" },
  { id: "rating", label: "Top rated" },
];

export function ExploreView() {
  const params = useSearchParams();
  const { play } = useFeedback();
  const { savedDestinationIds } = useSavedDestinations();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [region, setRegion] = useState<string>("All");
  const [vibes, setVibes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(150000);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = DESTINATIONS.filter((destination) => {
      if (needle && !`${destination.name} ${destination.country} ${destination.tagline} ${destination.vibes.join(" ")}`
        .toLowerCase()
        .includes(needle)) {
        return false;
      }
      if (region !== "All" && destination.region !== region) return false;
      if (destination.price > maxPrice) return false;
      if (vibes.length && !vibes.some((vibe) => destination.vibes.includes(vibe))) return false;
      if (savedOnly && !savedDestinationIds.includes(destination.id)) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "price") sorted.sort((a, b) => a.price - b.price);
    if (sort === "duration") sorted.sort((a, b) => a.days - b.days);
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [query, region, vibes, maxPrice, savedOnly, savedDestinationIds, sort]);

  const mapMarkers = useMemo<MapMarkerProps[]>(() => {
    return results
      .filter((d) => d.coordinates)
      .map((d) => ({
        id: d.id,
        position: d.coordinates!,
        title: `${d.name}, ${d.country}`,
        tone: d.tone,
        infoWindowContent: (
          <div className="space-y-1">
            <p className="font-display text-xs font-semibold text-clay-ink">{d.tagline}</p>
            <div className="flex items-center justify-between text-[11px] text-clay-ink-soft pt-1">
              <span>{formatInr(d.price)} · {d.days} days</span>
              <span className="font-bold text-amber-700">★ {d.rating}</span>
            </div>
          </div>
        ),
      }));
  }, [results]);

  const toggleVibe = (vibe: string) =>
    setVibes((current) =>
      current.includes(vibe) ? current.filter((value) => value !== vibe) : [...current, vibe],
    );

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Discover"
        title="Explore destinations"
        subtitle="Filter by region, budget and the kind of trip you are in the mood for. Save anything that catches your eye."
        icon={<PinIcon size={24} />}
      />

      {/* ---------------------------------------------------- filters */}
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <ClayCard tone="surface" radius="lg" depth="sm" className="p-4 sm:p-5">
            <ClayWell radius="md" className="flex items-center gap-3 px-5 py-3.5">
              <SearchIcon size={19} className="shrink-0 text-clay-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => play("pop")}
                placeholder="Search destinations, vibes or a country"
                className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    play("toggleOff");
                  }}
                  className="rounded-full bg-clay-surface px-3 py-1 font-body text-xs font-bold text-clay-muted shadow-clay-xs"
                >
                  clear
                </button>
              )}
            </ClayWell>

            <div className="mt-4 grid gap-4 lg:grid-cols-[auto_1fr]">
              <div>
                <FilterLabel>Region</FilterLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REGIONS.map((value) => (
                    <ClayChip
                      key={value}
                      tone="sky"
                      active={region === value}
                      onClick={() => setRegion(value)}
                    >
                      {value}
                    </ClayChip>
                  ))}
                </div>
              </div>

              <div>
                <FilterLabel>
                  Budget up to
                  <span className="ml-2 rounded-full bg-clay-raised px-2.5 py-0.5 font-display text-xs font-bold shadow-clay-xs">
                    {formatInr(maxPrice)}
                  </span>
                </FilterLabel>
                <div className="mt-2.5 flex items-center gap-3">
                  <WalletIcon size={18} className="shrink-0 text-clay-ink-soft" />
                  <input
                    type="range"
                    min={30000}
                    max={150000}
                    step={5000}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    onPointerUp={() => play("tap")}
                    className="clay-range"
                    aria-label="Maximum budget"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <FilterLabel>Vibe</FilterLabel>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VIBES.map((vibe) => (
                  <ClayChip
                    key={vibe}
                    tone="mint"
                    active={vibes.includes(vibe)}
                    onClick={() => toggleVibe(vibe)}
                  >
                    {vibe}
                  </ClayChip>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-clay-muted/15 pt-4">
              <ClayChip
                tone="blush"
                active={savedOnly}
                onClick={() => setSavedOnly((current) => !current)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <BookmarkIcon size={13} filled={savedOnly} />
                  Saved only ({savedDestinationIds.length})
                </span>
              </ClayChip>

              <span className="ml-auto flex flex-wrap items-center gap-1.5">
                <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
                  Sort
                </span>
                {SORTS.map((option) => (
                  <ClayChip
                    key={option.id}
                    tone="butter"
                    active={sort === option.id}
                    onClick={() => setSort(option.id)}
                  >
                    {option.label}
                  </ClayChip>
                ))}
              </span>
            </div>
          </ClayCard>
        </motion.div>
      </motion.div>

      {/* ---------------------------------------------------- view toggle & results */}
      <motion.div
        key={`${region}-${sort}-${savedOnly}-${vibes.join()}-${query}`}
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
      >
        <div className="mb-3 px-1 flex items-center justify-between">
          <motion.p variants={fadeUp} className="font-body text-sm text-clay-ink-soft">
            {results.length} {results.length === 1 ? "destination" : "destinations"} match
          </motion.p>

          <motion.div variants={fadeUp} className="flex items-center gap-1.5 bg-clay-surface/80 p-1 rounded-full shadow-clay-xs border border-white/60">
            <ClayChip
              tone="peach"
              active={viewMode === "grid"}
              onClick={() => {
                setViewMode("grid");
                play("tap");
              }}
            >
              <span className="px-1 text-xs">Grid View</span>
            </ClayChip>
            <ClayChip
              tone="sky"
              active={viewMode === "map"}
              onClick={() => {
                setViewMode("map");
                play("tap");
              }}
            >
              <span className="inline-flex items-center gap-1 px-1 text-xs">
                <GlobeIcon size={13} />
                Map View
              </span>
            </ClayChip>
          </motion.div>
        </div>

        {results.length === 0 ? (
          <motion.div variants={fadeUp}>
            <ClayCard tone="surface" radius="lg" depth="sm" className="p-10 text-center">
              <p className="font-display text-lg font-semibold">Nothing matches yet</p>
              <p className="mt-1 font-body text-sm text-clay-ink-soft">
                Try widening the budget or clearing a vibe filter.
              </p>
            </ClayCard>
          </motion.div>
        ) : viewMode === "map" ? (
          <motion.div variants={fadeUp}>
            <TripNestMapSection destinations={results} />
          </motion.div>
        ) : (
          <motion.div
            layout
            transition={springSoft}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {results.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} fluid />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
      {children}
    </span>
  );
}


