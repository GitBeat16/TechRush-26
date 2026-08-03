import { NextResponse } from "next/server";
import { isAvatarId } from "@/lib/avatars";
import { currentUser } from "@/lib/server/session";
import { toProfile, updateUser } from "@/lib/server/users";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: { name?: string; avatarId?: string; homeCity?: string } = {};

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
    patch.homeCity = String(body.homeCity).slice(0, 60);
  }

  if (body.avatarId !== undefined) {
    if (!isAvatarId(body.avatarId)) {
      return NextResponse.json({ error: "Unknown avatar" }, { status: 400 });
    }
    patch.avatarId = body.avatarId;
  }

  const updated = await updateUser(user.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ user: toProfile(updated) });
}
