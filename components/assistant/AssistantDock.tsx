"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatPanel } from "@/components/assistant/ChatPanel";
import { MascotFace } from "@/components/ui/MascotFace";
import { ArrowRightIcon, SparkIcon } from "@/components/ui/Icons";
import { breathe, floatY, springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";

/* ------------------------------------------------------------------ */
/* Floating assistant                                                  */
/*                                                                     */
/* The assistant used to be a rail entry, which made talking to it a   */
/* navigation decision — you left whatever you were doing to go and    */
/* ask a question. As a corner launcher it sits alongside the page     */
/* instead, so you can ask about the budget while looking at it.       */
/*                                                                     */
/* The button wears the mascot's face, and the face dresses for the    */
/* active theme, so the corner restyles itself with the weather.       */
/* ------------------------------------------------------------------ */

const NUDGE_DELAY_MS = 2600;

export function AssistantDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [nudged, setNudged] = useState(false);

  // The greeting bubble appears once per session, a beat after the page
  // settles, then never interrupts again.
  useEffect(() => {
    if (nudged) return;
    const timer = window.setTimeout(() => setNudged(true), NUDGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [nudged]);

  // Close on Escape — a floating panel that traps you is worse than no panel.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The dedicated page is the same conversation at full size; showing the
  // launcher on top of it is just clutter.
  if (pathname.startsWith("/assistant")) return null;

  const showNudge = nudged && !open;

  return (
    <div className="fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 lg:bottom-6 lg:right-6">
      {/* ------------------------------------------------ the panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={springSoft}
            /* Grows out of the button rather than the middle of the screen. */
            style={{ transformOrigin: "bottom right" }}
            role="dialog"
            aria-label="AI travel assistant"
            className="flex h-[min(72vh,560px)] w-[min(92vw,404px)] flex-col overflow-hidden rounded-clay-lg border-4 border-white/70 bg-clay-surface/98 p-4 shadow-clay-lg backdrop-blur-xl"
          >
            <header className="mb-3 flex items-center gap-2.5 border-b border-clay-muted/15 pb-3">
              <motion.span
                {...breathe(1.05, 4)}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-clay-sky shadow-clay-xs"
              >
                <MascotFace size={34} />
              </motion.span>

              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold leading-tight text-clay-ink">
                  Your travel assistant
                </p>
                <p className="flex items-center gap-1.5 font-body text-[11px] text-clay-ink-soft">
                  <motion.span
                    animate={{ opacity: [1, 0.35, 1] }}
                    transition={{ type: "tween", duration: 2.2, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-clay-jade"
                  />
                  Ready when you are
                </p>
              </div>

              <Link
                href="/assistant"
                onClick={() => {
                  feedback("nav");
                  setOpen(false);
                }}
                title="Open the full assistant"
                aria-label="Open the full assistant"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-sunken/70 text-clay-ink-soft shadow-clay-inset-sm transition-colors hover:text-clay-ink"
              >
                <ArrowRightIcon size={15} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  feedback("toggleOff");
                  setOpen(false);
                }}
                aria-label="Close assistant"
                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-clay-sunken/70 text-clay-ink-soft shadow-clay-inset-sm transition-colors hover:text-clay-ink"
              >
                <span className="block h-[2px] w-3.5 rotate-45 rounded-full bg-current" />
                <span className="absolute block h-[2px] w-3.5 -rotate-45 rounded-full bg-current" />
              </button>
            </header>

            <ChatPanel variant="dock" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------- the greeting nudge */}
      <AnimatePresence>
        {showNudge && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.94 }}
            transition={springSnappy}
            onClick={() => {
              feedback("pop");
              setOpen(true);
            }}
            className="max-w-[220px] rounded-clay-sm rounded-br-md bg-clay-butter px-3.5 py-2.5 text-left shadow-clay-sm"
          >
            <span className="flex items-center gap-1.5 font-body text-[9px] font-extrabold uppercase tracking-[0.12em] text-clay-ink/60">
              <SparkIcon size={11} />
              Wanderly
            </span>
            <span className="mt-0.5 block font-display text-[12.5px] font-bold leading-snug text-clay-ink">
              Need a hand with this page? Ask me anything.
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --------------------------------------------- the launcher */}
      <motion.button
        type="button"
        onClick={() => {
          feedback(open ? "toggleOff" : "toggleOn");
          setOpen((current) => !current);
          setNudged(true);
        }}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open the travel assistant"}
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springSoft, delay: 0.5 }}
        whileHover={{ scale: 1.08, y: -4 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex h-16 w-16 items-center justify-center rounded-full bg-clay-surface shadow-clay transition-shadow duration-300 hover:shadow-clay-hover active:shadow-clay-pressed"
      >
        {/* A slow halo, so the corner has a pulse without demanding attention. */}
        {!open && (
          <motion.span
            aria-hidden
            animate={{ scale: [1, 1.28, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ type: "tween", duration: 3.2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-clay-tangerine/35"
          />
        )}

        <motion.span
          /* Idle float while closed; settles the moment the panel opens. */
          {...(open ? {} : floatY(3, 3.4))}
          className="relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-clay-sky shadow-clay-inset-sm"
        >
          <MascotFace size={46} />
        </motion.span>
      </motion.button>
    </div>
  );
}
