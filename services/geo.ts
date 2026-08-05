import type { NearbyPlace } from "@/types/assistant";

/**
 * Server-only. Finds real nearby attractions via OpenStreetMap's Overpass
 * API — free, no key required, unlike Google Places. Never import this
 * from a client component (fine here since it has no secrets, but keeps
 * the network call off the client bundle).
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const REQUEST_TIMEOUT_MS = 8000;
const RADIUS_METERS = 4000;

interface OverpassElement {
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function categoryFor(tags: Record<string, string>): string {
  if (tags.tourism) return tags.tourism.replace(/_/g, " ");
  if (tags.historic) return "historic site";
  if (tags.leisure) return tags.leisure.replace(/_/g, " ");
  return "attraction";
}

/** Real nearby attractions for the given coordinates, nearest first. Returns [] on any failure. */
export async function fetchNearbyPlaces(lat: number, lng: number): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:10];(
    node["tourism"~"attraction|museum|viewpoint|gallery|zoo|theme_park|artwork"](around:${RADIUS_METERS},${lat},${lng});
    node["historic"](around:${RADIUS_METERS},${lat},${lng});
    node["leisure"="park"](around:${RADIUS_METERS},${lat},${lng});
  );out body 25;`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const elements = payload.elements ?? [];

    return elements
      .filter((el): el is Required<Pick<OverpassElement, "lat" | "lon">> & OverpassElement =>
        typeof el.lat === "number" && typeof el.lon === "number" && Boolean(el.tags?.name),
      )
      .map((el) => ({
        name: el.tags!.name,
        category: categoryFor(el.tags!),
        distanceKm: Math.round(haversineKm(lat, lng, el.lat!, el.lon!) * 10) / 10,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 8);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
