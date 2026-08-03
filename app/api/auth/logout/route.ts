import { NextResponse } from "next/server";
import { endSession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST() {
  await endSession();
  return NextResponse.json({ ok: true });
}
