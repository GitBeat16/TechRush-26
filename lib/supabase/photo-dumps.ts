import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NewPhotoDump,
  PhotoDump,
  PhotoDumpComment,
  PhotoDumpImage,
} from "@/types/photo-dump";

/* ------------------------------------------------------------------ */
/* Photo dump persistence                                              */
/* ------------------------------------------------------------------ */

export interface PhotoDumpRow {
  id: string;
  trip_id: string;
  owner_id: string;
  owner_name: string;
  owner_avatar_id: string | null;
  caption: string;
  location: string;
  taken_on: string;
  tags: string[] | null;
  images: PhotoDumpImage[] | null;
  created_at: string;
}

export interface CommentRow {
  id: string;
  dump_id: string;
  user_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

function rowToComment(row: CommentRow): PhotoDumpComment {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function rowToDump(
  supabase: SupabaseClient,
  row: PhotoDumpRow,
  likeCount: number,
  likedByMe: boolean,
  savedByMe: boolean,
  comments: CommentRow[],
): PhotoDump {
  const imagesWithUrls = (row.images ?? []).map((img) => {
    if (img.url) return img;
    if (img.path.startsWith("local/")) return img; // already fallback or broken
    
    // Attempt to hydrate url from path
    const { data } = supabase.storage.from("photo_dumps").getPublicUrl(img.path);
    return { ...img, url: data.publicUrl };
  });

  return {
    id: row.id,
    tripId: row.trip_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerAvatarId: row.owner_avatar_id ?? undefined,
    images: imagesWithUrls,
    caption: row.caption,
    location: row.location,
    takenOn: row.taken_on,
    tags: row.tags ?? [],
    likeCount,
    likedByMe,
    savedByMe,
    comments: comments
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(rowToComment),
    createdAt: row.created_at,
  };
}

/** Every memory posted to a trip, newest first, with the viewer's like/save state. */
export async function listPhotoDumps(
  supabase: SupabaseClient,
  tripId: string,
  viewerId: string,
): Promise<PhotoDump[]> {
  const { data: dumps, error } = await supabase
    .from("photo_dumps")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .returns<PhotoDumpRow[]>();

  if (error || !dumps?.length) {
    if (error) console.error("[photo-dumps] list failed:", error.message);
    return [];
  }

  const ids = dumps.map((dump) => dump.id);

  const [likes, saves, comments] = await Promise.all([
    supabase
      .from("photo_dump_likes")
      .select("dump_id, user_id")
      .in("dump_id", ids)
      .returns<{ dump_id: string; user_id: string }[]>(),
    supabase
      .from("photo_dump_saves")
      .select("dump_id")
      .eq("user_id", viewerId)
      .in("dump_id", ids)
      .returns<{ dump_id: string }[]>(),
    supabase
      .from("photo_dump_comments")
      .select("*")
      .in("dump_id", ids)
      .returns<CommentRow[]>(),
  ]);

  const likeCounts = new Map<string, number>();
  const likedByViewer = new Set<string>();
  (likes.data ?? []).forEach((row) => {
    likeCounts.set(row.dump_id, (likeCounts.get(row.dump_id) ?? 0) + 1);
    if (row.user_id === viewerId) likedByViewer.add(row.dump_id);
  });

  const savedByViewer = new Set((saves.data ?? []).map((row) => row.dump_id));

  return dumps.map((dump) =>
    rowToDump(
      supabase,
      dump,
      likeCounts.get(dump.id) ?? 0,
      likedByViewer.has(dump.id),
      savedByViewer.has(dump.id),
      (comments.data ?? []).filter((row) => row.dump_id === dump.id),
    ),
  );
}

export async function createPhotoDump(
  supabase: SupabaseClient,
  tripId: string,
  owner: { id: string; name: string; avatarId?: string },
  input: NewPhotoDump,
): Promise<PhotoDump | null> {
  // Ensure the parent trip exists in `trips` table to avoid foreign key errors
  const { data: existingTrip } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .maybeSingle();

  if (!existingTrip) {
    await supabase
      .from("trips")
      .upsert(
        {
          id: tripId,
          owner_id: owner.id,
          title: "Japan Adventure",
          country: "Japan",
          destination_id: "japan",
          summary: "Travel memory trip",
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date().toISOString().slice(0, 10),
          days: 7,
          budget: 0,
          currency: "INR",
          tone: "sky",
          status: "planning",
        },
        { onConflict: "id" },
      )
      .catch(() => undefined);
  }

  const { data, error } = await supabase
    .from("photo_dumps")
    .insert({
      trip_id: tripId,
      owner_id: owner.id,
      owner_name: owner.name,
      owner_avatar_id: owner.avatarId ?? null,
      caption: input.caption.trim(),
      location: input.location.trim(),
      taken_on: input.takenOn,
      tags: input.tags,
      images: input.images,
    })
    .select("*")
    .single<PhotoDumpRow>();

  if (error || !data) {
    console.error("[photo-dumps] create failed:", error?.message);
    return null;
  }

  return rowToDump(supabase, data, 0, false, false, []);
}

/** Deletes the row and returns the storage paths that should be removed with it. */
export async function deletePhotoDump(
  supabase: SupabaseClient,
  dumpId: string,
): Promise<string[] | null> {
  const { data: existing } = await supabase
    .from("photo_dumps")
    .select("images")
    .eq("id", dumpId)
    .maybeSingle<{ images: PhotoDumpImage[] | null }>();

  const { error } = await supabase.from("photo_dumps").delete().eq("id", dumpId);
  if (error) {
    console.error("[photo-dumps] delete failed:", error.message);
    return null;
  }

  return (existing?.images ?? []).map((image) => image.path);
}

/** Toggles the viewer's like and returns the new state. */
export async function toggleLike(
  supabase: SupabaseClient,
  dumpId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  const { data: existing } = await supabase
    .from("photo_dump_likes")
    .select("dump_id")
    .eq("dump_id", dumpId)
    .eq("user_id", userId)
    .maybeSingle();

  const toggleError = existing
    ? (await supabase.from("photo_dump_likes").delete().eq("dump_id", dumpId).eq("user_id", userId))
        .error
    : (await supabase.from("photo_dump_likes").insert({ dump_id: dumpId, user_id: userId })).error;

  if (toggleError) {
    console.error("[photo-dumps] like toggle failed:", toggleError.message);
    return null;
  }

  const { count } = await supabase
    .from("photo_dump_likes")
    .select("*", { count: "exact", head: true })
    .eq("dump_id", dumpId);

  return { liked: !existing, likeCount: count ?? 0 };
}

/** Toggles the viewer's save and returns the new state. */
export async function toggleSave(
  supabase: SupabaseClient,
  dumpId: string,
  userId: string,
): Promise<{ saved: boolean } | null> {
  const { data: existing } = await supabase
    .from("photo_dump_saves")
    .select("dump_id")
    .eq("dump_id", dumpId)
    .eq("user_id", userId)
    .maybeSingle();

  const toggleError = existing
    ? (await supabase.from("photo_dump_saves").delete().eq("dump_id", dumpId).eq("user_id", userId))
        .error
    : (await supabase.from("photo_dump_saves").insert({ dump_id: dumpId, user_id: userId })).error;

  if (toggleError) {
    console.error("[photo-dumps] save toggle failed:", toggleError.message);
    return null;
  }

  return { saved: !existing };
}

export async function addComment(
  supabase: SupabaseClient,
  dumpId: string,
  author: { id: string; name: string },
  body: string,
): Promise<PhotoDumpComment | null> {
  const trimmed = body.trim().slice(0, 500);
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("photo_dump_comments")
    .insert({
      dump_id: dumpId,
      user_id: author.id,
      author_name: author.name,
      body: trimmed,
    })
    .select("*")
    .single<CommentRow>();

  if (error || !data) {
    console.error("[photo-dumps] comment failed:", error?.message);
    return null;
  }

  return rowToComment(data);
}

export async function deleteComment(
  supabase: SupabaseClient,
  commentId: string,
): Promise<boolean> {
  const { error } = await supabase.from("photo_dump_comments").delete().eq("id", commentId);
  if (error) {
    console.error("[photo-dumps] comment delete failed:", error.message);
    return false;
  }
  return true;
}
