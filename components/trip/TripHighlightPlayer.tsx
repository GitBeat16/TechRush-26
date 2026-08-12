"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShareIcon,
  SoundOffIcon,
  SoundOnIcon,
  SparkIcon,
} from "@/components/ui/Icons";
import { photoPlaceholder } from "@/lib/image-placeholder";
import { fetchHighlight } from "@/lib/highlights";
import { buildHighlightStoryboard } from "@/lib/highlights-ai";
import { fetchPhotoDumps } from "@/lib/photo-dumps";
import { useFeedback } from "@/lib/feedback";
import type { HighlightSlide, TripHighlight } from "@/types/highlights";
import type { Trip } from "@/types/dashboard";

const TONE_BG: Record<HighlightSlide["type"], string> = {
  intro: "linear-gradient(160deg, #f9b384, #f7a8b8)",
  location: "linear-gradient(160deg, #bfe9d5, #c3dcfb)",
  ending: "linear-gradient(160deg, #dcd2fb, #f9b384)",
  photo: "#121210",
};

const TRANSITIONS = [
  {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.04 },
    transition: { duration: 0.45, ease: "easeOut" },
  },
  {
    initial: { opacity: 0, x: "20%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "-10%" },
    transition: { duration: 0.45, ease: "easeInOut" },
  },
  {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4 },
  },
];

/* ------------------------------------------------------------------ */
/* Procedural Music Player — loops atmospheric travel pads.            */
/* ------------------------------------------------------------------ */
class ProceduralMusicPlayer {
  private ctx: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentChord = 0;
  private isPlaying = false;
  private chords = [
    [130.81, 164.81, 196.0, 246.94], // C maj 7
    [174.61, 220.0, 261.63, 329.63], // F maj 7
    [146.83, 174.61, 220.0, 293.66], // D min 7
    [196.0, 246.94, 293.66, 392.0], // G maj
  ];

  start() {
    if (typeof window === "undefined" || this.isPlaying) return;
    this.isPlaying = true;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = "lowpass";
        this.filter.frequency.setValueAtTime(800, this.ctx.currentTime);

        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);

        this.gainNode.connect(this.filter);
        this.filter.connect(this.ctx.destination);
      }

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.playNextChord();
      this.intervalId = setInterval(() => this.playNextChord(), 3200);
    } catch {
      // Ignore audio synthesis errors on start
    }
  }

  private playNextChord() {
    if (!this.ctx || !this.gainNode) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.currentChord];
    this.currentChord = (this.currentChord + 1) % this.chords.length;

    // Fade out previous active voices
    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        setTimeout(() => {
          try {
            osc.stop();
          } catch {}
        }, 1100);
      } catch {}
    });
    this.activeOscillators = [];

    // Trigger new voices
    chord.forEach((freq) => {
      if (!this.ctx || !this.gainNode) return;
      try {
        const osc = this.ctx.createOscillator();
        const voiceGain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        voiceGain.gain.setValueAtTime(0.0001, now);
        voiceGain.gain.linearRampToValueAtTime(0.02, now + 1.2); // attack
        voiceGain.gain.setValueAtTime(0.02, now + 2.2);
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2); // release

        osc.connect(voiceGain);
        voiceGain.connect(this.gainNode);

        osc.start(now);
        osc.stop(now + 3.2);

        this.activeOscillators.push({ osc, gain: voiceGain });
      } catch {}
    });
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const now = this.ctx?.currentTime || 0;
    this.activeOscillators.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
        setTimeout(() => {
          try {
            osc.stop();
          } catch {}
        }, 500);
      } catch {}
    });
    this.activeOscillators = [];
  }
}

/* ------------------------------------------------------------------ */
/* Client-Side Canvas-to-Video Exporter                                */
/* ------------------------------------------------------------------ */
async function exportHighlightVideo(
  slides: HighlightSlide[],
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  // Preload all image assets
  const images: Record<string, HTMLImageElement> = {};
  const photoSlides = slides.filter((s) => s.type === "photo" && s.photoUrl);

  await Promise.all(
    photoSlides.map((slide) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // avoid tainted canvas CORS issues
        img.onload = () => {
          images[slide.photoUrl!] = img;
          resolve();
        };
        img.onerror = () => resolve(); // continue even if one fails
        img.src = slide.photoUrl!;
      });
    }),
  );

  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d")!;

  const fps = 30;
  const stream = canvas.captureStream(fps);

  let options = { mimeType: "video/webm;codecs=vp9" };
  if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm" };
  }

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, options);
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalDuration = slides.reduce((acc, s) => acc + s.duration, 0);
  const totalFrames = Math.ceil(totalDuration * fps);

  recorder.start();

  for (let f = 0; f < totalFrames; f++) {
    const time = f / fps;
    let slideAccum = 0;
    let currentSlide = slides[0];

    for (let i = 0; i < slides.length; i++) {
      if (time >= slideAccum && time < slideAccum + slides[i].duration) {
        currentSlide = slides[i];
        break;
      }
      slideAccum += slides[i].duration;
    }

    if (time >= totalDuration) {
      currentSlide = slides[slides.length - 1];
      slideAccum = totalDuration - currentSlide.duration;
    }

    const slideTime = time - slideAccum;
    const slideProgress = slideTime / currentSlide.duration;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentSlide.type === "photo") {
      const img = images[currentSlide.photoUrl!];
      if (img) {
        // Draw blurred cover backdrop
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.filter = "blur(30px)";
        const scaleBg = Math.max(canvas.width / img.width, canvas.height / img.height) * 1.15;
        const wBg = img.width * scaleBg;
        const hBg = img.height * scaleBg;
        ctx.drawImage(img, (canvas.width - wBg) / 2, (canvas.height - hBg) / 2, wBg, hBg);
        ctx.restore();

        // Draw centered photo with Ken Burns panning/zooming
        ctx.save();
        const kbScale = 1.0 + 0.08 * slideProgress;
        const kbX = -10 + 20 * slideProgress;
        const kbY = -8 + 16 * slideProgress;

        const scaleFg = Math.min(canvas.width / img.width, canvas.height / img.height);
        const wFg = img.width * scaleFg * kbScale;
        const hFg = img.height * scaleFg * kbScale;

        ctx.translate(canvas.width / 2 + kbX, canvas.height / 2 + kbY);
        ctx.drawImage(img, -wFg / 2, -hFg / 2, wFg, hFg);
        ctx.restore();
      } else {
        ctx.fillStyle = "#161614";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw top header metadata overlay
      if (currentSlide.albumName) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, 130);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(currentSlide.albumName.toUpperCase(), 40, 60);

        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(currentSlide.albumDetails || "", 40, 95);
        ctx.restore();
      }

      // Draw bottom caption overlay
      if (currentSlide.text) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(currentSlide.text, canvas.width / 2, canvas.height - 60);
        ctx.restore();
      }
    } else {
      // Intro, Location, or Ending text slide
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (currentSlide.type === "intro") {
        grad.addColorStop(0, "#f9b384");
        grad.addColorStop(1, "#f7a8b8");
      } else if (currentSlide.type === "ending") {
        grad.addColorStop(0, "#dcd2fb");
        grad.addColorStop(1, "#f9b384");
      } else {
        grad.addColorStop(0, "#bfe9d5");
        grad.addColorStop(1, "#c3dcfb");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";

      if (currentSlide.type === "location") {
        ctx.fillStyle = "#4a3a30";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(currentSlide.text || "", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#7c6558";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(currentSlide.albumDetails || "", canvas.width / 2, canvas.height / 2 + 35);
      } else if (currentSlide.type === "ending") {
        ctx.fillStyle = "#4a3a30";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText(currentSlide.text || "See you on the next adventure ✈️", canvas.width / 2, canvas.height / 2);
      } else {
        ctx.font = "bold 48px sans-serif";
        ctx.fillText(currentSlide.text || "YOUR TRIP HIGHLIGHTS", canvas.width / 2, canvas.height / 2 - 25);

        ctx.font = "bold 24px sans-serif";
        ctx.fillText("A little rewind of your adventures", canvas.width / 2, canvas.height / 2 + 35);
      }
    }

    onProgress?.((f + 1) / totalFrames);
    await new Promise((r) => requestAnimationFrame(r));
  }

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: options.mimeType });
      resolve(blob);
    };
    recorder.stop();
  });
}

const CloseIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const FullscreenIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Main TripHighlightPlayer Component                                  */
/* ------------------------------------------------------------------ */
export function TripHighlightPlayer({
  trip,
  onAddMemory,
}: {
  trip: Trip;
  onAddMemory: () => void;
}) {
  const { play } = useFeedback();
  const [highlight, setHighlight] = useState<TripHighlight | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Fullscreen player states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [muted, setMuted] = useState(true); // Default muted to comply with browser audio policies
  const [showShareMenu, setShowShareMenu] = useState(false);

  function handleRegenerate() {
    play("pop");
    if (!highlight || !highlight.slides) return;
    const ENDINGS = [
      "See you on the next adventure ✈️",
      "Until the next adventure ✈️",
      "More memories, coming soon 🌅",
      "Same time next year? 🌴",
      "To be continued…",
    ];

    const photos = highlight.slides.filter((s) => s.type === "photo");
    const shuffledPhotos = [...photos].sort(() => Math.random() - 0.5);

    let pIdx = 0;
    const newSlides = highlight.slides.map((slide) => {
      if (slide.type === "photo" && shuffledPhotos[pIdx]) {
        const item = shuffledPhotos[pIdx++];
        return { ...slide, photoUrl: item.photoUrl, text: item.text };
      }
      if (slide.type === "ending") {
        return { ...slide, text: ENDINGS[Math.floor(Math.random() * ENDINGS.length)] };
      }
      return slide;
    });

    setHighlight({
      ...highlight,
      slides: newSlides,
    });
    setIndex(0);
  }

  function handleShareOption(target: string) {
    const text = `${highlight?.title} — ${highlight?.subtitle}`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    setShowShareMenu(false);
    play("tap");

    if (target === "device" && navigator.share) {
      navigator.share({ title: highlight?.title, text, url }).catch(() => {});
    } else if (target === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    } else if (target === "x") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
      );
    } else if (target === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
      );
    } else if (target === "instagram") {
      navigator.clipboard?.writeText(text);
      window.open("https://www.instagram.com/", "_blank");
    } else if (target === "copy") {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  const elapsedRef = useRef(0);
  const musicRef = useRef<ProceduralMusicPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Load highlight from server API or build dynamically from client photo dumps
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchHighlight(trip.id);
        if (result && result.slides && result.slides.length > 0 && !cancelled) {
          setHighlight(result);
          return;
        }
      } catch {
        // Continue to fallback lookup
      }

      try {
        const dumps = await fetchPhotoDumps(trip.id).catch(() => []);
        if (dumps && dumps.length > 0 && !cancelled) {
          const storyboard = await buildHighlightStoryboard(
            [{ id: trip.id, title: trip.title, country: trip.country, days: trip.days }],
            { [trip.id]: dumps },
          );

          if (storyboard && !cancelled) {
            setHighlight({
              id: trip.id,
              tripId: trip.id,
              ...storyboard,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            return;
          }
        }
      } catch (err) {
        console.error("Client highlight generation error:", err);
      }

      if (!cancelled) {
        setHighlight(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  // Handle body overflow lock during fullscreen modal
  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreenOpen]);

  // Procedural music player instantiation
  useEffect(() => {
    if (typeof window !== "undefined") {
      musicRef.current = new ProceduralMusicPlayer();
    }
    return () => {
      musicRef.current?.stop();
    };
  }, []);

  // Sync music state with player states
  useEffect(() => {
    if (musicRef.current) {
      if (isFullscreenOpen && playing && !muted) {
        musicRef.current.start();
      } else {
        musicRef.current.stop();
      }
    }
  }, [isFullscreenOpen, playing, muted]);

  const slides = highlight?.slides ?? [];
  const current = slides[index];

  const advance = useCallback(() => {
    setIndex((i) => (i + 1 < slides.length ? i + 1 : i));
  }, [slides.length]);

  // Reset progress when index changes asynchronously to satisfy ESLint
  useEffect(() => {
    elapsedRef.current = 0;
    requestAnimationFrame(() => {
      setProgress(0);
    });
  }, [index]);

  // Slideshow advance timer ticker
  useEffect(() => {
    if (!playing || !current || !isFullscreenOpen) return;
    const durationMs = current.duration * 1000;
    const tick = setInterval(() => {
      elapsedRef.current += 100;
      const pct = Math.min(100, (elapsedRef.current / durationMs) * 100);
      setProgress(pct);

      if (elapsedRef.current >= durationMs) {
        if (index + 1 < slides.length) {
          advance();
        } else {
          setPlaying(false);
        }
      }
    }, 100);
    return () => clearInterval(tick);
  }, [playing, current, index, slides.length, advance, isFullscreenOpen]);

  async function handleExportVideo() {
    if (busy || !slides.length) return;
    setBusy(true);
    setExportProgress(0);
    setError(null);
    play("press");

    try {
      const blob = await exportHighlightVideo(slides, (p) => {
        setExportProgress(p);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wanderly-trip-highlights.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      play("success");
    } catch (err) {
      console.error(err);
      setError("Failed to generate and download video file.");
      play("toggleOff");
    } finally {
      setBusy(false);
      setExportProgress(null);
    }
  }

  const toggleBrowserFullscreen = () => {
    play("tap");
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 1. Loading State
  if (highlight === undefined) {
    return (
      <ClayCard tone="surface" radius="lg" depth="sm" className="p-8 text-center">
        <p className="font-body text-sm text-clay-muted animate-pulse">Loading highlights…</p>
      </ClayCard>
    );
  }

  // 2. Empty State (No memories exist)
  if (highlight === null) {
    return (
      <ClayCard tone="surface" radius="lg" depth="sm" className="p-8 text-center">
        <SparkIcon size={26} className="mx-auto text-clay-muted animate-pulse" />
        <p className="mt-4 font-display text-lg font-semibold text-clay-ink">
          Your adventures are waiting to be remembered.
        </p>
        <p className="mx-auto mt-1 max-w-sm font-body text-sm text-clay-ink-soft">
          Create your first memory to start building your Highlight.
        </p>
        {error && <p className="mt-2 font-body text-xs font-semibold text-clay-tangerine">{error}</p>}
        <ClayButton
          className="mx-auto mt-4"
          tone="butter"
          leftIcon={<PlusIcon size={16} />}
          onClick={onAddMemory}
        >
          + Add Memory
        </ClayButton>
      </ClayCard>
    );
  }

  // Find the first photo URL to display as cover image
  const firstPhotoSlide = slides.find((s) => s.type === "photo" && s.photoUrl);
  const firstPhotoUrl = firstPhotoSlide?.photoUrl;
  const transitionEffect = TRANSITIONS[index % TRANSITIONS.length];

  // 3. Normal State — show highlight card and actions
  return (
    <>
      <ClayCard tone="surface" radius="lg" depth="sm" className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <SparkIcon size={20} className="text-clay-rose" />
            <div>
              <p className="font-display text-base font-semibold">{highlight.title}</p>
              <p className="font-body text-xs text-clay-muted">{highlight.subtitle}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 relative">
            <ClayButton
              size="sm"
              variant="primary"
              tone="butter"
              leftIcon={<PlayIcon size={14} />}
              onClick={() => {
                setIndex(0);
                setPlaying(true);
                setIsFullscreenOpen(true);
                play("pop");
              }}
            >
              Watch Highlight
            </ClayButton>
            <ClayButton
              size="sm"
              tone="surface"
              disabled={busy}
              onClick={handleExportVideo}
              leftIcon={<CameraIcon size={14} />}
            >
              {exportProgress !== null
                ? `Exporting ${Math.round(exportProgress * 100)}%`
                : "Create Video"}
            </ClayButton>
            <ClayButton
              size="sm"
              tone="surface"
              onClick={handleRegenerate}
              leftIcon={<SparkIcon size={14} />}
            >
              Regenerate
            </ClayButton>
            <ClayButton
              size="sm"
              tone="surface"
              onClick={() => setShowShareMenu((s) => !s)}
              leftIcon={<ShareIcon size={14} />}
            >
              {copied ? "Copied!" : "Share"}
            </ClayButton>

            {showShareMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-clay-sm bg-clay-raised p-2 shadow-clay-md border border-clay-ink/10 flex flex-col gap-1 text-left">
                <button
                  type="button"
                  onClick={() => handleShareOption("device")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  📱 Share via device
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOption("whatsapp")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOption("x")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  ✕ X (Twitter)
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOption("facebook")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  📘 Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOption("instagram")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  📸 Instagram
                </button>
                <button
                  type="button"
                  onClick={() => handleShareOption("copy")}
                  className="flex items-center gap-2 rounded-clay-xs p-2 text-xs font-bold text-clay-ink hover:bg-clay-sunken text-left transition-colors"
                >
                  🔗 Copy caption
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mb-2 font-body text-xs font-semibold text-clay-tangerine">{error}</p>}

        <div
          onClick={() => {
            setIndex(0);
            setPlaying(true);
            setIsFullscreenOpen(true);
            play("pop");
          }}
          className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-clay bg-clay-sunken hover:shadow-clay-sm transition-shadow group"
        >
          {firstPhotoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firstPhotoUrl}
                alt="Highlights cover"
                className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-5">
                <span className="font-display text-base font-bold text-white flex items-center gap-1.5">
                  <PlayIcon size={14} className="fill-white stroke-none" /> Play Travel Reel
                </span>
                <span className="font-body text-[11px] text-white/80 mt-0.5">
                  Cinematic photo transitions & procedural ambient synthesizer loop
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8 text-center bg-gradient-to-tr from-clay-peach to-clay-blush">
              <SparkIcon size={32} className="text-white animate-pulse" />
            </div>
          )}
        </div>
      </ClayCard>

      {/* Cinematic Fullscreen Modal */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 bg-zinc-950/98 z-50 flex items-center justify-center select-none overflow-hidden">
          <div
            ref={playerContainerRef}
            className="relative max-h-full max-w-[460px] w-full aspect-[9/16] flex flex-col justify-between overflow-hidden bg-black shadow-2xl"
          >
            {/* Story style Segmented Progress Indicator */}
            <div className="absolute top-4 left-4 right-4 z-30 flex gap-1.5">
              {slides.map((_, i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${i < index ? 100 : i === index ? progress : 0}%`,
                      transition: i === index && playing ? "width 100ms linear" : "none",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Top Bar Navigation details */}
            <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between text-white drop-shadow-lg">
              <div className="flex flex-col min-w-0 pr-4">
                <span className="font-display text-xs font-bold tracking-wider uppercase opacity-95 truncate">
                  {current?.albumName || highlight.title}
                </span>
                <span className="font-body text-[9.5px] opacity-80 mt-0.5 truncate">
                  {current?.albumDetails || highlight.subtitle}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMuted((m) => !m);
                    play("tap");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
                >
                  {muted ? <SoundOffIcon size={14} /> : <SoundOnIcon size={14} />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBrowserFullscreen();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
                >
                  <FullscreenIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenOpen(false);
                    play("toggleOff");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            </div>

            {/* Cinematic Slide Area */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-zinc-950">
              {/* Instagram style Touch Zones to skip slides */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  play("whoosh");
                  if (index > 0) setIndex(index - 1);
                }}
                className="absolute left-0 top-0 bottom-0 w-[30%] z-20 cursor-w-resize"
              />
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  play("whoosh");
                  if (index < slides.length - 1) {
                    setIndex(index + 1);
                  } else {
                    setIsFullscreenOpen(false);
                  }
                }}
                className="absolute right-0 top-0 bottom-0 w-[30%] z-20 cursor-e-resize"
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={transitionEffect.initial}
                  animate={transitionEffect.animate}
                  exit={transitionEffect.exit}
                  transition={transitionEffect.transition}
                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                >
                  {current?.type === "photo" ? (
                    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                      {/* Blurred backdrop image to fill aspect ratio cleanly */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={current.photoUrl || photoPlaceholder(`${trip.id}-${index}`)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110"
                      />
                      {/* Foregound image with subtle continuous Ken Burns zoom effect */}
                      <motion.img
                        src={current.photoUrl || photoPlaceholder(`${trip.id}-${index}`)}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = photoPlaceholder(`${trip.id}-${index}`);
                        }}
                        alt=""
                        initial={{ scale: 1.0, x: -5, y: -5 }}
                        animate={{ scale: 1.08, x: 5, y: 5 }}
                        transition={{ duration: current.duration, ease: "linear" }}
                        className="relative z-10 w-full h-full object-contain"
                      />
                      {/* Caption text box over photo */}
                      {current.text && (
                        <div className="absolute bottom-16 left-4 right-4 z-20 rounded-clay-sm bg-black/45 p-3 backdrop-blur-md text-center text-white shadow-clay-xs">
                          <p className="font-body text-xs font-semibold leading-relaxed tracking-wide">
                            {current.text}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Textured background slides (Intro, Location, Ending)
                    <div
                      className="flex h-full w-full flex-col items-center justify-center p-8 text-center"
                      style={{ background: TONE_BG[current?.type ?? "intro"] }}
                    >
                      {current?.type === "location" ? (
                        <>
                          <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-display text-2xl font-extrabold text-clay-ink leading-tight"
                          >
                            {current.text}
                          </motion.h2>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 font-body text-xs font-bold text-clay-ink-soft"
                          >
                            {current.albumDetails}
                          </motion.p>
                        </>
                      ) : current?.type === "ending" ? (
                        <motion.h2
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 90 }}
                          className="font-display text-xl font-extrabold text-clay-ink"
                        >
                          {current.text}
                        </motion.h2>
                      ) : (
                        // Main Global Intro
                        <>
                          <motion.h1
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="font-display text-2xl font-extrabold text-white drop-shadow-md tracking-wide"
                          >
                            {current?.text}
                          </motion.h1>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-2 font-body text-[11px] text-white/90 font-bold uppercase tracking-wider"
                          >
                            A little rewind of your adventures
                          </motion.p>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Nav Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-center gap-4 text-white">
              <button
                type="button"
                onClick={() => {
                  play("whoosh");
                  if (index > 0) setIndex(index - 1);
                }}
                disabled={index === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeftIcon size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying((p) => !p);
                  play("tap");
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-butter text-clay-ink hover:scale-105 transition-transform"
              >
                {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  play("whoosh");
                  if (index < slides.length - 1) {
                    setIndex(index + 1);
                  } else {
                    setIsFullscreenOpen(false);
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 hover:bg-black/55 text-white transition-colors"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
