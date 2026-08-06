"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  CloudIcon,
  HomeIcon,
  LocationArrowIcon,
  SunIcon,
} from "@/components/ui/Icons";
import { fadeUp, floatY, revealViewport, stagger } from "@/lib/animations";
import { useSession } from "@/lib/auth/session";
import { DESTINATIONS } from "@/lib/data";
import { formatRange, isIsoDate, relativeDay } from "@/lib/dates";
import { describeClimate } from "@/lib/packing";
import { pickActiveTrip, useAppState } from "@/lib/store";
import {
  useGeocodedCity,
  useTripClimate,
  useWeather,
  type WeatherState,
} from "@/lib/weather";
import type { Trip } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Weather strip                                                       */
/*                                                                     */
/* Two readings, side by side: where the user is standing, and where    */
/* they are going next. Both live, both from Open-Meteo, and neither    */
/* one invents a number — every card has a real "we don't know" state   */
/* that says which piece is missing and where to go and fix it.         */
/* ------------------------------------------------------------------ */

export function WeatherStrip() {
  const { user } = useSession();
  const { trips } = useAppState();

  const trip = useMemo(() => pickActiveTrip(trips), [trips]);

  const destination = useMemo(() => {
    if (!trip) return null;
    return (
      DESTINATIONS.find((d) => d.id === trip.destinationId) ??
      DESTINATIONS.find(
        (d) => d.country.toLowerCase() === trip.country.trim().toLowerCase(),
      ) ??
      null
    );
  }, [trip]);

  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
      className="grid gap-3 sm:grid-cols-2"
    >
      <HomeWeather city={user?.homeCity ?? ""} />
      <DestinationWeather trip={trip} destination={destination} />
    </motion.section>
  );
}

/* ----------------------------------------------------------- here */

function HomeWeather({ city }: { city: string }) {
  const place = useGeocodedCity(city);
  const coordinates =
    place.status === "ready"
      ? { lat: place.place.lat, lng: place.place.lng }
      : null;
  const weather = useWeather(coordinates);

  const label = place.status === "ready" ? place.place.name : city || "Your home city";

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="sky"
        radius="lg"
        depth="md"
        interactive
        subtle
        className="flex h-full items-center gap-4 p-4 sm:p-5"
      >
        <WeatherGlyph state={weather} tone="text-clay-ocean" />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-clay-ink-soft">
            <HomeIcon size={12} />
            Where you are
          </p>

          {weather.status === "ready" ? (
            <>
              <p className="font-display text-2xl font-semibold leading-tight">
                {weather.weather.tempC}
                <span className="align-top text-base">°C</span>
                <span className="ml-2 font-body text-sm font-semibold text-clay-ink-soft">
                  {label}
                </span>
              </p>
              <p className="truncate font-body text-xs text-clay-ink-soft">
                {weather.weather.description} · feels like{" "}
                {weather.weather.feelsLikeC}° · {weather.weather.highC}° /{" "}
                {weather.weather.lowC}°
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold leading-tight">
                {label}
              </p>
              <p className="font-body text-xs leading-relaxed text-clay-ink-soft">
                {!city ? (
                  <>
                    Add a home city in{" "}
                    <Link href="/profile" className="font-bold underline">
                      your profile
                    </Link>{" "}
                    to see it here
                  </>
                ) : place.status === "unknown" ? (
                  `We could not find "${city}" on the map`
                ) : weather.status === "error" ? (
                  "Live weather unavailable right now"
                ) : (
                  "Checking live conditions…"
                )}
              </p>
            </>
          )}
        </div>
      </ClayCard>
    </motion.div>
  );
}

/* ------------------------------------------------------- next stop */

function DestinationWeather({
  trip,
  destination,
}: {
  trip: Trip | undefined;
  destination: (typeof DESTINATIONS)[number] | null;
}) {
  const weather = useWeather(destination?.coordinates ?? null);

  // The trip-long summary only means anything once there are dates.
  const climate = useTripClimate(
    destination?.coordinates ?? null,
    trip?.startDate ?? "",
    trip?.endDate ?? "",
  );

  const countdown =
    trip && isIsoDate(trip.startDate) ? relativeDay(trip.startDate) : "";

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="mint"
        radius="lg"
        depth="md"
        interactive
        subtle
        className="flex h-full items-center gap-4 p-4 sm:p-5"
      >
        <WeatherGlyph state={weather} tone="text-clay-jade" />

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-clay-ink-soft">
            <LocationArrowIcon size={12} />
            {countdown ? `Where you are going · ${countdown}` : "Where you are going"}
          </p>

          {!trip || !destination ? (
            <>
              <p className="font-display text-lg font-semibold leading-tight">
                Nothing booked
              </p>
              <p className="font-body text-xs leading-relaxed text-clay-ink-soft">
                <Link href="/plan" className="font-bold underline">
                  Plan a trip
                </Link>{" "}
                and its forecast lands here
              </p>
            </>
          ) : weather.status === "ready" ? (
            <>
              <p className="font-display text-2xl font-semibold leading-tight">
                {weather.weather.tempC}
                <span className="align-top text-base">°C</span>
                <span className="ml-2 font-body text-sm font-semibold text-clay-ink-soft">
                  {destination.name}
                </span>
              </p>
              <p className="truncate font-body text-xs text-clay-ink-soft">
                {climate.status === "ready"
                  ? `${formatRange(trip.startDate, trip.endDate)}: ${describeClimate(
                      climate.climate,
                    )}`
                  : `${weather.weather.description} · ${weather.weather.highC}° / ${weather.weather.lowC}°`}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-semibold leading-tight">
                {destination.name}
              </p>
              <p className="font-body text-xs leading-relaxed text-clay-ink-soft">
                {weather.status === "error"
                  ? "Live weather unavailable right now"
                  : "Checking live conditions…"}
              </p>
            </>
          )}
        </div>
      </ClayCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

/** The floating disc. Its glyph follows the reading, or waits politely. */
function WeatherGlyph({ state, tone }: { state: WeatherState; tone: string }) {
  const sunny =
    state.status === "ready" &&
    (state.weather.icon === "sun" || state.weather.code <= 1);

  return (
    <motion.span
      {...floatY(5, 3.8)}
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-clay-raised shadow-clay-xs ${tone}`}
    >
      {sunny ? <SunIcon size={28} /> : <CloudIcon size={28} />}
    </motion.span>
  );
}
