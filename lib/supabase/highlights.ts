import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { HighlightSlide, TripHighlight } from "@/types/highlights";

/* ------------------------------------------------------------------ */
/* Trip highlight persistence                                          */
/* ------------------------------------------------------------------ */

export interface TripHighlightRow {
  trip_id: string;
  title: string;
  subtitle: string;
  slides: HighlightSlide[] | null;
  created_at: string;
}

export interface HighlightStoryboard {
  title: string;
  subtitle: string;
  slides: HighlightSlide[];
}

function rowToHighlight(row: TripHighlightRow): TripHighlight {
  return {
    id: row.trip_id,
    tripId: row.trip_id,
    title: row.title,
    subtitle: row.subtitle,
    slides: row.slides ?? [],
    generatedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

/** The stored highlight for a trip, or null when none has been generated yet. */
export async function getHighlight(
  supabase: SupabaseClient,
  tripId: string,
): Promise<TripHighlight | null> {
  const { data, error } = await supabase
    .from("trip_highlights")
    .select("*")
    .eq("trip_id", tripId)
    .maybeSingle<TripHighlightRow>();

  if (error || !data) {
    if (error) console.error("[highlights] read failed:", error.message);
    return null;
  }

  return rowToHighlight(data);
}

/** Upserts the generated storyboard for a trip and returns the stored row. */
export async function saveHighlight(
  supabase: SupabaseClient,
  tripId: string,
  storyboard: HighlightStoryboard,
): Promise<TripHighlight | null> {
  const { data, error } = await supabase
    .from("trip_highlights")
    .upsert(
      {
        trip_id: tripId,
        title: storyboard.title,
        subtitle: storyboard.subtitle,
        slides: storyboard.slides,
        created_at: new Date().toISOString(),
      },
      { onConflict: "trip_id" },
    )
    .select("*")
    .single<TripHighlightRow>();

  if (error || !data) {
    console.error("[highlights] save failed:", error?.message);
    return null;
  }

  return rowToHighlight(data);
}

export async function deleteHighlight(
  supabase: SupabaseClient,
  tripId: string,
): Promise<boolean> {
  const { error } = await supabase.from("trip_highlights").delete().eq("trip_id", tripId);
  if (error) {
    console.error("[highlights] delete failed:", error.message);
    return false;
  }
  return true;
}
