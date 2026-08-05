import type { WeatherWidget } from "@/types/assistant";

/**
 * Server-only. Real current weather via Open-Meteo — free, no key
 * required, unlike OpenWeather. Two calls: geocode the place name, then
 * fetch current conditions for those coordinates.
 */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 8000;

// WMO weather codes, condensed to the ranges Open-Meteo actually returns.
const CONDITIONS: [max: number, label: string][] = [
  [0, "clear sky"],
  [1, "mostly clear"],
  [2, "partly cloudy"],
  [3, "overcast"],
  [48, "foggy"],
  [55, "drizzle"],
  [67, "rain"],
  [77, "snow"],
  [82, "rain showers"],
  [86, "snow showers"],
  [99, "thunderstorms"],
];

function conditionFor(code: number): string {
  return CONDITIONS.find(([max]) => code <= max)?.[1] ?? "mixed conditions";
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

/** Real current weather for a place name. Returns null if the place can't be found or a call fails. */
export async function fetchWeatherFor(locationName: string): Promise<WeatherWidget | null> {
  try {
    const geo = await withTimeout((signal) =>
      fetch(`${GEOCODE_URL}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`, {
        signal,
      }),
    );
    if (!geo.ok) return null;

    const geoPayload = (await geo.json()) as {
      results?: { latitude: number; longitude: number; name: string }[];
    };
    const place = geoPayload.results?.[0];
    if (!place) return null;

    const forecast = await withTimeout((signal) =>
      fetch(
        `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
          `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m`,
        { signal },
      ),
    );
    if (!forecast.ok) return null;

    const forecastPayload = (await forecast.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };
    const current = forecastPayload.current;
    if (!current || typeof current.temperature_2m !== "number") return null;

    return {
      kind: "weather",
      location: place.name,
      tempC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature ?? current.temperature_2m),
      condition: conditionFor(current.weather_code ?? 0),
      windKph: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}
