"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import { CheckIcon, SparkIcon, SwapIcon } from "@/components/ui/Icons";
import {
  fadeUp,
  revealViewport,
  springBouncy,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import { COMPARISON_CANDIDATES } from "@/lib/data";
import { FLIPBOOK_DATA } from "@/data/flipbookData";
import type { ComparisonCandidate, MetricKind } from "@/types/dashboard";

/** Lower raw score wins for budget and travel difficulty. */
function betterSide(
  a: number,
  b: number,
  lowerIsBetter?: boolean,
): "a" | "b" | "tie" {
  if (a === b) return "tie";
  const aWins = lowerIsBetter ? a < b : a > b;
  return aWins ? "a" : "b";
}

export function ComparisonCard({
  candidates = COMPARISON_CANDIDATES,
}: {
  candidates?: ComparisonCandidate[];
}) {
  const { play } = useFeedback();
  const [aId, setAId] = useState(candidates[0].id);
  const [bId, setBId] = useState(candidates[1].id);

  const a = candidates.find((c) => c.id === aId) ?? candidates[0];
  const b = candidates.find((c) => c.id === bId) ?? candidates[1];

  const rows = useMemo(
    () =>
      a.metrics.map((metric) => {
        const other = b.metrics.find((m) => m.id === metric.id);
        return {
          id: metric.id as MetricKind,
          label: metric.label,
          a: metric,
          b: other ?? metric,
          winner: betterSide(
            metric.score,
            (other ?? metric).score,
            metric.lowerIsBetter,
          ),
        };
      }),
    [a, b],
  );

  const wins = rows.reduce(
    (acc, row) => {
      if (row.winner === "a") acc.a += 1;
      if (row.winner === "b") acc.b += 1;
      return acc;
    },
    { a: 0, b: 0 },
  );

  const leader = wins.a === wins.b ? null : wins.a > wins.b ? a : b;

  function swap() {
    play("nav");
    setAId(bId);
    setBId(aId);
  }

  function pick(side: "a" | "b", id: string) {
    play("toggleOn");
    if (side === "a") {
      if (id === bId) setBId(aId);
      setAId(id);
    } else {
      if (id === aId) setAId(bId);
      setBId(id);
    }
  }

  return (
    <motion.section
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <ClayCard
        tone="surface"
        radius="xl"
        depth="lg"
        className="overflow-hidden p-5 sm:p-7 lg:p-9"
      >
        <motion.div variants={fadeUp} className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-clay-sky px-4 py-2 font-body text-[11px] font-extrabold uppercase tracking-wider shadow-clay-xs">
            <SwapIcon size={14} />
            Side by side
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            When confused between two destinations?
          </h2>
          <p className="mt-2 font-body text-sm text-clay-ink-soft">
            Six signals, weighted for how you actually travel.
          </p>
        </motion.div>

        {/* --------------------------------------------- pickers */}
        <motion.div
          variants={fadeUp}
          className="mt-6 grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"
        >
          <Picker
            side="a"
            candidates={candidates}
            selectedId={a.id}
            onPick={pick}
            wins={wins.a}
            total={rows.length}
          />

          <div className="flex justify-center">
            <ClayButton
              variant="icon"
              tone="butter"
              size="md"
              onClick={swap}
              aria-label="Swap destinations"
              sound={null}
              className="rotate-90 sm:rotate-0"
            >
              <SwapIcon size={20} />
            </ClayButton>
          </div>

          <Picker
            side="b"
            candidates={candidates}
            selectedId={b.id}
            onPick={pick}
            wins={wins.b}
            total={rows.length}
          />
        </motion.div>

        {/* --------------------------------------------- metrics */}
        <motion.div variants={stagger(0.06, 0.1)} className="mt-6 space-y-3">
          {rows.map((row) => (
            <motion.div
              key={row.id}
              variants={fadeUp}
              className="rounded-clay bg-clay-sunken/55 p-3.5 shadow-clay-inset-sm sm:p-4"
            >
              <div className="mb-2.5 flex items-center justify-center gap-2">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-clay-ink-soft">
                  {row.label}
                </span>
                {row.a.lowerIsBetter && (
                  <span className="rounded-full bg-clay-surface px-2 py-0.5 font-body text-[10px] font-bold text-clay-muted">
                    lower is better
                  </span>
                )}
              </div>

              <div className="grid items-center gap-2 sm:grid-cols-[1fr_5.5rem_1fr]">
                <MetricBar
                  align="right"
                  value={row.a.score}
                  display={row.a.display}
                  tone={a.tone}
                  winner={row.winner === "a"}
                />
                <span className="hidden text-center font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted sm:block">
                  vs
                </span>
                <MetricBar
                  align="left"
                  value={row.b.score}
                  display={row.b.display}
                  tone={b.tone}
                  winner={row.winner === "b"}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* --------------------------------------------- verdict */}
        <motion.div variants={fadeUp} className="mt-6">
          <ClayCard
            tone={leader ? leader.tone : "surface"}
            radius="lg"
            depth="sm"
            className="flex flex-wrap items-center gap-4 p-4 sm:p-5"
          >
            <motion.span
              animate={{ rotate: [0, 8, -6, 0] }}
              transition={{
                type: "tween",
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-clay-raised text-clay-tangerine shadow-clay-xs"
            >
              <SparkIcon size={22} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-tight">
                {leader
                  ? `${leader.name} edges ahead, ${Math.max(wins.a, wins.b)} of ${rows.length}`
                  : "Too close to call"}
              </p>
              <p className="font-body text-xs text-clay-ink-soft">
                {leader
                  ? `${b.name} still wins on ${
                      rows.find((r) => r.winner === (leader.id === a.id ? "b" : "a"))
                        ?.label.toLowerCase() ?? "budget"
                    }.`
                  : "Both score identically. Pick the one you can book sooner."}
              </p>
            </div>
            <ClayButton size="sm" tone="surface">
              Build both plans
            </ClayButton>
          </ClayCard>
        </motion.div>
      </ClayCard>
    </motion.section>
  );
}

/* ------------------------------- pieces ------------------------------- */

function Picker({
  side,
  candidates,
  selectedId,
  onPick,
  wins,
  total,
}: {
  side: "a" | "b";
  candidates: ComparisonCandidate[];
  selectedId: string;
  onPick: (side: "a" | "b", id: string) => void;
  wins: number;
  total: number;
}) {
  const selected =
    candidates.find((c) => c.id === selectedId) ?? candidates[0];
  const scene = SCENE_BY_ID[selected.id] ?? "coast";
  const coverImage = FLIPBOOK_DATA[selected.id]?.coverImage;

  return (
    <motion.div layout transition={springSoft}>
      <ClayCard
        tone={selected.tone}
        radius="lg"
        depth="sm"
        className="overflow-hidden p-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-clay-sm shadow-clay-xs bg-clay-sunken">
            {coverImage ? (
              <img src={coverImage} alt={selected.name} className="h-full w-full object-cover" />
            ) : (
              <ClayScene
                kind={scene}
                base={TONES[selected.tone].hex}
                className="h-full w-full"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-body text-[10px] font-extrabold uppercase tracking-wider text-clay-ink-soft">
              Option {side === "a" ? "A" : "B"}
            </p>
            <p className="truncate font-display text-xl font-semibold leading-tight">
              {selected.name}
            </p>
            <p className="font-body text-[11px] text-clay-ink-soft">
              wins {wins} of {total} signals
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidates.map((c) => (
            <motion.button
              key={c.id}
              whileHover={{ y: -2, scale: 1.04 }}
              whileTap={{ scale: 0.93 }}
              transition={springSnappy}
              onClick={() => onPick(side, c.id)}
              className={[
                "rounded-full px-3 py-1.5 font-body text-[11px] font-bold transition-all duration-200",
                c.id === selectedId
                  ? "bg-clay-raised text-clay-ink shadow-clay-xs"
                  : "bg-clay-surface/50 text-clay-ink-soft shadow-clay-inset-sm",
              ].join(" ")}
            >
              {c.name}
            </motion.button>
          ))}
        </div>
      </ClayCard>
    </motion.div>
  );
}

function MetricBar({
  align,
  value,
  display,
  tone,
  winner,
}: {
  align: "left" | "right";
  value: number;
  display: string;
  tone: keyof typeof TONES;
  winner: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 ${
        align === "right" ? "sm:flex-row-reverse" : ""
      }`}
    >
      <span
        className={[
          "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-display text-xs font-bold shadow-clay-xs",
          winner ? "bg-clay-jade text-white" : "bg-clay-surface text-clay-ink-soft",
        ].join(" ")}
      >
        {winner && <CheckIcon size={11} />}
        {display}
      </span>

      <div
        className={`h-3.5 flex-1 overflow-hidden rounded-full bg-clay-surface/70 shadow-clay-inset-sm ${
          align === "right" ? "sm:flex sm:justify-end" : ""
        }`}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={revealViewport}
          transition={{ ...springBouncy, damping: 18 }}
          style={{ backgroundColor: TONES[tone].accent }}
          className="h-full rounded-full"
        />
      </div>
    </div>
  );
}
