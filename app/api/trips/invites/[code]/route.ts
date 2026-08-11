import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeInvite } from "@/lib/supabase/invites";
import { normaliseInviteCode } from "@/types/invite";

export const runtime = "nodejs";

/**
 * Turns a code off. Ownership is enforced by the RLS policy on the update,
 * so someone else's code simply matches no rows.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const ok = await revokeInvite(supabase, normaliseInviteCode(code));
  if (!ok) {
    return NextResponse.json({ error: "Could not revoke that code" }, { status: 400 });
  }

  return NextResponse.json({ revoked: true });
}
