"use client";

import type { TripHighlight } from "@/types/highlights";

/* ------------------------------------------------------------------ */
/* Trip highlights — client side                                       */
/* ------------------------------------------------------------------ */

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

/** Reads the stored (or freshly generated) highlight for a trip. */
export function fetchHighlight(tripId: string): Promise<TripHighlight | null> {
  return api<{ highlight: TripHighlight | null }>(`/api/trips/${tripId}/highlights`).then(
    (r) => r.highlight ?? null,
  );
}

/** Forces a regeneration of the trip's highlight reel from its photo dumps. */
export function generateHighlight(tripId: string): Promise<TripHighlight | null> {
  return api<{ highlight: TripHighlight | null }>(`/api/trips/${tripId}/highlights`, {
    method: "POST",
  }).then((r) => r.highlight ?? null);
}
