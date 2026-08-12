"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { TripNestSky } from "@/components/ui/TripNestLoader";

/* ------------------------------------------------------------------
   Intro splash

   Covers the app on the first paint of a session — including /login, before
   anyone has signed in — and holds for one full corner-to-corner pass, so
   the animation is always seen whole rather than flashing.

   It is an overlay, not a gate: the page underneath renders, hydrates and
   fetches the whole time, so this costs nothing but the wait we chose. Once
   per session, tracked in sessionStorage, so route changes never replay it.
------------------------------------------------------------------ */

const SESSION_KEY = "tripnest:intro-seen";

/* The in-app loader idles at a calmer pace; the intro is a one-shot, so it
   runs slightly brisker and holds for exactly one crossing. The overlay
   starts its fade as the aeroplane leaves the far corner. */
const INTRO_LOOP_SECONDS = 4.6;
const HOLD_MS = INTRO_LOOP_SECONDS * 1000 * 0.98;

// Reading sessionStorage has to happen before paint or the splash flashes on
// every navigation — but useLayoutEffect isn't available while rendering on
// the server, so fall back there.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function IntroSplash({ holdMs = HOLD_MS }: { holdMs?: number }) {
  // Starts true on both server and client, so hydration matches; the layout
  // effect below takes it straight back down if this isn't a fresh session.
  const [visible, setVisible] = useState(true);

  useIsomorphicLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setVisible(false);
    } catch {
      // Private mode or storage disabled — showing the intro is the safe miss.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* nothing to do */
      }
      setVisible(false);
    }, holdMs);

    return () => clearTimeout(timer);
  }, [visible, holdMs]);

  // Nothing behind the overlay should scroll while it is up.
  useEffect(() => {
    if (!visible) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[90] overflow-hidden bg-clay-bg"
        >
          {/* The aeroplane crosses the whole device behind the wordmark. */}
          <TripNestSky loopSeconds={INTRO_LOOP_SECONDS} />

          {/* One centred column, two groups: the identity, then the status.
              The wordmark and its tagline sit tight together; the gap below
              is what separates them from the progress readout. */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.4, 0.5, 1] }}
            className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
          >
            <h1 className="font-title text-4xl leading-none text-clay-ink sm:text-5xl">
              TripNest
            </h1>
            <p className="mt-3 font-body text-[11px] uppercase tracking-[0.28em] text-clay-muted">
              Wander far, land soft
            </p>

            {/* Reads the wait as deliberate rather than stalled. */}
            <div className="mt-11 h-1 w-40 overflow-hidden rounded-full bg-clay-sunken">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: holdMs / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
                className="h-full w-full rounded-full bg-clay-tangerine"
              />
            </div>
            <p className="mt-3.5 font-body text-xs tracking-wide text-clay-muted">
              Getting things ready
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default IntroSplash;
