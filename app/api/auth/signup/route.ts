import { NextResponse } from "next/server";
import { startSession } from "@/lib/server/session";
import { createEmailUser, findByEmail, toProfile } from "@/lib/server/users";

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
  const avatarId = typeof body.avatarId === "string" ? body.avatarId : undefined;
  const homeCity = typeof body.homeCity === "string" ? body.homeCity : "";

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

  if (await findByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists", field: "email" },
      { status: 409 },
    );
  }

  const user = await createEmailUser({ name, email, password, avatarId, homeCity });
  await startSession(user.id);

  return NextResponse.json({ user: toProfile(user) }, { status: 201 });
}
