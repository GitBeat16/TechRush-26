export type HighlightSlideType = "intro" | "photo" | "location" | "ending";

export interface HighlightSlide {
  type: HighlightSlideType;
  /** Shown on intro/location/ending slides. */
  text?: string;
  /** Shown on photo slides — a real URL from one of the trip's photo dumps. */
  photoUrl?: string;
  /** Seconds to hold this slide before auto-advancing. */
  duration: number;
  /** Name of the album/trip the photo comes from. */
  albumName?: string;
  /** Duration/location details of the album/trip. */
  albumDetails?: string;
}

export interface TripHighlight {
  tripId: string;
  title: string;
  subtitle: string;
  slides: HighlightSlide[];
  generatedAt: string;
}
