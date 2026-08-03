"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClaySuitcase } from "@/components/ui/ClayIllustrations";
import { CheckIcon, PlusIcon, SparkIcon, TrashIcon } from "@/components/ui/Icons";
import {
  fadeUp,
  springBouncy,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { actions, packedRatio } from "@/lib/store";
import type { PackingCategory, PackingItem, Trip } from "@/types/dashboard";

const CATEGORIES: PackingCategory[] = [
  "Clothes",
  "Documents",
  "Electronics",
  "Essentials",
];

const CATEGORY_TONE: Record<PackingCategory, string> = {
  Clothes: "bg-clay-blush",
  Documents: "bg-clay-butter",
  Electronics: "bg-clay-sky",
  Essentials: "bg-clay-mint",
};

interface Flyer {
  key: number;
  label: string;
  itemId: string;
  from: { x: number; y: number; w: number };
  to: { x: number; y: number };
}

export function PackingChecklist({
  trip,
  compact = false,
}: {
  trip: Trip;
  compact?: boolean;
}) {
  const { play } = useFeedback();
  const [category, setCategory] = useState<PackingCategory>("Clothes");
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const suitcaseRef = useRef<HTMLDivElement>(null);
  const flyerKey = useRef(0);

  const items = trip.packing;
  const packedCount = items.filter((item) => item.packed).length;
  const progress = packedRatio(trip);
  const complete = items.length > 0 && packedCount === items.length;

  const visible = useMemo(
    () => items.filter((item) => item.category === category),
    [items, category],
  );

  const perCategory = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((value) => {
          const group = items.filter((item) => item.category === value);
          return [value, { done: group.filter((i) => i.packed).length, total: group.length }];
        }),
      ) as Record<PackingCategory, { done: number; total: number }>,
    [items],
  );

  /** Launch the item across the card and into the suitcase. */
  function packItem(item: PackingItem, element: HTMLElement) {
    const stage = stageRef.current;
    const target = suitcaseRef.current;
    if (!stage || !target) {
      actions.setPacked(trip.id, item.id, true);
      play("toggleOn");
      return;
    }

    const stageBox = stage.getBoundingClientRect();
    const itemBox = element.getBoundingClientRect();
    const targetBox = target.getBoundingClientRect();

    const from = {
      x: itemBox.left - stageBox.left,
      y: itemBox.top - stageBox.top,
      w: itemBox.width,
    };
    const to = {
      x: targetBox.left - stageBox.left + targetBox.width / 2 - itemBox.width / 2,
      y: targetBox.top - stageBox.top + targetBox.height / 2 - 18,
    };

    flyerKey.current += 1;
    setInFlight((current) => new Set(current).add(item.id));
    setFlyers((current) => [
      ...current,
      { key: flyerKey.current, label: item.label, itemId: item.id, from, to },
    ]);
    play("whoosh");
  }

  function landFlyer(flyer: Flyer) {
    setFlyers((current) => current.filter((entry) => entry.key !== flyer.key));
    setInFlight((current) => {
      const next = new Set(current);
      next.delete(flyer.itemId);
      return next;
    });
    actions.setPacked(trip.id, flyer.itemId, true);

    const willComplete = packedCount + 1 === items.length;
    play(willComplete ? "success" : "toggleOn");
  }

  function toggle(item: PackingItem, element: HTMLElement) {
    if (inFlight.has(item.id)) return;
    if (item.packed) {
      actions.setPacked(trip.id, item.id, false);
      play("toggleOff");
    } else {
      packItem(item, element);
    }
  }

  return (
    <motion.section variants={stagger(0.07)} initial="hidden" animate="show" className="h-full">
      <ClayCard tone="surface" radius="xl" depth="lg" className="h-full overflow-hidden p-5 sm:p-7">
        <div ref={stageRef} className="relative">
          <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Pack the suitcase
              </h2>
              <p className="mt-1 font-body text-sm text-clay-ink-soft">
                Tap an item and watch it fly in
              </p>
            </div>
            <span className="rounded-full bg-clay-sunken px-4 py-2 font-display text-sm font-bold shadow-clay-inset-sm">
              {packedCount} / {items.length} packed
            </span>
          </motion.div>

          <div className={`mt-6 grid gap-6 ${compact ? "" : "md:grid-cols-[1fr_auto] md:items-start"}`}>
            <div className="min-w-0">
              {/* category tabs */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                {CATEGORIES.map((value) => {
                  const active = value === category;
                  const stat = perCategory[value];
                  return (
                    <motion.button
                      key={value}
                      whileHover={{ y: -2, scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                      transition={springSnappy}
                      onClick={() => {
                        setCategory(value);
                        play("tap");
                      }}
                      className={[
                        "flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition-all duration-200",
                        active
                          ? `${CATEGORY_TONE[value]} text-clay-ink shadow-clay-sm`
                          : "bg-clay-sunken text-clay-ink-soft shadow-clay-inset-sm",
                      ].join(" ")}
                    >
                      {value}
                      <span
                        className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold ${
                          active ? "bg-clay-raised/80" : "bg-clay-surface/70"
                        }`}
                      >
                        {stat.done}/{stat.total}
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* items */}
              <motion.ul
                key={category}
                variants={stagger(0.045)}
                initial="hidden"
                animate="show"
                className="mt-4 space-y-2.5"
              >
                {visible.map((item) => (
                  <PackingRow
                    key={item.id}
                    item={item}
                    tripId={trip.id}
                    flying={inFlight.has(item.id)}
                    onToggle={toggle}
                  />
                ))}
                {visible.length === 0 && (
                  <li className="rounded-clay-sm bg-clay-sunken/60 p-4 text-center font-body text-xs text-clay-muted shadow-clay-inset-sm">
                    Nothing in this category yet.
                  </li>
                )}
              </motion.ul>

              {/* add your own */}
              <motion.form
                variants={fadeUp}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!draft.trim()) return;
                  actions.addPackingItem(trip.id, draft, category);
                  play("toggleOn");
                  setDraft("");
                }}
                className="mt-3 flex items-center gap-2 rounded-clay-sm bg-clay-sunken/70 p-2 shadow-clay-inset-sm"
              >
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`Add to ${category.toLowerCase()}`}
                  className="min-w-0 flex-1 bg-transparent px-3 font-body text-sm outline-none placeholder:text-clay-muted"
                />
                <ClayButton
                  type="submit"
                  size="sm"
                  tone="peach"
                  disabled={!draft.trim()}
                  leftIcon={<PlusIcon size={15} />}
                >
                  Add
                </ClayButton>
              </motion.form>
            </div>

            {/* suitcase */}
            <motion.div
              variants={fadeUp}
              className={`mx-auto flex w-full flex-col items-center ${
                compact ? "max-w-[13rem]" : "max-w-[15rem] md:w-56"
              }`}
            >
              <motion.div
                ref={suitcaseRef}
                animate={complete ? { scale: [1, 1.08, 1], rotate: [0, -4, 3, 0] } : { scale: 1, rotate: 0 }}
                transition={
                  complete
                    ? { type: "tween", duration: 0.7, ease: "easeInOut" }
                    : springBouncy
                }
                className="relative"
              >
                <ClaySuitcase size={compact ? 170 : 210} fill={progress} />
                <AnimatePresence>
                  {complete && (
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={springBouncy}
                      className="absolute -right-1 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-clay-jade text-white shadow-clay-sm"
                    >
                      <CheckIcon size={24} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="mt-2 w-full">
                <div className="h-4 overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset">
                  <motion.div
                    animate={{ width: `${progress * 100}%` }}
                    transition={springSoft}
                    className="h-full rounded-full bg-clay-jade"
                  />
                </div>
                <p className="mt-2 text-center font-body text-xs text-clay-muted">
                  {complete ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-clay-ink">
                      <SparkIcon size={13} />
                      Suitcase is ready
                    </span>
                  ) : (
                    `${Math.round(progress * 100)}% of your bag is filled`
                  )}
                </p>
              </div>
            </motion.div>
          </div>

          {/* flying items */}
          <AnimatePresence>
            {flyers.map((flyer) => (
              <motion.div
                key={flyer.key}
                initial={{ x: flyer.from.x, y: flyer.from.y, scale: 1, opacity: 1, rotate: 0 }}
                animate={{
                  x: [flyer.from.x, (flyer.from.x + flyer.to.x) / 2, flyer.to.x],
                  y: [flyer.from.y, Math.min(flyer.from.y, flyer.to.y) - 90, flyer.to.y],
                  scale: [1, 0.86, 0.22],
                  rotate: [0, -14, 22],
                  opacity: [1, 1, 0.15],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "tween",
                  duration: 0.72,
                  ease: [0.4, 0.05, 0.35, 1],
                  times: [0, 0.55, 1],
                }}
                onAnimationComplete={() => landFlyer(flyer)}
                style={{ width: flyer.from.w, top: 0, left: 0 }}
                className="pointer-events-none absolute z-30 rounded-clay-sm bg-clay-peach px-4 py-3 font-display text-sm font-semibold text-clay-ink shadow-clay"
              >
                {flyer.label}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ClayCard>
    </motion.section>
  );
}

/* ------------------------------- row ------------------------------- */

function PackingRow({
  item,
  tripId,
  flying,
  onToggle,
}: {
  item: PackingItem;
  tripId: string;
  flying: boolean;
  onToggle: (item: PackingItem, element: HTMLElement) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { play } = useFeedback();

  return (
    <motion.li variants={fadeUp} layout transition={springSoft}>
      <motion.div
        ref={ref}
        animate={{ opacity: flying ? 0.25 : 1 }}
        className={[
          "flex w-full items-center gap-3 rounded-clay-sm p-3.5 transition-shadow duration-200",
          item.packed
            ? "bg-clay-sunken/70 shadow-clay-inset-sm"
            : "bg-clay-raised shadow-clay-sm",
        ].join(" ")}
      >
        <motion.button
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.97 }}
          transition={springSnappy}
          onClick={() => ref.current && onToggle(item, ref.current)}
          aria-pressed={item.packed}
          className="flex flex-1 items-center gap-3.5 text-left"
        >
          <span
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
              item.packed
                ? "bg-clay-jade text-white shadow-clay-xs"
                : "bg-clay-sunken text-transparent shadow-clay-inset-sm",
            ].join(" ")}
          >
            <motion.span
              initial={false}
              animate={item.packed ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
              transition={springBouncy}
            >
              <CheckIcon size={16} />
            </motion.span>
          </span>

          <span
            className={`flex-1 font-display text-[15px] font-semibold transition-colors ${
              item.packed ? "text-clay-muted line-through" : "text-clay-ink"
            }`}
          >
            {item.label}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={springSnappy}
          onClick={() => {
            play("toggleOff");
            actions.removePackingItem(tripId, item.id);
          }}
          aria-label={`Remove ${item.label}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-surface text-clay-muted shadow-clay-xs hover:text-clay-rose"
        >
          <TrashIcon size={14} />
        </motion.button>
      </motion.div>
    </motion.li>
  );
}
