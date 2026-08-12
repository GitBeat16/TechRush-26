"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FlipbookDestination, FlipbookPlace } from "@/data/flipbookData";
import { ClayButton } from "@/components/ui/ClayButton";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompassIcon,
  InfoIcon,
  SparkIcon,
  StarIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { useFeedback } from "@/lib/feedback";
import "./flipbook.css";

export interface DestinationFlipbookProps {
  destination: FlipbookDestination;
}

/* ================================================================
   MAIN FLIPBOOK COMPONENT — Realistic 3D Page-Turn Engine
   ================================================================ */

export function DestinationFlipbook({ destination }: DestinationFlipbookProps) {
  const router = useRouter();
  const { play } = useFeedback();
  const bookRef = useRef<HTMLDivElement>(null);

  /* ── Build flat page list ──
     Page 0 = cover (full spread)
     Each place gets TWO pages: Left Page (Title, 4:3 Photo, Fun Fact) + Right Page (Info)
     Closing spread gets TWO pages: Left Page (Overview & Stats) + Right Page (Tips & CTA)
  */
  const pages = useMemo(() => {
    const p: Array<{
      type: "cover" | "place-left" | "place-right" | "closing-left" | "closing-right" | "blank";
      placeIndex?: number;
    }> = [];

    // Page 0: Cover
    p.push({ type: "cover" });

    // Each place gets a left page + a right page
    destination.places.forEach((_, i) => {
      p.push({ type: "place-left", placeIndex: i });
      p.push({ type: "place-right", placeIndex: i });
    });

    // Closing spread
    p.push({ type: "closing-left" });
    p.push({ type: "closing-right" });

    // Pad to even count so every leaf has two faces
    if (p.length % 2 !== 0) p.push({ type: "blank" });
    return p;
  }, [destination.places]);

  const totalContentPages = 1 + destination.places.length * 2 + 2; // cover (1) + places (2N) + closing (2)
  const numLeaves = Math.ceil(pages.length / 2);

  /* ── Core State ── */
  const [flippedCount, setFlippedCount] = useState(0);
  const [flipRequest, setFlipRequest] = useState<{
    leafIdx: number;
    dir: "forward" | "backward";
  } | null>(null);
  const [flipPhase, setFlipPhase] = useState<"idle" | "mounted" | "animating">("idle");
  const [isMobile, setIsMobile] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  const isFlipping = flipPhase !== "idle";

  // Responsive breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Flip lifecycle ── */

  // Phase 1: Mount leaf at start position
  useEffect(() => {
    if (flipRequest && flipPhase === "idle") {
      setFlipPhase("mounted");
    }
  }, [flipRequest, flipPhase]);

  // Phase 2: Double-rAF then animate
  useEffect(() => {
    if (flipPhase === "mounted") {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setFlipPhase("animating");
        });
        (window as any).__flipRaf2 = raf2;
      });
      return () => {
        cancelAnimationFrame(raf1);
        if ((window as any).__flipRaf2) cancelAnimationFrame((window as any).__flipRaf2);
      };
    }
  }, [flipPhase]);

  // Phase 3: Transition end callback
  const onTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.propertyName !== "transform") return;
    if (!flipRequest) return;

    if (flipRequest.dir === "forward") {
      setFlippedCount((c) => c + 1);
    } else {
      setFlippedCount((c) => c - 1);
    }
    setFlipRequest(null);
    setFlipPhase("idle");
  }, [flipRequest]);

  // Fallback timeout
  useEffect(() => {
    if (flipPhase === "animating" && flipRequest) {
      const timeout = setTimeout(() => {
        if (flipRequest.dir === "forward") {
          setFlippedCount((c) => c + 1);
        } else {
          setFlippedCount((c) => c - 1);
        }
        setFlipRequest(null);
        setFlipPhase("idle");
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [flipPhase, flipRequest]);

  /* ── Navigation actions ── */
  const flipForward = useCallback(() => {
    if (isFlipping || flippedCount >= numLeaves) return;
    play("whoosh");
    setFlipRequest({ leafIdx: flippedCount, dir: "forward" });
  }, [isFlipping, flippedCount, numLeaves, play]);

  const flipBackward = useCallback(() => {
    if (isFlipping || flippedCount <= 0) return;
    play("whoosh");
    setFlipRequest({ leafIdx: flippedCount - 1, dir: "backward" });
  }, [isFlipping, flippedCount, play]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); flipBackward(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); flipForward(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipForward, flipBackward]);

  // Touch / swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) flipForward(); else flipBackward();
      }
      touchStart.current = null;
    },
    [flipForward, flipBackward],
  );

  /* ── Render page by index ── */
  const renderPage = useCallback(
    (pageIdx: number) => {
      if (pageIdx < 0 || pageIdx >= pages.length) return null;
      const page = pages[pageIdx];

      if (page.type === "cover") {
        return <CoverPage destination={destination} onOpen={flipForward} />;
      }
      if (page.type === "closing-left") {
        return <ClosingLeftPage destination={destination} />;
      }
      if (page.type === "closing-right") {
        return <ClosingRightPage destination={destination} />;
      }
      if (page.type === "place-left" && page.placeIndex !== undefined) {
        return (
          <PlaceLeftPage
            place={destination.places[page.placeIndex]}
            placeNumber={page.placeIndex + 1}
            totalPages={totalContentPages}
            destinationName={destination.name}
          />
        );
      }
      if (page.type === "place-right" && page.placeIndex !== undefined) {
        return (
          <PlaceRightPage
            place={destination.places[page.placeIndex]}
            placeNumber={page.placeIndex + 1}
            totalPages={totalContentPages}
            destinationName={destination.name}
          />
        );
      }
      return <div className="flipbook-paper-texture w-full h-full" />;
    },
    [pages, destination, totalContentPages, flipForward],
  );

  /* ── Compute visible pages ── */
  const isFirstSpread = flippedCount === 0;
  const isLastSpread = flippedCount >= numLeaves;
  const isCoverVisible = isFirstSpread && !isFlipping;

  const leftPageIdx = flippedCount > 0 ? (flippedCount - 1) * 2 + 1 : null;
  const rightPageIdx = flippedCount < numLeaves ? flippedCount * 2 : null;

  /* ── Leaf transform style ── */
  const getFlipLeafStyle = (): React.CSSProperties => {
    if (!flipRequest) return {};
    const baseStyle: React.CSSProperties = {
      zIndex: numLeaves + 10,
      transformStyle: "preserve-3d" as const,
      ...(isMobile ? { left: 0, width: "100%" } : {}),
    };

    if (flipPhase === "mounted") {
      return {
        ...baseStyle,
        transition: "none",
        transform: flipRequest.dir === "forward" ? "rotateY(0deg)" : "rotateY(-180deg)",
      };
    }
    if (flipPhase === "animating") {
      return {
        ...baseStyle,
        transition: "transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1.0)",
        transform: flipRequest.dir === "forward" ? "rotateY(-180deg)" : "rotateY(0deg)",
        willChange: "transform",
      };
    }
    return baseStyle;
  };

  const currentDisplayPage = rightPageIdx !== null ? rightPageIdx + 1 : totalContentPages;

  return (
    <div className="min-h-screen bg-clay-bg py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center justify-between">
      {/* ─── Top Navigation Header ─── */}
      <header className="w-full max-w-6xl flex items-center justify-between gap-4 mb-6">
        <button
          onClick={() => { play("nav"); router.push("/explore"); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-clay-surface shadow-clay-sm hover:shadow-clay transition-all duration-200 text-clay-ink font-body text-xs font-bold"
        >
          <ArrowLeftIcon size={16} />
          Back to Destinations
        </button>

        <div className="text-center hidden sm:block">
          <h1 className="font-display text-base font-bold text-clay-ink">
            Wanderly Travel Magazine
          </h1>
        </div>

        <Link href={`/plan?destination=${encodeURIComponent(destination.name)}`}>
          <ClayButton size="sm" tone="butter" rightIcon={<ArrowRightIcon size={14} />} sound="nav">
            Plan {destination.name}
          </ClayButton>
        </Link>
      </header>

      {/* ─── Book Shell ─── */}
      <main className="w-full max-w-6xl flex-1 flex items-center justify-center relative my-2">
        <div className="flipbook-scene w-full flex items-center justify-center">
          <div
            ref={bookRef}
            className={`flipbook-book flipbook-book-shadow ${isMobile ? "mobile-mode" : ""}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            {/* Book thickness edges */}
            {!isMobile && <div className="flipbook-thickness-left" />}
            {!isMobile && <div className="flipbook-thickness-right" />}

            {/* Base paper behind everything */}
            <div className="absolute inset-0 flipbook-paper-texture rounded" style={{ zIndex: 0 }} />

            {/* ── COVER: full-bleed spread ── */}
            {isCoverVisible && (
              <div className="absolute inset-0 overflow-hidden rounded" style={{ zIndex: 5 }}>
                {renderPage(0)}
              </div>
            )}

            {/* ── Static left page ── */}
            {!isCoverVisible && !isMobile && leftPageIdx !== null && (
              <div className="flipbook-static-left flipbook-paper-texture">
                <div className="flipbook-page-content">
                  {renderPage(leftPageIdx)}
                </div>
              </div>
            )}

            {/* ── Static right page ── */}
            {!isCoverVisible && rightPageIdx !== null && (
              <div
                className="flipbook-static-right flipbook-paper-texture"
                style={isMobile ? { left: 0, width: "100%" } : undefined}
              >
                <div className="flipbook-page-content">
                  {renderPage(rightPageIdx)}
                </div>
              </div>
            )}

            {/* ── Revealed page underneath during forward flip ── */}
            {isFlipping && flipRequest?.dir === "forward" && (
              <>
                <div
                  className="flipbook-static-right flipbook-paper-texture flipbook-revealed"
                  style={{ zIndex: 3, ...(isMobile ? { left: 0, width: "100%" } : {}) }}
                >
                  <div className="flipbook-page-content">
                    {renderPage((flippedCount + 1) < numLeaves ? (flippedCount + 1) * 2 : -1)}
                  </div>
                </div>
                {!isMobile && (
                  <div className="flipbook-static-left flipbook-paper-texture flipbook-revealed" style={{ zIndex: 3 }}>
                    <div className="flipbook-page-content">
                      {renderPage(flippedCount * 2 + 1)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Revealed page underneath during backward flip ── */}
            {isFlipping && flipRequest?.dir === "backward" && (
              <>
                <div
                  className="flipbook-static-right flipbook-paper-texture flipbook-revealed"
                  style={{ zIndex: 3, ...(isMobile ? { left: 0, width: "100%" } : {}) }}
                >
                  <div className="flipbook-page-content">
                    {renderPage((flippedCount - 1) * 2)}
                  </div>
                </div>
                {!isMobile && flippedCount >= 2 && (
                  <div className="flipbook-static-left flipbook-paper-texture flipbook-revealed" style={{ zIndex: 3 }}>
                    <div className="flipbook-page-content">
                      {renderPage((flippedCount - 2) * 2 + 1)}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Backward flip revealing cover spread ── */}
            {isFlipping && flipRequest?.dir === "backward" && flippedCount === 1 && (
              <div className="absolute inset-0 overflow-hidden rounded" style={{ zIndex: 3 }}>
                {renderPage(0)}
              </div>
            )}

            {/* ── THE FLIPPING LEAF ── */}
            {flipRequest && flipPhase !== "idle" && (
              <div
                className="flipbook-leaf"
                style={getFlipLeafStyle()}
                onTransitionEnd={onTransitionEnd}
              >
                {/* Front face */}
                <div className="flipbook-face flipbook-face-front flipbook-paper-texture">
                  <div className="flipbook-page-content">
                    {renderPage(flipRequest.leafIdx * 2)}
                  </div>
                  <div className="flipbook-fold-shadow" style={{ opacity: flipPhase === "animating" ? 1 : 0 }} />
                </div>

                {/* Back face */}
                <div className="flipbook-face flipbook-face-back flipbook-back-paper">
                  <div className="flipbook-page-content">
                    {renderPage(flipRequest.leafIdx * 2 + 1)}
                  </div>
                </div>
              </div>
            )}

            {/* ── Page-corner hover lift ── */}
            {!isFlipping && !isLastSpread && !isCoverVisible && hoverRight && !isMobile && (
              <div
                className="flipbook-leaf"
                style={{
                  zIndex: numLeaves + 5,
                  transform: "rotateY(-8deg)",
                  transition: "transform 0.35s ease",
                  pointerEvents: "none",
                }}
              >
                <div className="flipbook-face flipbook-face-front flipbook-paper-texture">
                  <div className="flipbook-page-content" style={{ opacity: 0.7 }}>
                    {rightPageIdx !== null && renderPage(rightPageIdx)}
                  </div>
                </div>
                <div className="flipbook-face flipbook-face-back flipbook-back-paper" />
              </div>
            )}

            {/* ── Flip shadows ── */}
            <div className={`flipbook-shadow-right ${isFlipping && flipRequest?.dir === "forward" && flipPhase === "animating" ? "active" : ""}`} />
            {!isMobile && (
              <div className={`flipbook-shadow-left ${isFlipping && flipRequest?.dir === "backward" && flipPhase === "animating" ? "active" : ""}`} />
            )}

            {/* ── Spine & gutters ── */}
            {!isMobile && !isCoverVisible && (
              <>
                <div className="flipbook-spine" />
                <div className="flipbook-gutter-left" />
                <div className="flipbook-gutter-right" />
              </>
            )}

            {/* ── Click hotspots ── */}
            {!isFirstSpread && !isFlipping && (
              <div
                className="flipbook-hotspot flipbook-hotspot-left"
                onClick={flipBackward}
                title="Previous page (← arrow key)"
              >
                <span className="flipbook-hotspot-btn">
                  <ChevronLeftIcon size={20} />
                </span>
              </div>
            )}
            {!isLastSpread && !isFlipping && (
              <div
                className="flipbook-hotspot flipbook-hotspot-right"
                onClick={flipForward}
                onMouseEnter={() => setHoverRight(true)}
                onMouseLeave={() => setHoverRight(false)}
                title="Next page (→ arrow key)"
              >
                <span className="flipbook-hotspot-btn">
                  <ChevronRightIcon size={20} />
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Bottom Navigation Controls ─── */}
      <footer className="w-full max-w-5xl mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClayButton
            size="sm"
            tone="surface"
            disabled={isFirstSpread || isFlipping}
            onClick={flipBackward}
            leftIcon={<ChevronLeftIcon size={16} />}
            sound="whoosh"
          >
            Previous
          </ClayButton>

          <span className="font-display text-xs font-bold text-clay-ink px-3 py-1.5 rounded-full bg-clay-sunken shadow-clay-inset-sm">
            Page {currentDisplayPage} of {totalContentPages}
          </span>

          <ClayButton
            size="sm"
            tone="surface"
            disabled={isLastSpread || isFlipping}
            onClick={flipForward}
            rightIcon={<ChevronRightIcon size={16} />}
            sound="whoosh"
          >
            Next Page
          </ClayButton>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: numLeaves + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx > flippedCount) flipForward();
                else if (idx < flippedCount) flipBackward();
              }}
              aria-label={`Go to spread ${idx + 1}`}
              className={[
                "h-2.5 rounded-full transition-all duration-300",
                idx === flippedCount
                  ? "w-7 bg-clay-ink shadow-clay-xs"
                  : "w-2.5 bg-clay-muted/40 hover:bg-clay-muted",
              ].join(" ")}
            />
          ))}
        </div>

        <p className="font-body text-[11px] text-clay-muted hidden md:block">
          Tip: Use{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-clay-raised shadow-clay-xs font-mono text-[10px]">←</kbd>{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-clay-raised shadow-clay-xs font-mono text-[10px]">→</kbd>{" "}
          arrow keys to turn pages
        </p>
      </footer>
    </div>
  );
}

/* ================================================================
   Cover Page
   ================================================================ */

function CoverPage({
  destination,
  onOpen,
}: {
  destination: FlipbookDestination;
  onOpen: () => void;
}) {
  return (
    <div className="relative w-full h-full min-h-[520px] flex flex-col justify-between p-6 sm:p-10 text-white overflow-hidden select-none">
      <img
        src={destination.coverImage}
        alt={destination.name}
        className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-1000 hover:scale-105"
        style={{ objectPosition: destination.coverPosition ?? "center center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60 z-10" />

      <div className="relative z-20 my-auto text-center px-2 pt-6">
        <p className="font-body text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-clay-butter">
          Special Travel Edition
        </p>
        <h1 className="mt-2 font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white drop-shadow-2xl">
          {destination.name}
        </h1>
        <p className="mt-3 max-w-xl mx-auto font-body text-sm sm:text-lg font-medium leading-relaxed text-white/90 drop-shadow-md">
          &quot;{destination.subtitle}&quot;
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {destination.places.slice(0, 5).map((place) => (
            <span
              key={place.id}
              className="bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-body font-semibold text-white/90 border border-white/20"
            >
              • {place.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-20 flex justify-end border-t border-white/20 pt-6">
        <ClayButton tone="butter" onClick={onOpen} rightIcon={<ArrowRightIcon size={16} />} sound="whoosh">
          Open Magazine
        </ClayButton>
      </div>
    </div>
  );
}

/* ================================================================
   Place Left Page — Title, Subtitle, 4:3 Photo & Fun Fact (Newspaper Gazette)
   ================================================================ */

function PlaceLeftPage({
  place,
  placeNumber,
  totalPages,
  destinationName,
}: {
  place: FlipbookPlace;
  placeNumber: number;
  totalPages: number;
  destinationName: string;
}) {
  const pageNum = placeNumber * 2;
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 newspaper-page text-clay-ink overflow-hidden select-none relative">
      {/* Newspaper Background Watermark Stamp */}
      <div className="pointer-events-none absolute right-3 bottom-12 opacity-[0.05] select-none transform rotate-12 z-0">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-clay-ink flex flex-col items-center justify-center text-center p-1">
          <span className="font-mono text-[7px] font-bold uppercase tracking-widest">WANDERLY</span>
          <span className="font-display text-[10px] font-black uppercase tracking-tighter">GAZETTE</span>
          <span className="font-mono text-[6px] tracking-widest">VOL. 2026</span>
        </div>
      </div>

      {/* Top Header */}
      <div className="shrink-0 z-10">
        <div className="flex items-center justify-between pb-1">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-clay-ink-soft">
            THE {destinationName.toUpperCase()} CHRONICLE
          </span>
          <span className="font-mono text-[9px] font-bold text-clay-muted">
            PAGE {String(pageNum).padStart(2, "0")} / {totalPages}
          </span>
        </div>
        {/* Double hairline rule — classic newspaper masthead */}
        <div className="border-t-[3px] border-b border-clay-ink/25 py-0.5 flex items-center justify-between text-[8px] font-mono tracking-widest text-clay-muted uppercase mt-0.5">
          <span>FEATURE {String(placeNumber).padStart(2, "0")}</span>
          <span>SPECIAL EDITION</span>
          <span>DISPATCH NO. {placeNumber * 7}</span>
        </div>
      </div>

      {/* Place Title & Subtitle */}
      <div className="pt-1.5 shrink-0 z-10 text-center">
        <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-clay-ink tracking-tight leading-none uppercase">
          {place.name}
        </h2>
        <p className="mt-1 font-body text-[11px] font-bold text-clay-tangerine italic tracking-wide">
          {place.subtitle}
        </p>
      </div>

      {/* 4:3 Aspect Ratio Photography with Vintage Frame */}
      <div className="relative w-[75%] max-w-[340px] mx-auto aspect-[4/3] rounded overflow-hidden shadow-clay-sm border-[3px] border-clay-ink/15 group my-2 shrink-0 z-10 p-0.5 bg-clay-surface">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 rounded-sm"
        />
      </div>

      {/* Newspaper Fun Fact Box */}
      <div className="mx-1 px-3 py-2 rounded bg-clay-sunken/40 border-t-[3px] border-b-[3px] border-clay-ink/20 shrink-0 z-10 shadow-clay-inset-sm">
        <h4 className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-clay-ink flex items-center justify-center gap-2 mb-1.5 opacity-80">
          <span className="h-[1px] flex-1 bg-clay-ink/20"></span>
          GAZETTE NOTE • FUN FACT
          <span className="h-[1px] flex-1 bg-clay-ink/20"></span>
        </h4>
        <p className="font-body text-xs sm:text-[13px] font-medium text-clay-ink-soft leading-snug text-center text-balance italic">
          "{place.funFact || place.bestExperience}"
        </p>
      </div>

      {/* Page Footer */}
      <div className="border-t border-clay-ink/15 pt-1.5 flex items-center justify-between shrink-0 text-[8px] font-mono tracking-widest text-clay-muted uppercase z-10">
        <span>WANDERLY PRINT EDITION</span>
        <span>{String(pageNum).padStart(2, "0")}</span>
      </div>
    </div>
  );
}

/* ================================================================
   Place Right Page — Detailed Info (Newspaper Prose Layout)
   ================================================================ */

function PlaceRightPage({
  place,
  placeNumber,
  totalPages,
  destinationName,
}: {
  place: FlipbookPlace;
  placeNumber: number;
  totalPages: number;
  destinationName: string;
}) {
  const pageNum = placeNumber * 2 + 1;
  const expText = place.bestExperience.slice(0, 1).toLowerCase() + place.bestExperience.slice(1);
  const firstLetter = place.description.charAt(0);
  const restDescription = place.description.slice(1);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 newspaper-page text-clay-ink overflow-hidden select-none relative">
      {/* Faint Background Watermark Text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] select-none z-0 transform -rotate-12">
        <span className="font-display font-black text-6xl text-clay-ink tracking-widest uppercase">
          {place.name}
        </span>
      </div>

      {/* Top Header */}
      <div className="shrink-0 z-10 mb-2">
        <div className="flex items-center justify-between pb-1.5">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-clay-ink-soft">
            EDITORIAL DISPATCH • {place.name.toUpperCase()}
          </span>
          <span className="font-mono text-[9px] font-bold text-clay-muted">
            PAGE {String(pageNum).padStart(2, "0")} / {totalPages}
          </span>
        </div>
        {/* Double hairline rule */}
        <div className="border-t-[3px] border-b border-clay-ink/25 py-0.5 flex items-center justify-between text-[8px] font-mono tracking-widest text-clay-muted uppercase">
          <span>DESTINATION JOURNAL</span>
          <span>PRINT GAZETTE</span>
        </div>
      </div>

      {/* Newspaper Narrative Prose with Drop Cap */}
      <div className="flex-1 flex flex-col justify-center space-y-3.5 py-2 overflow-hidden z-10">
        {/* Paragraph 1: Main Description with Drop Cap */}
        <p className="font-body text-xs sm:text-sm leading-relaxed text-clay-ink font-medium pl-1">
          <span className="float-left font-display text-3xl font-black leading-none pr-2 pt-0.5 text-clay-ink select-none uppercase">
            {firstLetter}
          </span>
          {restDescription}
        </p>

        {/* Newspaper Pull Quote Line */}
        <div className="border-y border-clay-ink/20 py-1.5 my-1 text-center shrink-0">
          <p className="font-body text-xs italic font-semibold text-clay-ink-soft tracking-wide">
            &ldquo;{place.subtitle}&rdquo;
          </p>
        </div>

        {/* Paragraph 2: Continuous Travel Prose */}
        <p className="font-body text-xs sm:text-sm leading-relaxed text-clay-ink-soft">
          {place.whyVisit.endsWith(".") ? place.whyVisit : `${place.whyVisit}.`}{" "}
          For an unforgettable journey, enjoy {expText.endsWith(".") ? expText : `${expText}.`}
        </p>

        {/* Paragraph 3: Best Time to Visit */}
        <p className="font-body text-xs sm:text-sm leading-relaxed text-clay-ink-soft">
          The optimal travel season to visit {place.name} is {place.bestTime}.
        </p>
      </div>

      {/* Page Footer & Plan CTA Link */}
      <div className="border-t border-clay-ink/15 pt-1.5 flex items-center justify-between shrink-0 text-[8px] font-mono tracking-widest text-clay-muted uppercase z-10">
        <Link
          href={`/plan?destination=${encodeURIComponent(destinationName)}`}
          className="font-body text-xs font-bold text-clay-ink hover:text-clay-tangerine transition-colors flex items-center gap-1 normal-case font-sans"
        >
          Add {place.name} to Trip Plan <ArrowRightIcon size={12} />
        </Link>
        <span>{String(pageNum).padStart(2, "0")}</span>
      </div>
    </div>
  );
}

/* ================================================================
   Closing Left Page — Summary Stats & Overview (No scroll)
   ================================================================ */

function ClosingLeftPage({ destination }: { destination: FlipbookDestination }) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-clay-surface text-clay-ink overflow-hidden select-none">
      <div className="flex items-center justify-between border-b border-clay-muted/15 pb-2 shrink-0">
        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
          Essential Travel Guide
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
        <div>
          <span className="font-body text-[10px] font-extrabold uppercase tracking-widest text-clay-tangerine">
            Overview & Planning
          </span>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-clay-ink tracking-tight">
            Ready for {destination.name}?
          </h2>
          <p className="mt-1.5 font-body text-xs sm:text-sm text-clay-ink-soft leading-relaxed">
            Key facts, optimal travel seasons, and estimated budgets before you take off.
          </p>
        </div>

        {/* Clean Plain Stat Rows */}
        <div className="space-y-3 pt-1">
          <StatRow label="Best Season" value={destination.closing.bestSeason} />
          <StatRow label="Suggested Duration" value={destination.closing.suggestedDuration} />
          <StatRow label="Est. Budget" value={destination.closing.budgetEstimate} />
        </div>
      </div>

      <div className="border-t border-clay-muted/15 pt-2 shrink-0">
        <span className="font-body text-[9px] text-clay-muted">
          Wanderly Practical Travel Guide
        </span>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-clay-muted/15 pb-2">
      <p className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
        {label}
      </p>
      <p className="font-display text-xs sm:text-sm font-bold text-clay-ink mt-0.5">
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   Closing Right Page — Tips & Plan CTA (No scroll)
   ================================================================ */

function ClosingRightPage({ destination }: { destination: FlipbookDestination }) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-clay-surface text-clay-ink overflow-hidden select-none">
      <div className="flex items-center justify-between border-b border-clay-muted/15 pb-2 shrink-0">
        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
          Pro Tips & Itinerary
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-4 py-2">
        <h3 className="font-display text-xs font-extrabold uppercase tracking-wider text-clay-ink">
          Essential Travel Tips
        </h3>
        <div className="space-y-2">
          {destination.closing.travelTips.map((tip, idx) => (
            <p key={idx} className="font-body text-xs text-clay-ink-soft leading-relaxed pl-2 border-l border-clay-tangerine/40">
              • {tip}
            </p>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-clay-muted/15 flex flex-col gap-2.5">
          <div>
            <h4 className="font-display text-base font-bold text-clay-ink">
              {destination.closing.ctaText}
            </h4>
            <p className="font-body text-xs text-clay-ink-soft mt-0.5">
              Build a personalized day-by-day itinerary, budget tracker, and packing list.
            </p>
          </div>

          <div>
            <Link href={`/plan?destination=${encodeURIComponent(destination.name)}`}>
              <ClayButton
                size="sm"
                tone="butter"
                rightIcon={<ArrowRightIcon size={14} />}
                sound="nav"
              >
                Plan Trip Now
              </ClayButton>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-clay-muted/15 pt-2 shrink-0">
        <span className="font-body text-[9px] text-clay-muted">
          Wanderly Digital Magazines
        </span>
      </div>
    </div>
  );
}
