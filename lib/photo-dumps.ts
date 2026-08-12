"use client";

import { supabase } from "@/lib/supabase/client";
import { newId } from "@/lib/ids";
import type { NewPhotoDump, PhotoDump, PhotoDumpComment, PhotoDumpImage } from "@/types/photo-dump";

/* ------------------------------------------------------------------ */
/* Photo dumps — client side                                           */
/* ------------------------------------------------------------------ */

const BUCKET = "photo_dumps";

function slugify(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const ext = dot >= 0 ? filename.slice(dot) : "";
  return `${newId()}${ext.toLowerCase()}`;
}

/** Reads a File's pixel dimensions in-browser, without a network round trip. */
function readDimensions(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}

/** Fallback helper to convert a File into a compressed Data URL if Supabase Storage fails. */
function fileToDataUrlCompressed(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1400;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type || "image/jpeg", 0.85));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

export interface UploadProgress {
  done: number;
  total: number;
}

/** Uploads every file, in order, and returns their storage records. */
export async function uploadPhotoDumpImages(
  files: File[],
  userId: string,
  tripId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<PhotoDumpImage[]> {
  const images: PhotoDumpImage[] = [];

  for (const [index, file] of files.entries()) {
    const path = `${userId}/${tripId}/${slugify(file.name)}`;

    let uploadRes = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    // Handle "Bucket not found" error by attempting auto-creation
    if (
      uploadRes.error &&
      (uploadRes.error.message?.toLowerCase().includes("not found") ||
        uploadRes.error.message?.toLowerCase().includes("bucket"))
    ) {
      try {
        await supabase.storage.createBucket(BUCKET, { public: true });
        uploadRes = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });
      } catch {
        // Ignore bucket creation error, fallback below
      }
    }

    const dimensions = await readDimensions(file);

    if (!uploadRes.error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      images.push({ url: data.publicUrl, path, ...dimensions });
    } else {
      // Fallback to compressed Data URL if storage is unavailable or bucket not configured
      console.warn(`[photo-dumps] Supabase storage upload fallback (${uploadRes.error.message}). Using Data URL.`);
      const dataUrl = await fileToDataUrlCompressed(file);
      images.push({ url: dataUrl, path: `local/${path}`, ...dimensions });
    }

    onProgress?.({ done: index + 1, total: files.length });
  }

  return images;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export function fetchPhotoDumps(tripId: string): Promise<PhotoDump[]> {
  return api<{ dumps: PhotoDump[] }>(`/api/trips/${tripId}/photo-dumps`).then((r) => r.dumps);
}

export function createPhotoDump(tripId: string, input: NewPhotoDump): Promise<PhotoDump> {
  return api<{ dump: PhotoDump }>(`/api/trips/${tripId}/photo-dumps`, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((r) => r.dump);
}

export function deletePhotoDump(tripId: string, dumpId: string): Promise<void> {
  return api(`/api/trips/${tripId}/photo-dumps/${dumpId}`, { method: "DELETE" }).then(() => undefined);
}

export function togglePhotoDumpLike(
  tripId: string,
  dumpId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  return api(`/api/trips/${tripId}/photo-dumps/${dumpId}/likes`, { method: "POST" });
}

export function togglePhotoDumpSave(
  tripId: string,
  dumpId: string,
): Promise<{ saved: boolean }> {
  return api(`/api/trips/${tripId}/photo-dumps/${dumpId}/saves`, { method: "POST" });
}

export function addPhotoDumpComment(
  tripId: string,
  dumpId: string,
  body: string,
): Promise<PhotoDumpComment> {
  return api<{ comment: PhotoDumpComment }>(
    `/api/trips/${tripId}/photo-dumps/${dumpId}/comments`,
    { method: "POST", body: JSON.stringify({ body }) },
  ).then((r) => r.comment);
}
