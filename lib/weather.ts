"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Live weather                                                        */
/*                                                                     */
/* Open-Meteo, straight from the browser. It needs no API key and no    */
/* server route, which is why it is here rather than behind /api.       */
/*                                                                     */
/* The one rule this module follows: if the network says nothing, the   */
/* UI shows nothing. There is no "typical for the season" fallback,     */
/* because a made-up temperature next to a real place name is worse     */
/* than an honest blank.                                                */
/* ------------------------------------------------------------------ */

export interface LiveWeather {
  tempC: number;
  feelsLikeC: number;
  highC: number;
  lowC: number;
  windKph: number;
  /** WMO weather interpretation code. */
  code: number;
  description: string;
  icon: "sun" | "cloud" | "rain" | "snow" | "storm" | "fog";
  /** When the reading was taken, as reported by the API. */
  observedAt: string;
}

export type WeatherState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; weather: LiveWeather }
  | { status: "error"; message: string };

/** WMO code → what a person would call it. */
function describe(code: number): { text: string; icon: LiveWeather["icon"] } {
  if (code === 0) return { text: "Clear sky", icon: "sun" };
  if (code === 1) return { text: "Mostly clear", icon: "sun" };
  if (code === 2) return { text: "Partly cloudy", icon: "cloud" };
  if (code === 3) return { text: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { text: "Fog", icon: "fog" };
  if (code >= 51 && code <= 57) return { text: "Drizzle", icon: "rain" };
  if (code >= 61 && code <= 67) return { text: "Rain", icon: "rain" };
  if (code >= 71 && code <= 77) return { text: "Snow", icon: "snow" };
  if (code >= 80 && code <= 82) return { text: "Rain showers", icon: "rain" };
  if (code === 85 || code === 86) return { text: "Snow showers", icon: "snow" };
  if (code >= 95) return { text: "Thunderstorm", icon: "storm" };
  return { text: "Unsettled", icon: "cloud" };
}

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

/**
 * Readings are cached per rounded coordinate for ten minutes. Three cards can
 * ask for the same city without three round trips, and paging back to the
 * dashboard does not refetch.
 */
const cache = new Map<string, { at: number; weather: LiveWeather }>();
const TTL = 10 * 60 * 1000;

function keyFor(lat: number, lng: number) {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<LiveWeather> {
  const key = keyFor(lat, lng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.weather;

  const url =
    `${ENDPOINT}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=1`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);

  const body = (await response.json()) as {
    current?: Record<string, unknown>;
    daily?: Record<string, unknown[]>;
  };

  const current = body.current ?? {};
  const temp = readNumber(current.temperature_2m);
  const code = readNumber(current.weather_code);

  // Temperature and condition are the whole point of the card. Without both,
  // this is not a reading, it is a shape with holes in it.
  if (temp === null || code === null) {
    throw new Error("Weather service sent an incomplete reading");
  }

  const daily = body.daily ?? {};
  const high = readNumber(daily.temperature_2m_max?.[0]);
  const low = readNumber(daily.temperature_2m_min?.[0]);
  const { text, icon } = describe(code);

  const weather: LiveWeather = {
    tempC: Math.round(temp),
    feelsLikeC: Math.round(readNumber(current.apparent_temperature) ?? temp),
    highC: Math.round(high ?? temp),
    lowC: Math.round(low ?? temp),
    windKph: Math.round(readNumber(current.wind_speed_10m) ?? 0),
    code,
    description: text,
    icon,
    observedAt: typeof current.time === "string" ? current.time : "",
  };

  cache.set(key, { at: Date.now(), weather });
  return weather;
}

/* ------------------------------------------------------------------ */
/* Turning a city name into a coordinate                               */
/*                                                                     */
/* The profile stores a home city as text, because that is what people  */
/* know about themselves. Open-Meteo's geocoder turns it into a point,  */
/* free and keyless like the forecast itself.                          */
/* ------------------------------------------------------------------ */

export interface GeocodedPlace {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

const GEOCODER = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * Resolved cities are cached for the life of the page — including failures,
 * as null. A typo in a profile should cost one request, not one per render.
 */
const places = new Map<string, GeocodedPlace | null>();

export async function geocodeCity(
  city: string,
  signal?: AbortSignal,
): Promise<GeocodedPlace | null> {
  const query = city.trim();
  if (!query) return null;

  const key = query.toLowerCase();
  if (places.has(key)) return places.get(key) ?? null;

  const response = await fetch(
    `${GEOCODER}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
    { signal },
  );
  if (!response.ok) throw new Error(`Geocoder returned ${response.status}`);

  const body = (await response.json()) as {
    results?: { name?: string; country?: string; latitude?: number; longitude?: number }[];
  };
  const first = body.results?.[0];

  const place: GeocodedPlace | null =
    first && typeof first.latitude === "number" && typeof first.longitude === "number"
      ? {
          name: first.name ?? query,
          country: first.country ?? "",
          lat: first.latitude,
          lng: first.longitude,
        }
      : null;

  places.set(key, place);
  return place;
}

export type PlaceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; place: GeocodedPlace }
  | { status: "unknown" };

const PLACE_IDLE: PlaceState = { status: "idle" };
const PLACE_LOADING: PlaceState = { status: "loading" };
const PLACE_UNKNOWN: PlaceState = { status: "unknown" };

/** Look a city up by name. "unknown" covers both "no match" and "failed". */
export function useGeocodedCity(city: string | null | undefined): PlaceState {
  const query = (city ?? "").trim();
  const [result, setResult] = useState<{ key: string; state: PlaceState } | null>(
    null,
  );

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();

    geocodeCity(query, controller.signal)
      .then((place) =>
        setResult({
          key: query,
          state: place ? { status: "ready", place } : PLACE_UNKNOWN,
        }),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key: query, state: PLACE_UNKNOWN });
      });

    return () => controller.abort();
  }, [query]);

  if (!query) return PLACE_IDLE;
  return result?.key === query ? result.state : PLACE_LOADING;
}

/* ------------------------------------------------------------------ */
/* Conditions across a whole trip                                      */
/*                                                                     */
/* Packing needs the week someone is away, not the temperature right    */
/* now. Two sources, because no forecast reaches six months out:        */
/*                                                                     */
/*   · inside the 16-day horizon → the actual forecast                  */
/*   · beyond it → the same calendar dates last year, from the archive  */
/*                                                                     */
/* Which one answered is carried on the result and shown in the UI.     */
/* "23°C, rain on 2 days" means something quite different when it is a  */
/* forecast than when it is last year, and the user deserves to know    */
/* which they are looking at.                                           */
/* ------------------------------------------------------------------ */

export interface TripClimate {
  /** Coldest daily low across the trip. */
  minC: number;
  /** Warmest daily high across the trip. */
  maxC: number;
  /** Mean of the daily highs — the number that decides what you wear. */
  averageHighC: number;
  /** Days with meaningful rain (≥1mm). */
  rainDays: number;
  /** Days with any snowfall. */
  snowDays: number;
  daysCovered: number;
  source: "forecast" | "last-year";
}

const FORECAST_HORIZON_DAYS = 15;
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

const climateCache = new Map<string, { at: number; climate: TripClimate }>();

function shiftYear(iso: string, years: number): string {
  const [y, m, d] = iso.split("-");
  return `${Number(y) + years}-${m}-${d}`;
}

/**
 * Summarise a trip's weather. Throws when neither source can answer, which
 * the caller shows as "no forecast yet" rather than inventing a season.
 */
export async function fetchTripClimate(
  lat: number,
  lng: number,
  startIso: string,
  endIso: string,
  signal?: AbortSignal,
  today = new Date().toISOString().slice(0, 10),
): Promise<TripClimate> {
  const key = `${keyFor(lat, lng)}:${startIso}:${endIso}`;
  const hit = climateCache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.climate;

  const daysAway = Math.round(
    (Date.parse(`${startIso}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) /
      86_400_000,
  );

  // A trip that already ended, or one too far out, has to come from history.
  const useForecast = daysAway >= -1 && daysAway <= FORECAST_HORIZON_DAYS;

  const daily =
    "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum";

  const url = useForecast
    ? `${ENDPOINT}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=${daily}&timezone=auto&start_date=${startIso}&end_date=${endIso}`
    : `${ARCHIVE}?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=${daily}&timezone=auto` +
      `&start_date=${shiftYear(startIso, -1)}&end_date=${shiftYear(endIso, -1)}`;

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Weather service returned ${response.status}`);

  const body = (await response.json()) as { daily?: Record<string, unknown[]> };
  const highs = (body.daily?.temperature_2m_max ?? []).filter(
    (value): value is number => typeof value === "number",
  );
  const lows = (body.daily?.temperature_2m_min ?? []).filter(
    (value): value is number => typeof value === "number",
  );

  if (!highs.length || !lows.length) {
    throw new Error("No weather data for those dates");
  }

  const rain = (body.daily?.precipitation_sum ?? []).filter(
    (value): value is number => typeof value === "number",
  );
  const snow = (body.daily?.snowfall_sum ?? []).filter(
    (value): value is number => typeof value === "number",
  );

  const climate: TripClimate = {
    minC: Math.round(Math.min(...lows)),
    maxC: Math.round(Math.max(...highs)),
    averageHighC: Math.round(highs.reduce((sum, v) => sum + v, 0) / highs.length),
    rainDays: rain.filter((value) => value >= 1).length,
    snowDays: snow.filter((value) => value > 0).length,
    daysCovered: highs.length,
    source: useForecast ? "forecast" : "last-year",
  };

  climateCache.set(key, { at: Date.now(), climate });
  return climate;
}

export type ClimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; climate: TripClimate }
  | { status: "error" };

const CLIMATE_IDLE: ClimateState = { status: "idle" };
const CLIMATE_LOADING: ClimateState = { status: "loading" };

/** Trip-long conditions. Idle until there is both a place and a date range. */
export function useTripClimate(
  coordinates: { lat: number; lng: number } | null | undefined,
  startIso: string,
  endIso: string,
): ClimateState {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;
  const ready = lat !== null && lng !== null && Boolean(startIso);
  const key = ready ? `${keyFor(lat, lng)}:${startIso}:${endIso}` : null;

  const [result, setResult] = useState<{ key: string; state: ClimateState } | null>(
    null,
  );

  useEffect(() => {
    if (!key || lat === null || lng === null) return;

    const controller = new AbortController();
    fetchTripClimate(lat, lng, startIso, endIso || startIso, controller.signal)
      .then((climate) => setResult({ key, state: { status: "ready", climate } }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setResult({ key, state: { status: "error" } });
      });

    return () => controller.abort();
  }, [key, lat, lng, startIso, endIso]);

  if (!key) return CLIMATE_IDLE;
  return result?.key === key ? result.state : CLIMATE_LOADING;
}

/**
 * Live weather for a coordinate. Pass null to sit idle — used when there is
 * no current trip and therefore nowhere to report on.
 */
const IDLE: WeatherState = { status: "idle" };
const LOADING: WeatherState = { status: "loading" };

export function useWeather(
  coordinates: { lat: number; lng: number } | null | undefined,
): WeatherState {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;
  const key = lat === null || lng === null ? null : keyFor(lat, lng);

  /**
   * The result is stored *tagged with the coordinate it belongs to*. That is
   * what lets idle and loading be derived during render instead of written by
   * the effect — pointing the hook at a new place makes the old reading stop
   * matching, so it reads as loading immediately, with no cascading render
   * and no frame showing Tokyo's weather under Lisbon's name.
   */
  const [result, setResult] = useState<{ key: string; state: WeatherState } | null>(
    null,
  );

  useEffect(() => {
    if (key === null || lat === null || lng === null) return;

    const controller = new AbortController();

    fetchWeather(lat, lng, controller.signal)
      .then((weather) => setResult({ key, state: { status: "ready", weather } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          state: {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not reach the weather service",
          },
        });
      });

    return () => controller.abort();
  }, [key, lat, lng]);

  if (key === null) return IDLE;
  return result?.key === key ? result.state : LOADING;
}
