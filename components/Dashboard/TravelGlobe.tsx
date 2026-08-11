"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { CalendarIcon, PinIcon } from "@/components/ui/Icons";
import { breathe, fadeUp, floatY, revealViewport, stagger } from "@/lib/animations";
import { formatDate, relativeDay } from "@/lib/dates";
import { useFeedback } from "@/lib/feedback";
import { buildHistory, plannedPlaces } from "@/lib/history";
import {
  makePath,
  makeProjection,
  projectPoint,
  shortestTurn,
  useWorld,
  type Rotation,
} from "@/lib/globe";
import { useAppState } from "@/lib/store";
import { useTheme } from "@/lib/theme/ThemeProvider";
import type { Destination } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Travel globe                                                        */
/*                                                                     */
/* An orthographic projection on a canvas: a real sphere you can spin   */
/* with a finger. It turns whether or not the user has been anywhere —  */
/* an empty planet that rotates is an invitation; a placeholder card is */
/* a dead end.                                                          */
/*                                                                     */
/* Two kinds of pin, and the difference is the point:                   */
/*   · solid  — somewhere they have been                                */
/*   · hollow, pulsing — somewhere they are going                       */
/* Both drop in with a squash-and-settle the moment the trip is         */
/* created, so planning a trip visibly lands on the globe.              */
/*                                                                     */
/* Canvas rather than SVG because the whole world redraws on every      */
/* frame of a drag — 177 country outlines as DOM nodes would drop       */
/* frames on a phone. The trade is that it needs explicit colours, so   */
/* the palette is read back out of CSS whenever the theme changes.      */
/* ------------------------------------------------------------------ */

const SIZE = 460;
const IDLE_SPIN = 4; // degrees per second
const FRICTION = 0.94;
const DROP_MS = 620;

/** Three drifting puffs. Offsets are in pin-space and scaled per cloud. */
const CLOUDS = [
  { lat: 24, lng: -40, scale: 1, puffs: [[-9, 0, 6], [0, -3, 8], [9, 1, 5.5]] },
  { lat: -14, lng: 70, scale: 0.8, puffs: [[-8, 1, 5.5], [1, -2, 7], [8, 2, 5]] },
  { lat: 46, lng: 150, scale: 0.9, puffs: [[-7, 0, 5], [2, -3, 7.5], [10, 1, 5]] },
] as const;

interface Palette {
  ocean: string;
  oceanDeep: string;
  land: string;
  landEdge: string;
  visited: string;
  visitedEdge: string;
  graticule: string;
  pin: string;
  planned: string;
  pinRing: string;
  ink: string;
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    // The ocean carries the theme colour and the land is the pale surface
    // tone. The other way round leaves almost no contrast in the cooler
    // themes, where the background and the deep background are neighbours.
    ocean: read("--color-clay-sky", "#c3dcfb"),
    oceanDeep: read("--color-clay-ocean", "#8fb6ee"),
    land: read("--color-clay-surface", "#fbf4ec"),
    landEdge: read("--color-clay-bg-deep", "#e9dcce"),
    visited: read("--color-clay-jade", "#7fcfae"),
    visitedEdge: read("--color-clay-mint", "#bfe9d5"),
    graticule: read("--color-clay-raised", "#fffdfa"),
    pin: read("--color-clay-tangerine", "#f9b384"),
    planned: read("--color-clay-rose", "#f7a8b8"),
    pinRing: read("--color-clay-raised", "#fffdfa"),
    ink: read("--color-clay-ink", "#4a3a30"),
  };
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(listener: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

const readMotion = () => window.matchMedia(MOTION_QUERY).matches;
/** The server cannot know, and assuming "reduce" would freeze the globe. */
const readMotionOnServer = () => false;

function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToMotion, readMotion, readMotionOnServer);
}

/* ------------------------------------------------------------------ */
/* Markers                                                             */
/* ------------------------------------------------------------------ */

interface Marker {
  id: string;
  destination: Destination;
  kind: "visited" | "planned";
  /** Visited, and going back — draws solid with the planned pulse on top. */
  returning: boolean;
  visits: number;
  nights: number;
  lastVisit: string;
  nextDate: string;
  tripTitle: string;
}

export function TravelGlobe() {
  const { trips } = useAppState();
  const { theme } = useTheme();
  const { play } = useFeedback();

  const history = useMemo(() => buildHistory(trips), [trips]);
  const planned = useMemo(() => plannedPlaces(trips), [trips]);
  const world = useWorld();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef<Rotation>({ lambda: -20, phi: -18 });
  const velocity = useRef(0);
  const dragging = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const glide = useRef<{ to: number; from: number; start: number } | null>(null);
  const hitAreas = useRef<{ id: string; x: number; y: number }[]>([]);
  /** When each pin first appeared, so new ones can drop in rather than blink. */
  const droppedAt = useRef(new Map<string, number>());

  const [selected, setSelected] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  /* --------------------------------------------------- marker assembly */

  const markers = useMemo<Marker[]>(() => {
    const plannedById = new Map(
      planned.map((place) => [place.destination.id, place]),
    );

    const visited: Marker[] = history.places.map((place) => {
      const upcoming = plannedById.get(place.destination.id);
      plannedById.delete(place.destination.id);
      return {
        id: place.destination.id,
        destination: place.destination,
        kind: "visited",
        returning: Boolean(upcoming),
        visits: place.visits,
        nights: place.nights,
        lastVisit: place.lastVisit,
        nextDate: upcoming?.startDate ?? "",
        tripTitle: upcoming?.title ?? "",
      };
    });

    const upcoming: Marker[] = [...plannedById.values()].map((place) => ({
      id: place.destination.id,
      destination: place.destination,
      kind: "planned",
      returning: false,
      visits: 0,
      nights: 0,
      lastVisit: "",
      nextDate: place.startDate,
      tripTitle: place.title,
    }));

    return [...visited, ...upcoming];
  }, [history.places, planned]);

  const visitedCountries = useMemo(
    () => new Set(history.countries),
    [history.countries],
  );

  const plannedCountries = useMemo(
    () =>
      new Set(
        planned
          .filter((place) => !history.countries.includes(place.destination.country))
          .map((place) => place.destination.country),
      ),
    [planned, history.countries],
  );

  const selectedMarker = useMemo(
    () => markers.find((marker) => marker.id === selected) ?? null,
    [markers, selected],
  );

  /* ---------------------------------------------------------- render */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || world.status !== "ready") return;

    // Read straight from CSS rather than mirroring it into state: `theme` is
    // in the dependency list, so a palette swap re-runs this effect and picks
    // up the new variables without an extra render pass.
    const palette = readPalette();

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    context.scale(dpr, dpr);

    // Anything that has appeared since the last render is new, and gets the
    // drop animation. Anything already on the map keeps its original stamp so
    // it does not re-drop every time the component re-renders.
    const now0 = performance.now();
    const live = new Set(markers.map((marker) => marker.id));
    markers.forEach((marker) => {
      if (!droppedAt.current.has(marker.id)) {
        droppedAt.current.set(marker.id, now0);
      }
    });
    droppedAt.current.forEach((_, id) => {
      if (!live.has(id)) droppedAt.current.delete(id);
    });

    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const elapsed = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Motion, in priority order: a glide to a selected pin, the user's
      // flick decaying, then the slow idle turn that never stops.
      if (glide.current) {
        const progress = Math.min(1, (now - glide.current.start) / 700);
        const eased = 1 - Math.pow(1 - progress, 3);
        rotation.current.lambda =
          glide.current.from + (glide.current.to - glide.current.from) * eased;
        if (progress >= 1) glide.current = null;
      } else if (!dragging.current) {
        if (Math.abs(velocity.current) > 0.02) {
          rotation.current.lambda += velocity.current * elapsed * 60;
          velocity.current *= FRICTION;
        } else if (!reducedMotion) {
          rotation.current.lambda += IDLE_SPIN * elapsed;
        }
      }

      const projection = makeProjection(SIZE, rotation.current);
      const path = makePath(projection, context);

      context.clearRect(0, 0, SIZE, SIZE);

      /* ---------------------------------------------------- the sphere */
      const centre = SIZE / 2;
      const radius = SIZE / 2 - 2;

      // A gentle lift towards the top-left and a deeper rim. It starts at the
      // theme's own pale blue rather than white — a white core reads as glare
      // on a screen, not as a shine on clay.
      const water = context.createRadialGradient(
        centre - radius * 0.25,
        centre - radius * 0.3,
        radius * 0.1,
        centre,
        centre,
        radius,
      );
      water.addColorStop(0, palette.ocean);
      water.addColorStop(0.62, palette.ocean);
      water.addColorStop(1, palette.oceanDeep);

      context.beginPath();
      context.arc(centre, centre, radius, 0, Math.PI * 2);
      context.fillStyle = water;
      context.fill();

      /* ------------------------------------------------------- meridians */
      // Fewer lines, thicker and softer than a real graticule. This is a toy
      // globe, not an atlas — the grid is there for a sense of turning, so
      // anything more than a hint of it just adds noise.
      context.strokeStyle = palette.graticule;
      context.lineCap = "round";
      context.globalAlpha = 0.22;
      context.lineWidth = 1.3;
      for (let lng = -180; lng < 180; lng += 45) {
        context.beginPath();
        path({
          type: "LineString",
          // Stops short of the poles: every meridian meeting at one point
          // makes a spiky starburst, which is the opposite of soft.
          coordinates: Array.from({ length: 33 }, (_, i) => [lng, -78 + i * 5]),
        });
        context.stroke();
      }
      for (let lat = -45; lat <= 45; lat += 45) {
        context.beginPath();
        path({
          type: "LineString",
          coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]),
        });
        context.stroke();
      }
      context.globalAlpha = 1;

      /* ----------------------------------------------------------- land */
      // Drawn as one puffy shape rather than 177 outlined countries: a fat
      // round-joined stroke in the fill colour rounds off every headland and
      // swallows the fiddly islands, which is what makes it read as modelled
      // clay instead of a chart. Internal borders are dropped entirely.
      context.lineJoin = "round";

      context.beginPath();
      path(world.world.land);
      context.fillStyle = palette.land;
      context.strokeStyle = palette.land;
      context.lineWidth = 5;
      context.stroke();
      context.fill();

      // A soft darker lip along the bottom of the landmass, so it sits *in*
      // the water rather than on top of it.
      context.save();
      context.beginPath();
      path(world.world.land);
      context.clip();
      const lip = context.createLinearGradient(0, centre - radius, 0, centre + radius);
      lip.addColorStop(0, "rgba(255,255,255,0.18)");
      lip.addColorStop(0.5, "rgba(255,255,255,0)");
      lip.addColorStop(1, "rgba(74,58,48,0.12)");
      context.fillStyle = lip;
      context.fillRect(0, 0, SIZE, SIZE);
      context.restore();

      /* -------------------------------------- countries that mean something */
      world.world.countries.forEach((country) => {
        const been = visitedCountries.has(country.name);
        const going = !been && plannedCountries.has(country.name);
        if (!been && !going) return;

        context.beginPath();
        path(country.geometry);
        context.fillStyle = been ? palette.visited : palette.visitedEdge;
        context.strokeStyle = been ? palette.visited : palette.visitedEdge;
        context.lineWidth = 4;
        context.globalAlpha = been ? 1 : 0.85;
        context.stroke();
        context.fill();
        context.globalAlpha = 1;
      });

      /* ---------------------------------------------------------- clouds */
      // Three little puffs drifting west to east, culled behind the sphere
      // like everything else. They cost almost nothing and they are the
      // single thing that makes the globe feel alive rather than plotted.
      if (!reducedMotion) {
        const drift = (now / 1000) * 1.6;
        CLOUDS.forEach((cloud) => {
          const spot = projectPoint(
            projection,
            cloud.lat,
            ((cloud.lng + drift + 180) % 360) - 180,
          );
          if (!spot || !spot.visible) return;

          context.fillStyle = palette.graticule;
          context.globalAlpha = 0.55;
          cloud.puffs.forEach(([dx, dy, r]) => {
            context.beginPath();
            context.arc(
              spot.x + dx * cloud.scale,
              spot.y + dy * cloud.scale,
              r * cloud.scale,
              0,
              Math.PI * 2,
            );
            context.fill();
          });
          context.globalAlpha = 1;
        });
      }

      /* ---------------------------------------------------- shading */
      // Occlusion only. There is no specular highlight: the clay surfaces in
      // this app are matte, and a gloss blob on a 460px sphere blows out the
      // whole section — which is exactly what it was doing.
      const shade = context.createRadialGradient(
        centre - radius * 0.3,
        centre - radius * 0.34,
        radius * 0.1,
        centre,
        centre,
        radius,
      );
      shade.addColorStop(0, "rgba(255,255,255,0.12)");
      shade.addColorStop(0.6, "rgba(255,255,255,0)");
      shade.addColorStop(1, "rgba(74,58,48,0.22)");

      context.beginPath();
      context.arc(centre, centre, radius, 0, Math.PI * 2);
      context.fillStyle = shade;
      context.fill();

      /* ----------------------------------------------------------- pins */
      const areas: { id: string; x: number; y: number }[] = [];
      const pulse = (Math.sin(now / 480) + 1) / 2; // 0 → 1 → 0, ~3s round trip

      markers.forEach((marker) => {
        const { lat, lng } = marker.destination.coordinates;
        const point = projectPoint(projection, lat, lng);
        if (!point || !point.visible) return;

        // The clickable spot is the pin's body, which sits above the
        // coordinate — see the teardrop geometry below.
        areas.push({ id: marker.id, x: point.x, y: point.y - 9 });

        // A damped bounce: rises fast, overshoots by about a fifth, settles
        // exactly on 1 — so there is no snap at the end the way a clamped
        // overshoot curve would give.
        const age = now - (droppedAt.current.get(marker.id) ?? now);
        const t = Math.min(1, age / DROP_MS);
        const drop = 1 - Math.pow(1 - t, 2.5) * Math.cos(t * Math.PI * 2.2);

        const isSelected = marker.id === selected;
        const base = 5.5 + Math.min(Math.max(marker.visits - 1, 0), 3) * 1.2;
        const size = base * drop;
        if (size <= 0.2) return;

        // Pins bob gently on the spot, out of phase with each other so they
        // do not look like one mechanism.
        const bob = reducedMotion
          ? 0
          : Math.sin(now / 620 + point.x * 0.05) * 1.6 * drop;
        // A map pin points at the place. The tip sits on the coordinate and
        // the body floats above it, rather than the body straddling it.
        const py = point.y - size * 1.55 + bob;

        // Somewhere they are going gets a halo that breathes; somewhere they
        // have been sits still. Movement means "ahead of you".
        if (marker.kind === "planned" || marker.returning) {
          context.beginPath();
          context.arc(point.x, py, size + 5 + pulse * 8, 0, Math.PI * 2);
          context.fillStyle = palette.planned;
          context.globalAlpha = 0.32 * (1 - pulse) * drop;
          context.fill();
          context.globalAlpha = 1;
        }

        // A little shadow puddle on the surface, so the pin reads as sitting
        // above the globe rather than painted onto it.
        context.beginPath();
        context.ellipse(point.x, point.y + 2, size * 0.62, size * 0.24, 0, 0, Math.PI * 2);
        context.fillStyle = "rgba(74,58,48,0.18)";
        context.globalAlpha = drop;
        context.fill();
        context.globalAlpha = 1;

        // Teardrop body: a circle with a soft point underneath.
        const fill = isSelected
          ? palette.ink
          : marker.kind === "visited"
            ? palette.pin
            : palette.pinRing;

        context.beginPath();
        context.arc(point.x, py, size, Math.PI * 0.14, Math.PI * 0.86, true);
        context.lineTo(point.x, point.y + bob);
        context.closePath();
        context.fillStyle = fill;
        context.strokeStyle = palette.pinRing;
        context.lineWidth = 2.6;
        context.globalAlpha = drop;
        context.stroke();
        context.fill();

        // Hollow centre while the trip is still ahead of them.
        context.beginPath();
        context.arc(point.x, py, size * 0.42, 0, Math.PI * 2);
        context.fillStyle =
          marker.kind === "planned" ? palette.planned : palette.pinRing;
        context.fill();
        context.globalAlpha = 1;

        if (isSelected) {
          context.beginPath();
          context.arc(point.x, py, size + 8, 0, Math.PI * 2);
          context.strokeStyle = palette.ink;
          context.lineWidth = 1.4;
          context.globalAlpha = 0.45;
          context.stroke();
          context.globalAlpha = 1;
        }
      });

      hitAreas.current = areas;
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [
    theme,
    world,
    visitedCountries,
    plannedCountries,
    markers,
    selected,
    reducedMotion,
  ]);

  /* ------------------------------------------------------- interaction */

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    glide.current = null;
    velocity.current = 0;
    pointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    pointer.current = { x: event.clientX, y: event.clientY };

    rotation.current.lambda += dx * 0.32;
    // Clamped: past ±90° the globe turns upside down, which reads as a bug.
    rotation.current.phi = Math.max(
      -80,
      Math.min(80, rotation.current.phi - dy * 0.32),
    );
    velocity.current = dx * 0.06;
  };

  const pointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    // Only a real flick earns a sound; letting go after a slow drag is silent.
    if (Math.abs(velocity.current) > 0.55) play("spin");
  };

  /** Turn the globe so a pin ends up facing the viewer. */
  const focusOn = (destinationId: string) => {
    const marker = markers.find((item) => item.id === destinationId);
    if (!marker) return;

    const target = -marker.destination.coordinates.lng;
    velocity.current = 0;
    glide.current = {
      from: rotation.current.lambda,
      to: rotation.current.lambda + shortestTurn(rotation.current.lambda, target),
      start: performance.now(),
    };
  };

  /** Tap a pin to select it; the globe then turns that pin to the front. */
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const x = (event.clientX - rect.left) * scale;
    const y = (event.clientY - rect.top) * scale;

    const hit = hitAreas.current.find(
      (area) => Math.hypot(area.x - x, area.y - y) < 14,
    );
    if (!hit) return;

    play("pin");
    setSelected(hit.id);
    focusOn(hit.id);
  };

  /* ------------------------------------------------------------ render */

  const visitedMarkers = markers.filter((marker) => marker.kind === "visited");
  const plannedMarkers = markers.filter((marker) => marker.kind === "planned");
  const empty = markers.length === 0;

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp} className="mb-4 px-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Your world
        </h2>
        <p className="mt-1 font-body text-sm text-clay-ink-soft">
          {empty
            ? "Spin it — every trip you plan or finish drops a pin here"
            : [
                visitedMarkers.length &&
                  `${visitedMarkers.length} visited`,
                plannedMarkers.length && `${plannedMarkers.length} planned`,
                `${history.countries.length} ${
                  history.countries.length === 1 ? "country" : "countries"
                } logged`,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
      </motion.div>

      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="xl" depth="lg" className="overflow-hidden p-5 sm:p-7">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* ------------------------------------------------- the globe */}
            <div className="relative mx-auto w-full max-w-[460px]">
              {/* clay pedestal — the shadow the globe is resting in */}
              <motion.div
                {...breathe(1.06, 7)}
                aria-hidden
                className="absolute inset-x-[12%] bottom-[-3%] h-6 rounded-full bg-clay-bg-deep opacity-70 blur-md"
              />

              {world.status === "error" ? (
                <div className="flex aspect-square items-center justify-center rounded-full bg-clay-sunken shadow-clay-inset">
                  <p className="max-w-[60%] text-center font-body text-sm text-clay-ink-soft">
                    The world map could not be loaded, so the globe is sitting
                    this one out.
                  </p>
                </div>
              ) : (
                <motion.div {...floatY(6, 7)} className="relative">
                  <canvas
                    ref={canvasRef}
                    style={{ width: "100%", aspectRatio: "1 / 1" }}
                    className="touch-none select-none rounded-full shadow-clay-lg"
                    onPointerDown={pointerDown}
                    onPointerMove={pointerMove}
                    onPointerUp={pointerUp}
                    onPointerCancel={pointerUp}
                    onClick={handleClick}
                    aria-label={
                      empty
                        ? "A rotating globe with no pins yet"
                        : `Globe showing ${visitedMarkers.length} visited and ${plannedMarkers.length} planned places`
                    }
                  />
                  {world.status === "loading" && (
                    <p className="absolute inset-0 flex items-center justify-center font-body text-sm text-clay-ink-soft">
                      Drawing the world…
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* ----------------------------------------------- side panel */}
            <div>
              <Legend />

              {empty ? (
                <div className="mt-4 rounded-clay bg-clay-sunken/50 p-4 shadow-clay-inset-sm">
                  <p className="font-display text-sm font-semibold">
                    No pins yet
                  </p>
                  <p className="mt-1 font-body text-xs leading-relaxed text-clay-ink-soft">
                    Plan a trip and its pin drops onto the globe straight away —
                    hollow while it is ahead of you, filled in once you have
                    been.
                  </p>
                  <Link href="/plan" className="mt-3 inline-block">
                    <ClayButton size="sm" tone="mint">
                      Plan a trip
                    </ClayButton>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 flex max-h-[280px] flex-col gap-1.5 overflow-y-auto pr-1">
                  {plannedMarkers.length > 0 && (
                    <p className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
                      Coming up
                    </p>
                  )}
                  {plannedMarkers.map((marker) => (
                    <PinRow
                      key={marker.id}
                      marker={marker}
                      active={marker.id === selected}
                      onSelect={() => {
                        play("pin");
                        setSelected(marker.id);
                        focusOn(marker.id);
                      }}
                    />
                  ))}

                  {visitedMarkers.length > 0 && (
                    <p className="mt-2 font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
                      Been there
                    </p>
                  )}
                  {visitedMarkers.map((marker) => (
                    <PinRow
                      key={marker.id}
                      marker={marker}
                      active={marker.id === selected}
                      onSelect={() => {
                        play("pin");
                        setSelected(marker.id);
                        focusOn(marker.id);
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedMarker && (
                <div className="mt-3 rounded-clay bg-clay-sunken/60 p-3 shadow-clay-inset-sm">
                  <p className="font-display text-sm font-semibold">
                    {selectedMarker.destination.name}
                  </p>
                  <p className="mt-0.5 font-body text-xs leading-relaxed text-clay-ink-soft">
                    {describeMarker(selectedMarker)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ClayCard>
      </motion.div>
    </motion.section>
  );
}

/** One line of plain English about a pin, whichever kind it is. */
function describeMarker(marker: Marker): string {
  if (marker.kind === "planned") {
    return marker.nextDate
      ? `${marker.tripTitle} · ${formatDate(marker.nextDate)} · ${relativeDay(
          marker.nextDate,
        )}`
      : `${marker.tripTitle} · dates not set yet`;
  }

  const parts = [
    `${marker.visits} ${marker.visits === 1 ? "visit" : "visits"}`,
    marker.nights > 0 &&
      `${marker.nights} ${marker.nights === 1 ? "night" : "nights"}`,
    marker.lastVisit && `last ${formatDate(marker.lastVisit)}`,
    marker.returning &&
      (marker.nextDate ? `going back ${relativeDay(marker.nextDate)}` : "going back"),
  ].filter(Boolean);

  return parts.join(" · ");
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.5 font-body text-[11px] font-semibold text-clay-ink-soft">
        <span className="h-3 w-3 rounded-full bg-clay-tangerine shadow-clay-xs" />
        Been there
      </span>
      <span className="flex items-center gap-1.5 font-body text-[11px] font-semibold text-clay-ink-soft">
        <motion.span
          animate={{ scale: [1, 1.25, 1], opacity: [1, 0.65, 1] }}
          transition={{
            type: "tween",
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-3 w-3 rounded-full border-2 border-clay-rose"
        />
        Planned
      </span>
    </div>
  );
}

function PinRow({
  marker,
  active,
  onSelect,
}: {
  marker: Marker;
  active: boolean;
  onSelect: () => void;
}) {
  const planned = marker.kind === "planned";

  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-pressed={active}
      className={`flex items-center gap-2.5 rounded-clay-sm px-3 py-2 text-left font-body text-sm transition-shadow ${
        active
          ? "bg-clay-raised shadow-clay-sm"
          : "bg-clay-sunken/40 shadow-clay-inset-sm hover:shadow-clay-xs"
      }`}
    >
      <span className={planned ? "text-clay-rose" : "text-clay-tangerine"}>
        {planned ? <CalendarIcon size={14} /> : <PinIcon size={14} />}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">
        {marker.destination.name}
      </span>
      {planned && marker.nextDate && (
        <span className="shrink-0 font-body text-[10px] font-bold text-clay-muted">
          {relativeDay(marker.nextDate)}
        </span>
      )}
      {!planned && marker.visits > 1 && (
        <span className="shrink-0 rounded-full bg-clay-butter px-2 py-0.5 text-[10px] font-bold">
          ×{marker.visits}
        </span>
      )}
    </motion.button>
  );
}
