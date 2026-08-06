import { NextResponse } from "next/server";
import { ensureProfile, rowToProfile, type ProfileRow } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import type {
  BudgetTier,
  DestinationType,
  TravelGroup,
  TravelStyle,
  TripDuration,
  WeatherPreference,
} from "@/types/auth";

export const runtime = "nodejs";

/* The allowed values, kept in step with types/auth.ts. Anything else is a
   client bug or a hand-rolled request, and is rejected rather than stored. */
const DESTINATIONS: DestinationType[] = [
  "beaches",
  "mountains",
  "heritage",
  "islands",
  "cities",
];
const WEATHER: WeatherPreference[] = ["hot", "snowy", "rainy"];
const BUDGETS: BudgetTier[] = ["budget", "mid-range", "luxury"];
const STYLES: TravelStyle[] = [
  "relaxation",
  "adventure",
  "cultural",
  "food",
  "nightlife",
];
const DURATIONS: TripDuration[] = [
  "weekend",
  "3-5-days",
  "one-week",
  "two-weeks-plus",
];
const GROUPS: TravelGroup[] = ["solo", "friends", "family", "partner"];

function pick<T extends string>(value: unknown, allowed: T[]): T | null {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : null;
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rawDestinations = Array.isArray(body.preferredDestinations)
    ? body.preferredDestinations
    : [];
  const preferredDestinations = Array.from(
    new Set(
      rawDestinations
        .map((value) => pick(value, DESTINATIONS))
        .filter((value): value is DestinationType => value !== null),
    ),
  );

  const preferredWeather = pick(body.preferredWeather, WEATHER);
  const budget = pick(body.budget, BUDGETS);
  const travelStyle = pick(body.travelStyle, STYLES);
  const tripDuration = pick(body.tripDuration, DURATIONS);
  const travelGroup = pick(body.travelGroup, GROUPS);

  if (preferredDestinations.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one kind of place you like" },
      { status: 400 },
    );
  }
  if (!preferredWeather || !budget || !travelStyle || !tripDuration || !travelGroup) {
    return NextResponse.json(
      { error: "Please answer every question before finishing" },
      { status: 400 },
    );
  }

  // A row must exist before we can update it — a Google user answering the
  // questionnaire on their very first visit might not have one yet.
  await ensureProfile(supabase, user);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      preferred_destinations: preferredDestinations,
      preferred_weather: preferredWeather,
      budget,
      travel_style: travelStyle,
      trip_duration: tripDuration,
      travel_group: travelGroup,
      onboarding_completed: true,
    })
    .eq("id", user.id)
    .select("*")
    .single<ProfileRow>();

  if (error || !data) {
    console.error("[onboarding] save failed:", error?.message);
    return NextResponse.json(
      { error: "Could not save your preferences" },
      { status: 500 },
    );
  }

  return NextResponse.json({ user: rowToProfile(data) });
}
