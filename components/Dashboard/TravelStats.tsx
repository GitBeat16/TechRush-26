"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  CameraIcon,
  FlameIcon,
  GlobeIcon,
  SuitcaseIcon,
  TrendIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  floatY,
  revealViewport,
  springSoft,
  stagger,
} from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import { TRAVEL_STATS } from "@/lib/data";
import type { TravelStat } from "@/types/dashboard";

const ICONS = {
  globe: GlobeIcon,
  suitcase: SuitcaseIcon,
  flame: FlameIcon,
  camera: CameraIcon,
};

export function TravelStats({
  stats = TRAVEL_STATS,
}: {
  stats?: TravelStat[];
}) {
  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <motion.div variants={fadeUp} className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Your travel shelf
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">
            Everything you have collected so far
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-clay-mint px-3.5 py-2 font-body text-xs font-bold shadow-clay-xs sm:flex">
          <TrendIcon size={15} />
          Up 18% this year
        </span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatTile key={stat.id} stat={stat} index={index} />
        ))}
      </div>
    </motion.section>
  );
}

function StatTile({ stat, index }: { stat: TravelStat; index: number }) {
  const { play } = useFeedback();
  const Icon = ICONS[stat.icon];

  return (
    <motion.div variants={fadeUp}>
      <ClayCard
        tone="surface"
        radius="lg"
        depth="md"
        interactive
        subtle
        onHoverStart={() => play("pop")}
        className="h-full p-4 sm:p-5"
      >
        <motion.span
          {...floatY(5, 4 + index * 0.4, index * 0.25)}
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-clay-sm ${TONES[stat.tone].bg} text-clay-ink shadow-clay-sm`}
        >
          <Icon size={22} />
        </motion.span>

        <p className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-4xl">
          <CountUp value={stat.value} />
          {stat.suffix && (
            <span className="text-lg font-medium text-clay-ink-soft">
              {stat.suffix}
            </span>
          )}
        </p>

        <p className="mt-2 font-display text-sm font-semibold leading-tight">
          {stat.label}
        </p>
        <p className="mt-0.5 font-body text-[11px] text-clay-muted">
          {stat.caption}
        </p>
      </ClayCard>
    </motion.div>
  );
}

/** Number that rolls up the first time it scrolls into view. */
function CountUp({ value, duration = 1.6 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const count = useMotionValue(0);
  const text = useTransform(count, (latest) =>
    Math.round(latest).toLocaleString("en-IN"),
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, value, duration, count]);

  return (
    <motion.span ref={ref} transition={springSoft}>
      {text}
    </motion.span>
  );
}
