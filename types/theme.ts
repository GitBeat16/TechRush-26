/**
 * Theme identity for Wanderly.
 *
 * A theme is a full palette swap plus an ambient weather layer. Which one a
 * user gets is derived from their onboarding weather answer the first time,
 * and can be overridden by hand from /profile after that.
 */

import type { WeatherPreference } from "@/types/auth";

export type ThemeId = "clay" | "sunny" | "snowy" | "rainy";

/** The ambient animation each theme paints behind the app. */
export type AmbienceKind = "none" | "sun" | "snow" | "rain";

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  hint: string;
  ambience: AmbienceKind;
  /** Three swatch colours for the picker chip, light → dark. */
  swatch: [string, string, string];
  /** Which onboarding weather answer selects this theme, if any. */
  weather: WeatherPreference | null;
}
