// @ts-nocheck
"use client";

import { geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Globe geometry                                                      */
/*                                                                     */
/* The world outline is fetched from /geo at runtime rather than       */
/* imported, so ~105kb of coastline never lands in the JS bundle for   */
/* the people who scroll past the globe.                                */
/* ------------------------------------------------------------------ */

export interface CountryFeature {
  name: string;
  geometry: GeoPermissibleObjects;
}

export interface WorldGeometry {
  countries: CountryFeature[];
  /** Every country merged, used for the single land silhouette. */
  land: GeoPermissibleObjects;
}

const SOURCE = "/geo/countries-110m.json";

let cached: WorldGeometry | null = null;
let inFlight: Promise<WorldGeometry> | null = null;

export function loadWorld(): Promise<WorldGeometry> {
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = fetch(SOURCE)
    .then((response) => {
      if (!response.ok) throw new Error(`World map returned ${response.status}`);
      return response.json();
    })
    .then((topology: Topology) => {
      const collection = topology.objects.countries as GeometryCollection<{
        name?: string;
      }>;
      const geo = feature(topology, collection);

      const world: WorldGeometry = {
        countries: geo.features.map((item) => ({
          name: item.properties?.name ?? "",
          geometry: item as unknown as GeoPermissibleObjects,
        })),
        land: geo as unknown as GeoPermissibleObjects,
      };

      cached = world;
      return world;
    })
    .catch((error: unknown) => {
      // Let the next mount try again rather than caching a failure forever.
      inFlight = null;
      throw error;
    });

  return inFlight;
}

export type WorldState =
  | { status: "loading" }
  | { status: "ready"; world: WorldGeometry }
  | { status: "error" };

const LOADING: WorldState = { status: "loading" };

export function useWorld(enabled = true): WorldState {
  const [state, setState] = useState<WorldState>(LOADING);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    loadWorld()
      .then((world) => {
        if (alive) setState({ status: "ready", world });
      })
      .catch(() => {
        if (alive) setState({ status: "error" });
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return state;
}

/* ------------------------------------------------------------------ */
/* Projection helpers                                                  */
/* ------------------------------------------------------------------ */

export interface Rotation {
  /** Degrees east — spins the globe left/right. */
  lambda: number;
  /** Degrees — tilts north/south. Clamped so the poles never flip over. */
  phi: number;
}

export function makeProjection(size: number, rotation: Rotation) {
  const radius = size / 2 - 2;
  return geoOrthographic()
    .scale(radius)
    .translate([size / 2, size / 2])
    .rotate([rotation.lambda, rotation.phi])
    .clipAngle(90);
}

export function makePath(
  projection: ReturnType<typeof makeProjection>,
  context: CanvasRenderingContext2D,
) {
  return geoPath(projection, context);
}

/**
 * Where a lat/lng sits on screen, and whether it is on the near side.
 *
 * geoOrthographic returns coordinates for points behind the globe too, so a
 * visibility test is required or every pin would show through the planet.
 * The test is the angular distance between the point and the projection's
 * centre: more than 90° away means it is round the back.
 */
export function projectPoint(
  projection: ReturnType<typeof makeProjection>,
  lat: number,
  lng: number,
): { x: number; y: number; visible: boolean } | null {
  const point = projection([lng, lat]);
  if (!point) return null;

  const [rotLambda, rotPhi] = projection.rotate();
  const centreLng = -rotLambda;
  const centreLat = -rotPhi;

  const toRad = Math.PI / 180;
  const cosDistance =
    Math.sin(centreLat * toRad) * Math.sin(lat * toRad) +
    Math.cos(centreLat * toRad) *
      Math.cos(lat * toRad) *
      Math.cos((lng - centreLng) * toRad);

  return { x: point[0], y: point[1], visible: cosDistance > 0 };
}

/** Shortest signed distance between two longitudes, for spin-to-place. */
export function shortestTurn(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
