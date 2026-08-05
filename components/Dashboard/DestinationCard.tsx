"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { SCENE_BY_ID, ClayScene } from "@/components/ui/ClayIllustrations";
import {
  BookmarkIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  revealViewport,
  springBouncy,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import { actions, useSavedDestinations } from "@/lib/store";
import { DESTINATIONS, formatInr } from "@/lib/data";
import type { Destination } from "@/types/dashboard";

export interface DestinationCardProps {
  destination: Destination;
  /** stretch to fill a grid cell instead of the fixed carousel width */
  fluid?: boolean;
}

export function DestinationCard({ destination, fluid = false }: DestinationCardProps) {
  const { play } = useFeedback();
  const { isSaved } = useSavedDestinations();
  const saved = isSaved(destination.id);
  const scene = SCENE_BY_ID[destination.id] ?? "coast";

  return (
    <motion.div
      variants={fadeUp}
      className={fluid ? "h-full" : "w-[17rem] shrink-0 snap-start sm:w-[19rem]"}
    >
      <ClayCard
        tone="surface"
        radius="lg"
        depth="md"
        interactive
        onHoverStart={() => play("pop")}
        className="group h-full overflow-hidden p-3"
      >
        <div className="relative h-40 overflow-hidden rounded-clay shadow-clay-inset-sm sm:h-44">
          <motion.div whileHover={{ scale: 1.08 }} transition={springSoft} className="h-full w-full">
            <ClayScene kind={scene} base={TONES[destination.tone].hex} className="h-full w-full" />
          </motion.div>

          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-clay-surface/95 px-2.5 py-1 font-body text-[11px] font-bold shadow-clay-xs">
            <StarIcon size={12} className="text-clay-tangerine" />
            {destination.rating}
          </span>

          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.85 }}
            transition={springBouncy}
            onClick={() => {
              play(saved ? "toggleOff" : "toggleOn");
              actions.toggleSavedDestination(destination.id);
            }}
            aria-label={saved ? "Remove from saved" : "Save destination"}
            aria-pressed={saved}
            className={[
              "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
              saved
                ? "bg-clay-rose text-white shadow-clay-sm"
                : "bg-clay-surface/95 text-clay-ink-soft shadow-clay-xs",
            ].join(" ")}
          >
            <motion.span
              key={String(saved)}
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springBouncy}
              className="inline-flex"
            >
              <BookmarkIcon size={18} filled={saved} />
            </motion.span>
          </motion.button>
        </div>

        <div className="px-2 pb-1 pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-xl font-semibold leading-tight">
              {destination.name}
            </h3>
            <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
              {destination.region}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 min-h-[2.4rem] font-body text-xs leading-relaxed text-clay-ink-soft">
            {destination.tagline}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="flex flex-1 items-center gap-1.5 rounded-full bg-clay-sunken px-3 py-2 font-display text-sm font-semibold shadow-clay-inset-sm">
              <WalletIcon size={15} className="text-clay-muted" />
              {formatInr(destination.price)}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full ${TONES[destination.tone].bg} px-3 py-2 font-display text-sm font-semibold shadow-clay-xs`}
            >
              <CalendarIcon size={15} />
              {destination.days}d
            </span>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="font-body text-[11px] text-clay-muted">
              Best · {destination.bestSeason}
            </p>
            <div className="flex items-center gap-1.5">
              <Link
                href="/budget"
                onClick={() => play("nav")}
                className="rounded-full bg-clay-mint px-2.5 py-1 font-body text-[11px] font-bold text-clay-ink shadow-clay-xs transition-shadow hover:shadow-clay-sm"
                title="View & customize trip budget"
              >
                Budget
              </Link>
              <Link
                href={`/plan?destination=${encodeURIComponent(destination.name)}`}
                onClick={() => play("nav")}
                className="rounded-full bg-clay-butter px-3 py-1 font-body text-[11px] font-bold shadow-clay-xs transition-shadow hover:shadow-clay-sm"
              >
                Plan this
              </Link>
            </div>
          </div>
        </div>
      </ClayCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel — used on the home page                                    */
/* ------------------------------------------------------------------ */

export function DestinationCarousel({
  destinations = DESTINATIONS,
  title = "Where to next",
  subtitle,
}: {
  destinations?: Destination[];
  title?: string;
  subtitle?: string;
}) {
  const { play } = useFeedback();
  const railRef = useRef<HTMLDivElement>(null);
  const { savedDestinationIds } = useSavedDestinations();
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const scrollBy = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    play("whoosh");
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = (card?.offsetWidth ?? 280) + 20;
    el.scrollBy({ left: direction * step * 1.5, behavior: "smooth" });
  };

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
        <motion.div variants={fadeUp}>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">
            {subtitle ?? `Matched to your budget and pace · ${savedDestinationIds.length} saved`}
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-2">
          <RailButton direction="left" disabled={edges.start} onClick={() => scrollBy(-1)} />
          <RailButton direction="right" disabled={edges.end} onClick={() => scrollBy(1)} />
        </motion.div>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4 pt-2"
        >
          {destinations.map((destination) => (
            <div key={destination.id} data-card>
              <DestinationCard destination={destination} />
            </div>
          ))}
          <div className="w-1 shrink-0" aria-hidden />
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-clay-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-clay-bg to-transparent" />
      </div>
    </motion.section>
  );
}

function RailButton({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.1, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={springSnappy}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Previous destinations" : "More destinations"}
      className={[
        "flex h-12 w-12 items-center justify-center rounded-full bg-clay-surface text-clay-ink transition-all duration-200",
        disabled
          ? "opacity-40 shadow-clay-inset-sm"
          : "shadow-clay-sm hover:shadow-clay active:shadow-clay-pressed",
      ].join(" ")}
    >
      {direction === "left" ? <ChevronLeftIcon size={20} /> : <ChevronRightIcon size={20} />}
    </motion.button>
  );
}
