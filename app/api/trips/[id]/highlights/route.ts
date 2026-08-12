import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listTrips } from "@/lib/supabase/trips";
import { listPhotoDumps } from "@/lib/supabase/photo-dumps";
import { saveHighlight } from "@/lib/supabase/highlights";
import { buildHighlightStoryboard } from "@/lib/highlights-ai";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { PhotoDump } from "@/types/photo-dump";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function generateCombinedHighlight(supabase: SupabaseClient, user: User, id: string) {
  try {
    const trips = await listTrips(supabase).catch(() => []);
    if (!trips || trips.length === 0) return null;

    const dumpsByTrip: Record<string, PhotoDump[]> = {};
    await Promise.all(
      trips.map(async (trip) => {
        const dumps = await listPhotoDumps(supabase, trip.id, user.id).catch(() => []);
        if (dumps && dumps.length > 0) {
          dumpsByTrip[trip.id] = dumps;
        }
      })
    );

    const storyboard = await buildHighlightStoryboard(
      trips.map((t) => ({ id: t.id, title: t.title, country: t.country, days: t.days })),
      dumpsByTrip
    );

    if (!storyboard) return null;

    const highlight = await saveHighlight(supabase, id, storyboard).catch(() => null);
    return (
      highlight ?? {
        id,
        tripId: id,
        ...storyboard,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (err) {
    console.error("[highlights] generation failed:", err);
    return null;
  }
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireUser();

    if (!user || !supabase) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const highlight = await generateCombinedHighlight(supabase, user, id);
    return NextResponse.json({ highlight });
  } catch (err) {
    console.error("[highlights GET error]:", err);
    return NextResponse.json({ highlight: null });
  }
}

export async function POST(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { supabase, user } = await requireUser();

    if (!user || !supabase) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const highlight = await generateCombinedHighlight(supabase, user, id);
    if (!highlight) {
      return NextResponse.json(
        { error: "Post a photo dump first — a highlight needs at least one photo." },
        { status: 400 },
      );
    }

    return NextResponse.json({ highlight });
  } catch (err) {
    console.error("[highlights POST error]:", err);
    return NextResponse.json({ highlight: null });
  }
}
