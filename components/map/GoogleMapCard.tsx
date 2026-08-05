"use client";

import React, { type ReactNode, useCallback, useRef, useState, useMemo } from "react";
import { GoogleMap } from "@react-google-maps/api";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";
import { MapLoader } from "./MapLoader";
import { MapMarker, type MapMarkerProps, type MapMarkerItem } from "./MapMarker";

/**
 * Custom Google Maps styles tailored to match Wanderly's Claymorphism palette
 * (Soft cream/tan land, muted pastel sky blue water, soft rounded roads).
 */
export const CLAY_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: "geometry",
    stylers: [{ color: "#fbf4ec" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c6558" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#fffdfa" }, { weight: 3 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a3a30" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#ece0d4" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c6558" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#bfe9d5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a3a30" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#fffdfa" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e9dcce" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c6558" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#ffd7b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#f9b384" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#dcd2fb" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c3dcfb" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a3a30" }],
  },
];

type Depth = "sm" | "md" | "lg";
type Radius = "sm" | "md" | "lg" | "xl";

const DEPTH: Record<Depth, string> = {
  sm: "shadow-clay-sm",
  md: "shadow-clay",
  lg: "shadow-clay-lg",
};

const RADIUS: Record<Radius, string> = {
  sm: "rounded-clay-sm",
  md: "rounded-clay",
  lg: "rounded-clay-lg",
  xl: "rounded-clay-xl",
};

export interface GoogleMapCardProps {
  /** Initial map center coordinates */
  center?: { lat: number; lng: number };
  /** Initial zoom level (defaults to 12) */
  zoom?: number;
  /** Array of marker objects to render on the map */
  markers?: MapMarkerProps[];
  /** Optional React children (e.g. custom <MapMarker /> elements or overlays) */
  children?: ReactNode;
  /** Clay tone for the outer card border / header accent */
  tone?: ClayTone;
  /** Clay shadow depth */
  depth?: Depth;
  /** Clay border radius matching Wanderly's design system */
  radius?: Radius;
  /** Height of the map container (e.g. "400px", "100%", "50vh") */
  height?: string | number;
  /** Width of the map container (defaults to "100%") */
  width?: string | number;
  /** Card header title */
  title?: string;
  /** Card header subtitle */
  subtitle?: string;
  /** Custom Google Maps Options */
  options?: google.maps.MapOptions;
  /** Map load callback */
  onMapLoad?: (map: google.maps.Map) => void;
  /** Map click callback */
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  /** Callback fired when a marker is clicked/selected */
  onMarkerSelect?: (marker: MapMarkerItem | null) => void;
  /** ID of the currently selected marker */
  selectedMarkerId?: string | number;
  /** API key override if not using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY */
  apiKey?: string;
  /** Whether GoogleMapCard should manage script loading via MapLoader (defaults to true) */
  loadScript?: boolean;
  /** Extra container CSS classes */
  className?: string;
  /** Extra map inner wrapper CSS classes */
  mapContainerClassName?: string;
}

const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 }; // Paris default

/**
 * Inner map renderer component used inside MapLoader or standalone.
 */
function MapInner({
  center = DEFAULT_CENTER,
  zoom = 12,
  markers = [],
  children,
  tone = "surface",
  depth = "md",
  radius = "lg",
  height = "400px",
  width = "100%",
  title,
  subtitle,
  options,
  onMapLoad,
  onMapClick,
  onMarkerSelect,
  selectedMarkerId,
  className = "",
  mapContainerClassName = "",
}: Omit<GoogleMapCardProps, "apiKey" | "loadScript">) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | number | undefined>(
    selectedMarkerId
  );

  const toneStyle = TONES[tone] || TONES.surface;

  const mergedOptions: google.maps.MapOptions = useMemo(
    () => ({
      styles: CLAY_MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      ...options,
    }),
    [options]
  );

  const containerStyle = useMemo(
    () => ({
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
    }),
    [width, height]
  );

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (onMapLoad) {
        onMapLoad(map);
      }
    },
    [onMapLoad]
  );

  const handleMarkerClick = useCallback(
    (marker: MapMarkerItem) => {
      if (marker.id !== undefined) {
        setActiveMarkerId(marker.id);
      }
      if (onMarkerSelect) {
        onMarkerSelect(marker);
      }
    },
    [onMarkerSelect]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      setActiveMarkerId(undefined);
      if (onMarkerSelect) {
        onMarkerSelect(null);
      }
      if (onMapClick) {
        onMapClick(e);
      }
    },
    [onMapClick, onMarkerSelect]
  );

  return (
    <div
      className={[
        toneStyle.bg,
        toneStyle.text,
        DEPTH[depth],
        RADIUS[radius],
        "relative overflow-hidden border-4 border-white/80 p-3 sm:p-4 transition-shadow duration-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Optional Clay Card Header */}
      {(title || subtitle) && (
        <div className="mb-3 px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            {title && (
              <h3 className="font-display font-bold text-lg text-clay-ink tracking-wide">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-body text-xs text-clay-ink-soft">
                {subtitle}
              </p>
            )}
          </div>
          {markers.length > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/70 shadow-clay-xs text-clay-ink w-fit">
              {markers.length} {markers.length === 1 ? "Location" : "Locations"}
            </span>
          )}
        </div>
      )}

      {/* Map Surface Container */}
      <div
        className={[
          "relative overflow-hidden shadow-clay-inset rounded-clay-sm border-2 border-white/60",
          mapContainerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        style={containerStyle}
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={zoom}
          options={mergedOptions}
          onLoad={handleLoad}
          onClick={handleMapClick}
        >
          {/* Render markers passed via props */}
          {markers.map((marker, index) => {
            const markerKey = marker.id ?? `marker-${index}`;
            const isSelected =
              activeMarkerId !== undefined && activeMarkerId === marker.id;

            return (
              <MapMarker
                key={markerKey}
                {...marker}
                isOpen={isSelected || marker.isOpen}
                onClick={(m) => {
                  handleMarkerClick(m);
                  if (marker.onClick) {
                    marker.onClick(m);
                  }
                }}
              />
            );
          })}

          {/* Render custom declarative children */}
          {children}
        </GoogleMap>
      </div>
    </div>
  );
}

/**
 * GoogleMapCard Component
 * Reusable Claymorphism Map Card component for Wanderly.
 */
export function GoogleMapCard({
  apiKey,
  loadScript = true,
  ...props
}: GoogleMapCardProps) {
  if (!loadScript) {
    return <MapInner {...props} />;
  }

  return (
    <MapLoader apiKey={apiKey} tone={props.tone}>
      <MapInner {...props} />
    </MapLoader>
  );
}
