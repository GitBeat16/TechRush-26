/**
 * Wanderly / TripNest Map System
 * Includes Google Maps & OpenStreetMap / Leaflet components
 */

// Google Maps Components
export { GoogleMapCard, CLAY_MAP_STYLES } from "./GoogleMapCard";
export type { GoogleMapCardProps } from "./GoogleMapCard";

export { MapMarker, createClayPinSvg } from "./MapMarker";
export type { MapMarkerProps, MapMarkerItem } from "./MapMarker";

export { MapLoader, ClayMapSkeleton, ClayMapError } from "./MapLoader";
export type { MapLoaderProps } from "./MapLoader";

// OpenStreetMap / Leaflet Components (Phase 3: Free & Zero API Key)
export { Map, LeafletMapSkeleton } from "./Map";
export { default as LeafletMapContainer } from "./LeafletMapContainer";
export type { LeafletMapContainerProps } from "./LeafletMapContainer";
export { TripNestMapSection } from "./TripNestMapSection";
export type { TripNestMapSectionProps } from "./TripNestMapSection";
