import type { WeatherPreference } from "@/types/auth";
import type { ThemeDefinition, ThemeId } from "@/types/theme";

/**
 * The four themes. The colours themselves live in app/globals.css under
 * `html[data-theme="…"]` — this file is the metadata the UI needs to talk
 * about them (labels, swatches, which weather answer picks them).
 */
export const THEMES: Record<ThemeId, ThemeDefinition> = {
  clay: {
    id: "clay",
    label: "Original",
    hint: "Luxury editorial travel palette",
    ambience: "none",
    swatch: ["#F5F2EA", "#526B60", "#263B35"],
    weather: null,
  },
  sunny: {
    id: "sunny",
    label: "Hot and sunny",
    hint: "Golden hour, everywhere",
    ambience: "sun",
    swatch: ["#fbeadb", "#ffd9a8", "#f59433"],
    weather: "hot",
  },
  snowy: {
    id: "snowy",
    label: "Cold and snowy",
    hint: "Fresh powder and blue light",
    ambience: "snow",
    swatch: ["#e8eef6", "#cfe0f7", "#6f95d6"],
    weather: "snowy",
  },
  rainy: {
    id: "rainy",
    label: "Cool and rainy",
    hint: "Green hills and petrichor",
    ambience: "rain",
    swatch: ["#e6eee6", "#c8e8d2", "#62b58c"],
    weather: "rainy",
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const DEFAULT_THEME: ThemeId = "clay";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES;
}

/** The theme a weather answer implies. Used the first time a user onboards. */
export function themeForWeather(
  weather: WeatherPreference | null | undefined,
): ThemeId {
  switch (weather) {
    case "hot":
      return "sunny";
    case "snowy":
      return "snowy";
    case "rainy":
      return "rainy";
    default:
      return DEFAULT_THEME;
  }
}

/**
 * The theme actually applied: an explicit choice wins, otherwise the one the
 * questionnaire implied, otherwise plain clay.
 */
export function resolveTheme(
  explicit: ThemeId | null | undefined,
  weather: WeatherPreference | null | undefined,
): ThemeId {
  return isThemeId(explicit) ? explicit : themeForWeather(weather);
}
