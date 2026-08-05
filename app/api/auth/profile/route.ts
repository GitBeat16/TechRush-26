import { NextResponse } from "next/server";
import { isAvatarId } from "@/lib/avatars";
import { ensureProfile, rowToProfile, type ProfileRow } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  const patch: { name?: string; avatar_id?: string; home_city?: string } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your name", field: "name" },
        { status: 400 },
      );
    }
    if (name.length > 60) {
      return NextResponse.json(
        { error: "That name is a bit long", field: "name" },
        { status: 400 },
      );
    }
    patch.name = name;
  }

  if (body.homeCity !== undefined) {
    patch.home_city = String(body.homeCity).trim().slice(0, 60);
  }

  if (body.avatarId !== undefined) {
    if (!isAvatarId(body.avatarId)) {
      return NextResponse.json({ error: "Unknown avatar" }, { status: 400 });
    }
    patch.avatar_id = body.avatarId;
  }

  const current = await ensureProfile(supabase, user);
  if (!current) {
    return NextResponse.json({ error: "Could not load your profile" }, { status: 500 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ user: current });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single<ProfileRow>();

  if (error || !data) {
    console.error("[profile] save failed:", error?.message);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ user: rowToProfile(data) });
}
