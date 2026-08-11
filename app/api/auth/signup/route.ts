import { NextResponse } from "next/server";
import { DEFAULT_AVATAR_ID, isAvatarId } from "@/lib/avatars";
import { resolveProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const avatarId = isAvatarId(body.avatarId) ? body.avatarId : DEFAULT_AVATAR_ID;
  const homeCity = String(body.homeCity ?? "").trim().slice(0, 60);

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your name", field: "name" },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "That email does not look right", field: "email" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Use at least 8 characters", field: "password" },
      { status: 400 },
    );
  }
  if (password.length > 200) {
    return NextResponse.json(
      { error: "That password is too long", field: "password" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, avatar_id: avatarId, home_city: homeCity } },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already registered") || message.includes("already exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists", field: "email" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message, field: "email" }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Could not create your account" },
      { status: 500 },
    );
  }

  // Email confirmation is switched on in the Supabase project, so there is no
  // session yet. Say so instead of pretending the user is signed in.
  if (!data.session) {
    return NextResponse.json(
      {
        error:
          "Almost there — confirm your email from the link we sent, then sign in.",
        field: "email",
      },
      { status: 400 },
    );
  }

  // A session exists from here on, so the response must report the user as
  // signed in even if the profiles row could not be written — see
  // resolveProfile for why an error here would loop the app.
  const { profile, degraded } = await resolveProfile(supabase, data.user);

  return NextResponse.json({ user: profile, degraded }, { status: 201 });
}
