"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import { ArrowRightIcon, EditIcon, SparkIcon, StarIcon } from "@/components/ui/Icons";
import { fadeUp, revealViewport, springSnappy, stagger } from "@/lib/animations";
import { useSession } from "@/lib/auth/session";
import { formatInr } from "@/lib/data";
import { rankDestinations } from "@/lib/personalize";
import { buildHistory, favouriteVibes } from "@/lib/history";
import { useAppState } from "@/lib/store";
import { TONES } from "@/lib/tones";

/**
 * Every destination scored against two things: the six answers from
 * onboarding, and where the user has actually been. Best fit first, with the
 * reasons shown rather than hidden — including the unflattering ones, like a
 * place scoring low because they were there last month.
 */
export function PersonalizedPicks({ limit = 3 }: { limit?: number }) {
  const { user } = useSession();
  const { trips } = useAppState();
  const preferences = user?.preferences ?? null;

  const history = useMemo(() => buildHistory(trips), [trips]);

  const ranked = useMemo(
    () => rankDestinations(preferences, history).slice(0, limit),
    [preferences, history, limit],
  );

  // The subtitle has to be true for whoever is reading it, so it names the
  // signals actually in play rather than always claiming both.
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
        {ranked.map(({ destination, score, reasons }, index) => {
          const scene = SCENE_BY_ID[destination.id] ?? "coast";

          return (
            <motion.div key={destination.id} variants={fadeUp}>
              <ClayCard
                tone={destination.tone}
                radius="lg"
                depth="md"
                interactive
                className="flex h-full flex-col overflow-hidden p-3"
              >
                <div className="relative h-32 overflow-hidden rounded-clay shadow-clay-inset-sm">
                  <ClayScene
                    kind={scene}
                    base={TONES[destination.tone].hex}
                    className="h-full w-full"
                  />

                  {index === 0 && (
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={springSnappy}
                      className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-clay-raised border border-clay-sky px-2.5 py-1 font-body text-[10px] font-extrabold uppercase tracking-wide text-clay-tangerine shadow-clay-xs"
                    >
                      <SparkIcon size={12} />
                      Best fit
                    </motion.span>
                  )}

                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-clay-raised border border-clay-sky px-2.5 py-1 font-display text-[11px] font-bold text-clay-ink shadow-clay-xs">
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
                      <p className="font-body text-xs text-clay-ink-soft">
                        {destination.tagline}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-clay-raised border border-clay-sky px-2 py-1 font-body text-[11px] font-bold text-clay-ink shadow-clay-xs">
                      <StarIcon size={11} className="text-clay-blush" />
                      {destination.rating}
                    </span>
                  </div>

                  {/* The "why" — the whole point of personalising. */}
                  {reasons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {reasons.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full bg-clay-raised border border-clay-sky px-2.5 py-1 font-body text-[10px] font-bold text-clay-ink-soft shadow-clay-xs"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                    <span className="font-body text-xs text-clay-ink-soft">
                      {formatInr(destination.price)} · {destination.days} days
                    </span>
                    <Link
                      href={`/plan?destination=${encodeURIComponent(destination.name)}`}
                    >
                      <ClayButton
                        size="sm"
                        tone="surface"
                        rightIcon={<ArrowRightIcon size={14} />}
                      >
                        Plan it
                      </ClayButton>
                    </Link>
                  </div>
                </div>
              </ClayCard>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
