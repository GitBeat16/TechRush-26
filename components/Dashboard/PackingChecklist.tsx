"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClaySuitcase } from "@/components/ui/ClayIllustrations";
import { ClayPackable } from "@/components/ui/ClayPackables";
import { CheckIcon, CloudIcon, PlusIcon, SparkIcon, SunIcon, TrashIcon } from "@/components/ui/Icons";
import { DESTINATIONS } from "@/lib/data";
import { useSession } from "@/lib/auth/session";
import {
  categoryFor,
  daysFor,
  describeClimate,
  iconFor,
  suggestPacking,
  type PackableIcon,
  type Suggestion,
} from "@/lib/packing";
import { useTripClimate, type ClimateState } from "@/lib/weather";
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
  icon: PackableIcon;
  itemId: string;
  from: { x: number; y: number; w: number };
  to: { x: number; y: number };
}

/** The drawing for an item, guessed from its label when it predates icons. */
function iconOf(item: PackingItem): PackableIcon {
  return item.icon ?? iconFor(item.label);
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

  const { user } = useSession();

  /* ------------------------------------------------- what to suggest */

  const destination = useMemo(
    () =>
      DESTINATIONS.find((d) => d.id === trip.destinationId) ??
      DESTINATIONS.find(
        (d) => d.country.toLowerCase() === trip.country.trim().toLowerCase(),
      ) ??
      null,
    [trip.destinationId, trip.country],
  );

  // Real conditions for the actual dates: the forecast if the trip is close
  // enough, otherwise the same week last year. Suggestions wait for it rather
  // than guessing a season.
  const climateState = useTripClimate(
    destination?.coordinates ?? null,
    trip.startDate,
    trip.endDate,
  );
  const climate = climateState.status === "ready" ? climateState.climate : null;

  const suggestions = useMemo(
    () =>
      suggestPacking({
        destination,
        days: daysFor(trip.startDate, trip.endDate, trip.days),
        climate,
        // Home is a city, not a country, so this asks the only question it
        // can answer honestly: does the destination country appear in it?
        abroad: !destination
          ? false
          : !(user?.homeCity ?? "")
              .toLowerCase()
              .includes(destination.country.toLowerCase()),
      }),
    [destination, trip.startDate, trip.endDate, trip.days, climate, user?.homeCity],
  );

  const items = trip.packing;

  /** Suggestions not already in the bag, in the current category. */
  const openSuggestions = useMemo(() => {
    const packed = new Set(items.map((item) => item.label.toLowerCase()));
    return suggestions.filter(
      (suggestion) => !packed.has(suggestion.label.toLowerCase()),
    );
  }, [suggestions, items]);

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

  /** Launch the object across the card and into the suitcase. */
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
    // Aim the object's centre at the mouth of the case, not its top-left.
    const to = {
      x: targetBox.left - stageBox.left + targetBox.width / 2 - 26,
      y: targetBox.top - stageBox.top + targetBox.height / 2 - 26,
    };

    flyerKey.current += 1;
    setInFlight((current) => new Set(current).add(item.id));
    setFlyers((current) => [
      ...current,
      {
        key: flyerKey.current,
        label: item.label,
        icon: iconOf(item),
        itemId: item.id,
        from,
        to,
      },
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

  /**
   * Accept a suggestion. It is added unpacked so the user still gets the
   * satisfying part — tapping it into the bag themselves.
   */
  function acceptSuggestion(suggestion: Suggestion) {
    actions.addPackingItem(
      trip.id,
      suggestion.label,
      suggestion.category,
      suggestion.icon,
    );
    setCategory(suggestion.category);
    play("pop");
  }

  function acceptAll() {
    openSuggestions.forEach((suggestion) =>
      actions.addPackingItem(
        trip.id,
        suggestion.label,
        suggestion.category,
        suggestion.icon,
      ),
    );
    play("success");
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
                Tap a thing and watch it go in the bag
              </p>
            </div>
            <span className="rounded-full bg-clay-sunken px-4 py-2 font-display text-sm font-bold shadow-clay-inset-sm">
              {packedCount} / {items.length} packed
            </span>
          </motion.div>

          <div className={`mt-6 grid gap-6 ${compact ? "" : "md:grid-cols-[1fr_auto] md:items-start"}`}>
            <div className="min-w-0">
              {/* ----------------------------------------- suggestions */}
              <SuggestionStrip
                destination={destination?.name ?? trip.country}
                days={daysFor(trip.startDate, trip.endDate, trip.days)}
                state={climateState}
                suggestions={openSuggestions}
                onAccept={acceptSuggestion}
                onAcceptAll={acceptAll}
              />

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
                  const label = draft.trim();
                  if (!label) return;
                  // Typed items get an object and a drawer guessed from the
                  // words, so a hand-added "rain jacket" looks and files
                  // exactly like a suggested one.
                  const guessed = categoryFor(label);
                  actions.addPackingItem(trip.id, label, guessed, iconFor(label));
                  setCategory(guessed);
                  play("toggleOn");
                  setDraft("");
                }}
                className="mt-3 flex items-center gap-2 rounded-clay-sm bg-clay-sunken/70 p-2 shadow-clay-inset-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <ClayPackable icon={draft.trim() ? iconFor(draft) : "item"} size={28} />
                </span>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Add anything else you need"
                  className="min-w-0 flex-1 bg-transparent px-1 font-body text-sm outline-none placeholder:text-clay-muted"
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
                  // Up over the card, tumbling, then shrinking as it drops
                  // into the case — an arc reads as thrown, a straight line
                  // reads as a slide.
                  x: [flyer.from.x, (flyer.from.x + flyer.to.x) / 2, flyer.to.x],
                  y: [flyer.from.y, Math.min(flyer.from.y, flyer.to.y) - 110, flyer.to.y],
                  scale: [1, 1.1, 0.35],
                  rotate: [0, -160, -352],
                  opacity: [1, 1, 0.2],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  type: "tween",
                  duration: 0.78,
                  ease: [0.34, 0.02, 0.3, 1],
                  times: [0, 0.5, 1],
                }}
                onAnimationComplete={() => landFlyer(flyer)}
                style={{ top: 0, left: 0 }}
                className="pointer-events-none absolute z-30"
              >
                <ClayPackable icon={flyer.icon} size={52} />
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

          {/* the object itself, so the row and the thing in flight match */}
          <motion.span
            animate={{ opacity: item.packed ? 0.45 : 1, scale: item.packed ? 0.9 : 1 }}
            transition={springSnappy}
            className="flex h-9 w-9 shrink-0 items-center justify-center"
          >
            <ClayPackable icon={iconOf(item)} size={30} />
          </motion.span>

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


/* ------------------------- suggestions ------------------------- */

/**
 * What to pack, from the real forecast for the real dates.
 *
 * Every state here is honest about where the advice came from. With no
 * weather it still suggests the things that are true of any trip, and says
 * that is all it is doing — it never dresses a guess up as a forecast.
 */
function SuggestionStrip({
  destination,
  days,
  state,
  suggestions,
  onAccept,
  onAcceptAll,
}: {
  destination: string;
  days: number;
  state: ClimateState;
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  onAcceptAll: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? suggestions : suggestions.slice(0, 8);

  const weatherLine =
    state.status === "ready"
      ? `${describeClimate(state.climate)} · ${
          state.climate.source === "forecast"
            ? "from the forecast"
            : "based on the same dates last year"
        }`
      : state.status === "loading"
        ? "Checking the weather for your dates…"
        : state.status === "error"
          ? "No weather for those dates — showing the basics only"
          : "Add dates to get weather-based suggestions";

  if (suggestions.length === 0) {
    return (
      <motion.div
        variants={fadeUp}
        className="mb-4 rounded-clay-sm bg-clay-mint/50 p-3.5 shadow-clay-inset-sm"
      >
        <p className="font-display text-sm font-semibold">
          <span className="mr-1.5 inline-block align-middle text-clay-jade">
            <CheckIcon size={15} />
          </span>
          Everything we would suggest is already on your list
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={fadeUp} className="mb-5">
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold">
            Suggested for {days} {days === 1 ? "day" : "days"} in {destination}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 font-body text-xs text-clay-ink-soft">
            <span className="text-clay-ocean">
              {state.status === "ready" && state.climate.rainDays > 0 ? (
                <CloudIcon size={13} />
              ) : (
                <SunIcon size={13} />
              )}
            </span>
            {weatherLine}
          </p>
        </div>

        <ClayButton size="sm" tone="mint" sound={null} onClick={onAcceptAll}>
          Add all {suggestions.length}
        </ClayButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {shown.map((suggestion) => (
            <motion.button
              key={suggestion.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.94 }}
              transition={springSnappy}
              onClick={() => onAccept(suggestion)}
              title={suggestion.reason}
              className="flex items-center gap-2 rounded-full bg-clay-raised py-1.5 pl-1.5 pr-3.5 text-left shadow-clay-xs transition-shadow hover:shadow-clay-sm"
            >
              <ClayPackable icon={suggestion.icon} size={26} />
              <span className="min-w-0">
                <span className="block font-display text-[13px] font-semibold leading-tight">
                  {suggestion.label}
                </span>
                <span className="block font-body text-[10px] leading-tight text-clay-muted">
                  {suggestion.reason}
                </span>
              </span>
              <PlusIcon size={13} />
            </motion.button>
          ))}
        </AnimatePresence>

        {suggestions.length > 8 && (
          <button
            onClick={() => setShowAll((current) => !current)}
            className="rounded-full bg-clay-sunken px-3.5 py-2 font-body text-xs font-bold text-clay-ink-soft shadow-clay-inset-sm"
          >
            {showAll ? "Show fewer" : `+${suggestions.length - 8} more`}
          </button>
        )}
      </div>
    </motion.div>
  );
}
