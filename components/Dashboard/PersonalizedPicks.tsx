"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import { ArrowRightIcon, EditIcon, SparkIcon, StarIcon } from "@/components/ui/Icons";
import { fadeUp, revealViewport, springSnappy, stagger } from "@/lib/animations";
import { useSession } from "@/lib/auth/session";
import { formatInr, getDestinationShuffleImages } from "@/lib/data";
import { rankDestinations } from "@/lib/personalize";
import { buildHistory, favouriteVibes } from "@/lib/history";
import { useAppState } from "@/lib/store";
import { TONES } from "@/lib/tones";
import type { Destination } from "@/types/dashboard";

function HoverShuffleImage({ destination, isHovered }: { destination: Destination, isHovered: boolean }) {
  const [images, setImages] = useState<{ url: string; label: string }[]>([]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const fetchedImages = getDestinationShuffleImages(destination.id, destination.name);
    if (fetchedImages.length > 0) {
      setImages(fetchedImages);
      setImageIndex(0);
    }
  }, [destination.id, destination.name]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setImageIndex((current) => (current + 1) % images.length);
      }, 2500);
    } else {
      setImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const imageObj = images.length > 0 ? images[imageIndex] : undefined;

  return imageObj ? (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.img
          key={imageIndex}
          src={imageObj.url}
          alt={imageObj.label}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute bottom-2 right-4 z-20 max-w-[90%] rounded-md bg-clay-ink/40 px-2 py-0.5 backdrop-blur-md">
        <span className="line-clamp-2 font-display text-[10px] font-bold uppercase tracking-wider text-white">
          {imageObj.label}
        </span>
      </div>
    </div>
  ) : (
    <ClayScene
      kind={SCENE_BY_ID[destination.id] ?? "coast"}
      base={TONES[destination.tone].hex}
      className="h-full w-full"
    />
  );
}

export function PersonalizedPicks({ limit = 3 }: { limit?: number }) {
  const { user } = useSession();
  const { trips } = useAppState();
  const preferences = user?.preferences ?? null;

  const history = useMemo(() => buildHistory(trips), [trips]);

  const ranked = useMemo(
    () => rankDestinations(preferences, history).slice(0, limit),
    [preferences, history, limit],
  );

  const basis = useMemo(() => {
    const vibes = favouriteVibes(history, 2);
    if (history.isEmpty) return "Scored against the six answers you gave us";
    if (!preferences) {
      return `Scored against ${history.completed.length} trip${
        history.completed.length === 1 ? "" : "s"
      } you have taken`;
    }
    return vibes.length
      ? `Your answers, plus the ${vibes
          .map((vibe) => vibe.toLowerCase())
          .join(" and ")} you keep going back to`
      : `Your answers, plus ${history.completed.length} trip${
          history.completed.length === 1 ? "" : "s"
        } you have taken`;
  }, [history, preferences]);

  if (ranked.length === 0) return null;

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div
        variants={fadeUp}
        className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Made for you
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">{basis}</p>
        </div>
        <Link href="/onboarding">
          <ClayButton
            size="sm"
            tone="surface"
            leftIcon={<EditIcon size={14} />}
            sound={null}
          >
            Change answers
          </ClayButton>
        </Link>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ranked.map(({ destination, score, reasons }, index) => (
          <PersonalizedPickCard
            key={destination.id}
            destination={destination}
            score={score}
            reasons={reasons}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
}

function PersonalizedPickCard({
  destination,
  score,
  reasons,
  index,
}: {
  destination: Destination;
  score: number;
  reasons: string[];
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="surface"
        radius="lg"
        depth="md"
        interactive
        className="flex h-full flex-col overflow-hidden p-3"
      >
        <div 
          className="relative w-full aspect-[4/3] overflow-hidden rounded-clay shadow-clay-inset-sm bg-clay-surface/50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <HoverShuffleImage destination={destination} isHovered={isHovered} />

          {index === 0 && (
            <motion.span
              whileHover={{ scale: 1.06 }}
              transition={springSnappy}
              className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-clay-raised px-2.5 py-1 font-body text-[10px] font-extrabold uppercase tracking-wide shadow-clay-xs"
            >
              <SparkIcon size={12} />
              Best fit
            </motion.span>
          )}

          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-clay-raised px-2.5 py-1 font-display text-[11px] font-bold shadow-clay-xs">
            {score}
            <span className="font-body text-[9px] font-bold text-clay-muted">
              /100
            </span>
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight">
                {destination.name}
              </p>
              <p className="mt-0.5 truncate font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
                {destination.region}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={`/destinations/${destination.id}`}>
                <ClayButton
                  size="sm"
                  tone="surface"
                  className="shadow-clay-inset-sm !bg-clay-rose !text-white"
                  sound="nav"
                >
                  Magazine
                </ClayButton>
              </Link>
              <Link href={`/plan?destination=${encodeURIComponent(destination.name)}`}>
                <ClayButton
                  size="sm"
                  tone="surface"
                  className="shadow-clay-inset-sm"
                  sound="nav"
                >
                  Plan this
                </ClayButton>
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col gap-2">
            {reasons.slice(0, 3).map((reason, i) => (
              <div key={i} className="flex gap-2">
                <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-clay-rose/40" />
                <p className="font-body text-xs text-clay-ink-soft">{reason}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-clay-muted/20 pt-3">
            <span className="font-display text-sm font-semibold">
              {formatInr(destination.price)}
            </span>
            <Link
              href="/explore"
              className="group flex items-center gap-1 font-body text-[11px] font-bold text-clay-tangerine transition-colors hover:text-clay-ink"
            >
              See similar
              <ArrowRightIcon
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </ClayCard>
    </motion.div>
  );
}
