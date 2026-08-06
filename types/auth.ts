import type { ThemeId } from "@/types/theme";

export type AuthProvider = "email" | "google";

export type DestinationType = "beaches" | "mountains" | "heritage" | "islands" | "cities";
export type WeatherPreference = "hot" | "snowy" | "rainy";
export type BudgetTier = "budget" | "mid-range" | "luxury";
export type TravelStyle = "relaxation" | "adventure" | "cultural" | "food" | "nightlife";
export type TripDuration = "weekend" | "3-5-days" | "one-week" | "two-weeks-plus";
export type TravelGroup = "solo" | "friends" | "family" | "partner";

export interface TravelPreferences {
  preferredDestinations: DestinationType[];
  preferredWeather: WeatherPreference | null;
  budget: BudgetTier | null;
  travelStyle: TravelStyle | null;
  tripDuration: TripDuration | null;
  travelGroup: TravelGroup | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarId: string;
  homeCity: string;
  provider: AuthProvider;
  createdAt: string;
  onboardingCompleted: boolean;
  preferences: TravelPreferences;
  /**
   * An explicit theme override. null means "follow my weather answer",
   * which is what every user starts out as.
   */
  theme: ThemeId | null;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthSnapshot {
  status: AuthStatus;
  user: UserProfile | null;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  avatarId: string;
  homeCity?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface ProfilePatch {
  name?: string;
  avatarId?: string;
  homeCity?: string;
  /** Pass null to clear the override and fall back to the weather answer. */
  theme?: ThemeId | null;
}

export interface OnboardingInput {
  preferredDestinations: DestinationType[];
  preferredWeather: WeatherPreference;
  budget: BudgetTier;
  travelStyle: TravelStyle;
  tripDuration: TripDuration;
  travelGroup: TravelGroup;
}

/** A demo identity offered by the simulated Google chooser. */
export interface GoogleDemoAccount {
  email: string;
  name: string;
  avatarId: string;
  homeCity: string;
}
