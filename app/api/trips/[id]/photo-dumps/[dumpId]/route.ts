import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deletePhotoDump } from "@/lib/supabase/photo-dumps";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; dumpId: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { dumpId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const paths = await deletePhotoDump(supabase, dumpId);
  if (paths === null) {
    return NextResponse.json({ error: "Could not delete that" }, { status: 500 });
  }

  const storagePaths = paths.filter((p) => p && !p.startsWith("local/"));
  if (storagePaths.length) {
    const { error } = await supabase.storage.from("photo-dumps").remove(storagePaths);
    if (error) console.error("[photo-dumps] storage cleanup failed:", error.message);
  }

  return NextResponse.json({ ok: true });
}
