"use client";

import React, { type ReactNode } from "react";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";

const DEFAULT_LIBRARIES: Libraries = ["places"];

export interface MapLoaderProps {
  /** Google Maps API Key. Defaults to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY */
  apiKey?: string;
  /** Google Maps Libraries to load (e.g. ['places', 'geometry']) */
  libraries?: Libraries;
  /** Content to render once Google Maps JS API is loaded */
  children: ReactNode | ((isLoaded: boolean, loadError?: Error) => ReactNode);
  /** Custom fallback while loading. If omitted, a claymorphic loader is displayed */
  loadingFallback?: ReactNode;
  /** Custom fallback if API key is missing or load fails */
  errorFallback?: ReactNode;
  /** Clay tone for the loading/error state cards */
  tone?: ClayTone;
}

/**
 * Claymorphic loading skeleton displayed while Google Maps loads.
 */

export function ClayMapSkeleton({ tone = "surface" }: { tone?: ClayTone }) {
  const toneStyle = TONES[tone] || TONES.surface;
  return (
    <div
      className={`relative w-full h-[400px] rounded-clay-lg shadow-clay ${toneStyle.bg} flex flex-col items-center justify-center overflow-hidden p-6 border-4 border-white/60`}
      aria-label="Loading map"
    >
      {/* Background soft clay ripple effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Animated clay compass / pin orb */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-clay-peach shadow-clay-sm animate-pulse">
          <div className="w-8 h-8 rounded-full bg-clay-tangerine shadow-clay-inset flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-display font-bold text-lg text-clay-ink tracking-wide">
            Loading Map...
          </p>
          <p className="font-body text-xs text-clay-ink-soft">
            Preparing world tiles & markers
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Claymorphic error/missing key warning card.
 */
export function ClayMapError({
  message,
  tone = "blush",
}: {
  message?: string;
  tone?: ClayTone;
}) {
  const toneStyle = TONES[tone] || TONES.blush;
  return (
    <div
      className={`relative w-full min-h-[250px] rounded-clay-lg shadow-clay ${toneStyle.bg} flex flex-col items-center justify-center p-6 text-center border-4 border-white/60`}
    >
      <div className="w-12 h-12 rounded-full bg-clay-rose/40 shadow-clay-inset flex items-center justify-center mb-3">
        <span className="font-display font-extrabold text-xl text-clay-ink">
          !
        </span>
      </div>
      <h3 className="font-display font-bold text-lg text-clay-ink mb-1">
        Google Maps Key Required
      </h3>
      <p className="font-body text-xs text-clay-ink-soft max-w-md leading-relaxed">
        {message ||
          "Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables (.env.local) to enable interactive map capabilities."}
      </p>
    </div>
  );
}

/**
 * MapLoader Component
 * Encapsulates JS API script loading using @react-google-maps/api's useJsApiLoader.
 */
export function MapLoader({
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  libraries = DEFAULT_LIBRARIES,
  children,
  loadingFallback,
  errorFallback,
  tone = "surface",
}: MapLoaderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "wanderly-google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  if (!apiKey) {
    return errorFallback || <ClayMapError tone="blush" />;
  }

  if (loadError) {
    return (
      errorFallback || (
        <ClayMapError
          message={`Failed to load Google Maps script: ${loadError.message}`}
          tone="blush"
        />
      )
    );
  }

  if (!isLoaded) {
    return loadingFallback || <ClayMapSkeleton tone={tone} />;
  }

  if (typeof children === "function") {
    return <>{children(isLoaded, loadError)}</>;
  }

  return <>{children}</>;
}
