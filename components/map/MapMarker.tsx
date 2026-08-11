"use client";

import React, { type ReactNode, useState, useCallback } from "react";
import { MarkerF, InfoWindowF } from "@react-google-maps/api";
import type { ClayTone } from "@/types/dashboard";
import { TONES } from "@/lib/tones";

export interface MapMarkerItem {
  id?: string | number;
  position: { lat: number; lng: number };
  title?: string;
  label?: string | google.maps.MarkerLabel;
  icon?: string | google.maps.Icon | google.maps.Symbol;
  onClick?: (marker: MapMarkerItem) => void;
  infoWindowContent?: ReactNode | string;
  isOpen?: boolean;
  onCloseInfoWindow?: () => void;
  animation?: google.maps.Animation;
  draggable?: boolean;
  onDragEnd?: (e: google.maps.MapMouseEvent) => void;
  tone?: ClayTone;
}

export interface MapMarkerProps extends MapMarkerItem {
  /** Optional custom React node for info window content */
  children?: ReactNode;
}

/**
 * Creates a custom clay pin SVG data URI string if a raw string icon is not provided.
 */
export function createClayPinSvg(colorHex: string = "#f7a8b8"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48" fill="none">
    <filter id="shadow" x="0" y="0" width="40" height="48" filterUnits="userSpaceOnUse">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="#a2897a" flood-opacity="0.35"/>
    </filter>
    <g filter="url(#shadow)">
      <path d="M20 42C20 42 34 28.5 34 17.5C34 9.49187 27.732 3 20 3C12.268 3 6 9.49187 6 17.5C6 28.5 20 42 20 42Z" fill="${colorHex}" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="20" cy="17.5" r="5.5" fill="#FFFFFF"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * MapMarker Component
 * Wraps @react-google-maps/api's MarkerF with support for custom clay-styled InfoWindow popups.
 */
export function MapMarker({
  id,
  position,
  title,
  label,
  icon,
  onClick,
  infoWindowContent,
  isOpen: explicitIsOpen,
  onCloseInfoWindow,
  animation,
  draggable,
  onDragEnd,
  tone = "peach",
  children,
}: MapMarkerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isInfoWindowOpen =
    explicitIsOpen !== undefined ? explicitIsOpen : internalIsOpen;

  const handleMarkerClick = useCallback(() => {
    if (onClick) {
      onClick({
        id,
        position,
        title,
        label,
        icon,
        infoWindowContent,
        tone,
      });
    }
    if (infoWindowContent || children) {
      setInternalIsOpen(true);
    }
  }, [id, position, title, label, icon, infoWindowContent, tone, onClick, children]);

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    if (onCloseInfoWindow) {
      onCloseInfoWindow();
    }
  }, [onCloseInfoWindow]);

  const toneStyle = TONES[tone] || TONES.peach;

  // Use custom marker icon or build a default clay pin icon using the tone's accent
  const resolvedIcon =
    icon ||
    (typeof window !== "undefined" && window.google?.maps
      ? {
          url: createClayPinSvg(toneStyle.hex),
          scaledSize: new window.google.maps.Size(36, 44),
          anchor: new window.google.maps.Point(18, 44),
        }
      : undefined);

  return (
    <MarkerF
      position={position}
      title={title}
      label={label}
      icon={resolvedIcon}
      onClick={handleMarkerClick}
      animation={animation}
      draggable={draggable}
      onDragEnd={onDragEnd}
    >
      {isInfoWindowOpen && (infoWindowContent || children) && (
        <InfoWindowF position={position} onCloseClick={handleClose}>
          <div
            className={`p-3 max-w-xs rounded-clay-sm ${toneStyle.bg} shadow-clay-sm border-2 border-white text-clay-ink`}
          >
            {title && (
              <h4 className="font-display font-bold text-sm text-clay-ink mb-1">
                {title}
              </h4>
            )}
            {typeof infoWindowContent === "string" ? (
              <p className="font-body text-xs text-clay-ink-soft leading-snug">
                {infoWindowContent}
              </p>
            ) : (
              infoWindowContent
            )}
            {children}
          </div>
        </InfoWindowF>
      )}
    </MarkerF>
  );
}
