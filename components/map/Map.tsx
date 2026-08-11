"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { LeafletMapContainerProps } from "./LeafletMapContainer";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";

/**
 * Dynamically import LeafletMapContainer with SSR disabled to prevent `window` reference errors during Next.js SSR.
 */
const DynamicLeafletMap = dynamic(
  () => import("./LeafletMapContainer"),
  {
    ssr: false,
    loading: () => <LeafletMapSkeleton />,
  }
);

export function LeafletMapSkeleton({ tone = "surface" }: { tone?: ClayTone }) {
  const toneStyle = TONES[tone] || TONES.surface;
  return (
    <div
      className={`relative w-full h-[450px] rounded-clay-lg shadow-clay ${toneStyle.bg} flex flex-col items-center justify-center overflow-hidden p-6 border-4 border-white/80`}
      aria-label="Loading OpenStreetMap"
    >
      <div className="relative z-10 flex flex-col items-center text-center space-y-3">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-clay-sky shadow-clay-sm animate-bounce">
          <span className="font-display font-extrabold text-xl text-clay-ink">📍</span>
        </div>

        <div className="space-y-1">
          <p className="font-display font-bold text-base text-clay-ink">
            Loading OpenStreetMap...
          </p>
          <p className="font-body text-xs text-clay-ink-soft">
            Fetching OpenStreetMap tiles & package markers
          </p>
        </div>
      </div>
    </div>
  );
}

export function Map(props: LeafletMapContainerProps) {
  return <DynamicLeafletMap {...props} />;
}

export default Map;
