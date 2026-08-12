import type { HighlightSlide } from "@/types/highlights";
import type { PhotoDump } from "@/types/photo-dump";

export interface HighlightTripSource {
  id: string;
  title: string;
  country: string;
  days: number;
}

interface FlatPhoto {
  url: string;
  caption: string;
  location: string;
  dumpId: string;
}

/**
 * Selects 2-3 best photos from a trip's dumps.
 * If 1 photo -> use 1.
 * If 2 photos -> use both.
 * If 3 or more -> select best 2-3 avoiding duplicates.
 */
function selectBestPhotos(dumps: PhotoDump[]): FlatPhoto[] {
  const orderedDumps = [...dumps].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const photosByDump: Record<string, FlatPhoto[]> = {};

  for (const dump of orderedDumps) {
    if (!dump.images || dump.images.length === 0) continue;

    photosByDump[dump.id] = dump.images.map((img) => ({
      url: img.url,
      caption: dump.caption,
      location: dump.location,
      dumpId: dump.id,
    }));
  }

  const dumpIds = Object.keys(photosByDump);
  if (dumpIds.length === 0) return [];

  const allPhotos: FlatPhoto[] = [];
  for (const dumpId of dumpIds) {
    allPhotos.push(...photosByDump[dumpId]);
  }

  const uniquePhotos: FlatPhoto[] = [];
  const seenUrls = new Set<string>();
  for (const photo of allPhotos) {
    if (!seenUrls.has(photo.url)) {
      seenUrls.add(photo.url);
      uniquePhotos.push(photo);
    }
  }

  const total = uniquePhotos.length;
  if (total <= 3) {
    return uniquePhotos;
  }

  const selected: FlatPhoto[] = [];

  if (dumpIds.length >= 3) {
    const firstIdx = 0;
    const midIdx = Math.floor(dumpIds.length / 2);
    const lastIdx = dumpIds.length - 1;

    const chosenDumps = [dumpIds[firstIdx], dumpIds[midIdx], dumpIds[lastIdx]];
    for (const dId of chosenDumps) {
      const photos = photosByDump[dId];
      if (photos && photos.length > 0) {
        selected.push(photos[0]);
      }
    }
  } else if (dumpIds.length === 2) {
    const d1 = dumpIds[0];
    const d2 = dumpIds[1];
    const p1 = photosByDump[d1];
    const p2 = photosByDump[d2];

    if (p1.length >= p2.length) {
      selected.push(p1[0]);
      if (p1.length > 1) selected.push(p1[p1.length - 1]);
      selected.push(p2[0]);
    } else {
      selected.push(p1[0]);
      selected.push(p2[0]);
      if (p2.length > 1) selected.push(p2[p2.length - 1]);
    }
  } else {
    const photos = photosByDump[dumpIds[0]];
    selected.push(photos[0]);
    selected.push(photos[Math.floor(photos.length / 2)]);
    selected.push(photos[photos.length - 1]);
  }

  return selected.sort((a, b) => {
    const idxA = uniquePhotos.findIndex((p) => p.url === a.url);
    const idxB = uniquePhotos.findIndex((p) => p.url === b.url);
    return idxA - idxB;
  });
}

/**
 * Builds a combined highlight storyboard from all trips and their dumps.
 */
export async function buildHighlightStoryboard(
  trips: HighlightTripSource[],
  dumpsByTrip: Record<string, PhotoDump[]>,
): Promise<{ title: string; subtitle: string; slides: HighlightSlide[] } | null> {
  const slides: HighlightSlide[] = [];

  slides.push({
    type: "intro",
    text: "YOUR TRAVEL MEMORIES",
    duration: 2.2,
  });

  let totalMemoriesCount = 0;
  let activeAlbumsCount = 0;

  const chronologicalTrips = [...trips].reverse();

  for (const trip of chronologicalTrips) {
    const dumps = dumpsByTrip[trip.id] || [];
    if (dumps.length === 0) continue;

    const selections = selectBestPhotos(dumps);
    if (selections.length === 0) continue;

    activeAlbumsCount++;
    totalMemoriesCount += selections.length;

    const details = `${trip.days} day${trip.days === 1 ? "" : "s"} • ${trip.country}`;

    slides.push({
      type: "location",
      text: trip.title.toUpperCase(),
      albumName: trip.title,
      albumDetails: details,
      duration: 2.0,
    });

    for (const photo of selections) {
      slides.push({
        type: "photo",
        photoUrl: photo.url,
        text: photo.caption || photo.location || "",
        albumName: trip.title,
        albumDetails: details,
        duration: 2.6,
      });
    }
  }

  if (totalMemoriesCount === 0) {
    return null;
  }

  slides.push({
    type: "ending",
    text: "See you on the next adventure ✈️",
    duration: 2.8,
  });

  const subtitle =
    activeAlbumsCount === 1
      ? `1 trip • ${totalMemoriesCount} memories`
      : `${activeAlbumsCount} trips • ${totalMemoriesCount} selected memories`;

  return {
    title: "Your Travel Memories",
    subtitle,
    slides,
  };
}
