"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TONES } from "@/lib/tones";
import type { ClayTone } from "@/types/dashboard";

export interface MapLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  description?: string;
  estimatedCost?: string;
  visitDuration?: string;
  tone?: ClayTone;
  rating?: number;
}

/**
 * Creates custom SVG Leaflet marker icons matching TripNest / Wanderly's Claymorphism palette
 */
function createLeafletClayIcon(colorHex: string = "#f9b384") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46" fill="none">
    <filter id="shadow" x="0" y="0" width="36" height="46" filterUnits="userSpaceOnUse">
      <feDropShadow dx="1" dy="3" stdDeviation="2.5" flood-color="#7c6558" flood-opacity="0.3"/>
    </filter>
    <g filter="url(#shadow)">
      <path d="M18 40C18 40 31 27 31 16.5C31 9.04416 25.1797 3 18 3C10.8203 3 5 9.04416 5 16.5C5 27 18 40 18 40Z" fill="${colorHex}" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="18" cy="16.5" r="5" fill="#FFFFFF"/>
    </g>
  </svg>`;

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [36, 46],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

/**
 * Helper component that dynamically pans/zooms the Leaflet map when center or zoom changes
 */
function ChangeMapView({
  center,
  zoom,
}: {
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, {
      duration: 1.5,
      easeLinearity: 0.25,
    });
  }, [center.lat, center.lng, zoom, map]);

  return null;
}

export interface LeafletMapContainerProps {
  center: { lat: number; lng: number };
  zoom?: number;
  locations?: MapLocation[];
  height?: string | number;
  width?: string | number;
  tone?: ClayTone;
  onMarkerClick?: (location: MapLocation) => void;
  selectedLocationId?: string;
  className?: string;
}

export default function LeafletMapContainer({
  center,
  zoom = 4,
  locations = [],
  height = "450px",
  width = "100%",
  tone = "surface",
  onMarkerClick,
  selectedLocationId,
  className = "",
}: LeafletMapContainerProps) {
  const toneStyle = TONES[tone] || TONES.surface;

  return (
    <div
      className={[
        toneStyle.bg,
        "relative overflow-hidden rounded-clay-lg shadow-clay border-4 border-white/80 p-3 sm:p-4 transition-all duration-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
      }}
    >
      <div
        className="relative overflow-hidden rounded-clay-sm shadow-clay-inset border-2 border-white/70 z-0"
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
        }}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          {/* Change map view dynamically when center changes */}
          <ChangeMapView center={center} zoom={zoom} />

          {/* OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Location Markers */}
          {locations.map((loc) => {
            const locTone = loc.tone || tone;
            const iconHex = TONES[locTone]?.hex || "#f9b384";
            const customIcon = createLeafletClayIcon(iconHex);

            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={customIcon}
                eventHandlers={{
                  click: () => {
                    if (onMarkerClick) onMarkerClick(loc);
                  },
                }}
              >
                <Popup className="clay-leaflet-popup">
                  <div className="p-1 min-w-[200px] max-w-[260px] font-body text-clay-ink">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
                        {loc.name}
                      </h4>
                      {loc.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-clay-peach/50 text-clay-ink shrink-0">
                          {loc.category}
                        </span>
                      )}
                    </div>

                    {loc.description && (
                      <p className="text-xs text-clay-ink-soft mb-2.5 leading-snug">
                        {loc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-clay-muted/20 pt-2 text-[11px] font-semibold">
                      {loc.estimatedCost && (
                        <span className="text-emerald-700">
                          Est: {loc.estimatedCost}
                        </span>
                      )}
                      {loc.visitDuration && (
                        <span className="text-clay-muted">
                          ⏱ {loc.visitDuration}
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
