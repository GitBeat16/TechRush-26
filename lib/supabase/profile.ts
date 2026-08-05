import type {
  AuthProvider,
  BudgetTier,
  DestinationType,
  TravelGroup,
  TravelStyle,
  TripDuration,
  UserProfile,
  WeatherPreference,
} from "@/types/auth";

/** Row shape of the public.profiles table (see supabase/migration*.sql). */
export interface ProfileRow {
  id: string;
  email: string;
  name: string;
  avatar_id: string;
  home_city: string;
  provider: AuthProvider;
  created_at: string;
  preferred_destinations: DestinationType[] | null;
  preferred_weather: WeatherPreference | null;
  budget: BudgetTier | null;
  travel_style: TravelStyle | null;
  trip_duration: TripDuration | null;
  travel_group: TravelGroup | null;
  onboarding_completed: boolean;
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarId: row.avatar_id,
    homeCity: row.home_city,
    provider: row.provider,
    createdAt: row.created_at,
    onboardingCompleted: row.onboarding_completed,
    preferences: {
      preferredDestinations: row.preferred_destinations ?? [],
      preferredWeather: row.preferred_weather,
      budget: row.budget,
      travelStyle: row.travel_style,
      tripDuration: row.trip_duration,
      travelGroup: row.travel_group,
    },
  };
}
