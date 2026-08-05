import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  console.log("[callback] code exists:", !!code);

  if (!code) {
    console.log("[callback] no code");
    return NextResponse.redirect(`${origin}/login?error=google_failed`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("[callback] exchange error:", error);
  console.log("[callback] session:", !!data.session);
  console.log("[callback] user:", data.user?.email);

  return NextResponse.redirect(`${origin}/`);
}
