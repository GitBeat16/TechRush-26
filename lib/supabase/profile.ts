import type { SupabaseClient, User } from "@supabase/supabase-js";
import { DEFAULT_AVATAR_ID, avatarForSeed, isAvatarId } from "@/lib/avatars";
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
import type { ThemeId } from "@/types/theme";
import { isThemeId } from "@/lib/theme/themes";

/** Row shape of the public.profiles table. */
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
  theme: ThemeId | null;
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarId: row.avatar_id,
    homeCity: row.home_city ?? "",
    provider: row.provider,
    createdAt: (row.created_at ?? "").slice(0, 10),
    onboardingCompleted: Boolean(row.onboarding_completed),
    theme: isThemeId(row.theme) ? row.theme : null,
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

/**
 * The profile row for a signed-in auth user, creating it on first sight.
 *
 * Every entry point — email sign-up, email sign-in, the Google callback,
 * /api/auth/me — funnels through here, so a user can never end up
 * authenticated in auth.users but missing from public.profiles. That gap is
 * what left the app looping on the "taking you to sign in" splash.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<UserProfile | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (existing) return rowToProfile(existing);

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";

  const name =
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    email.split("@")[0] ||
    "Traveller";

  const avatarId = isAvatarId(metadata.avatar_id)
    ? metadata.avatar_id
    : avatarForSeed(user.id) || DEFAULT_AVATAR_ID;

  const provider: AuthProvider =
    user.app_metadata?.provider === "google" ? "google" : "email";

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        name,
        avatar_id: avatarId,
        home_city: typeof metadata.home_city === "string" ? metadata.home_city : "",
        provider,
        onboarding_completed: false,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single<ProfileRow>();

  if (error) {
    console.error("[profile] could not create row:", error.message);
    return null;
  }

  return rowToProfile(created);
}
