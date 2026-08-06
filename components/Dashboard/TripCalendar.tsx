"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/ui/Icons";
import { fadeUp, revealViewport, springSnappy, stagger } from "@/lib/animations";
import {
  WEEKDAYS,
  addDays,
  daysBetween,
  formatMonthYear,
  formatRange,
  isIsoDate,
  isWithin,
  monthMatrix,
  relativeDay,
  shiftMonth,
  todayIso,
  tripLength,
} from "@/lib/dates";
import { useFeedback } from "@/lib/feedback";
import { actions, isTravelled, useAppState } from "@/lib/store";
import { TONES } from "@/lib/tones";
import type { Trip, TripStatus } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Trip calendar                                                       */
/*                                                                     */
/* A month grid of the user's real trips. Two ways to change a trip,    */
/* because drag alone would be unusable with a keyboard:                */
/*   · drag a block onto another day to move the whole trip             */
/*   · click a block to open an editor for its name, dates and status   */
/*                                                                     */
/* Trips with no dates are not silently hidden — they sit in a tray     */
/* underneath, draggable onto the grid, which is how they get their     */
/* first dates.                                                         */
/* ------------------------------------------------------------------ */

const STATUSES: TripStatus[] = ["planning", "upcoming", "completed"];

export function TripCalendar() {
  const { trips } = useAppState();
  const { play } = useFeedback();
  const today = todayIso();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; grabbedOn: string } | null>(
    null,
  );
  const [hoverDay, setHoverDay] = useState<string | null>(null);

  const cells = useMemo(
    () => monthMatrix(cursor.year, cursor.monthIndex, today),
    [cursor, today],
  );

  const dated = useMemo(
    () => trips.filter((trip) => isIsoDate(trip.startDate)),
    [trips],
  );
  const undated = useMemo(
    () => trips.filter((trip) => !isIsoDate(trip.startDate)),
    [trips],
  );

  /** trip blocks that touch a given day, so a cell can render its own slice. */
  const tripsOn = useMemo(() => {
    const map = new Map<string, Trip[]>();
    cells.forEach((cell) => {
      const found = dated.filter((trip) =>
        isWithin(cell.iso, trip.startDate, trip.endDate || trip.startDate),
      );
      if (found.length) map.set(cell.iso, found);
    });
    return map;
  }, [cells, dated]);

  const editing = trips.find((trip) => trip.id === editingId) ?? null;

  const goMonth = (by: number) => {
    play("pageTurn");
    setCursor((current) => shiftMonth(current.year, current.monthIndex, by));
  };

  const goToday = () => {
    play("tap");
    const now = new Date();
    setCursor({ year: now.getFullYear(), monthIndex: now.getMonth() });
  };

  /**
   * Dropping a block. The offset the user grabbed it at is preserved, so
   * picking a trip up by its third day and dropping that day on the 12th
   * puts the third day on the 12th — not the start.
   */
  const handleDrop = (targetIso: string) => {
    if (!dragging) return;
    const trip = trips.find((item) => item.id === dragging.id);
    setDragging(null);
    setHoverDay(null);
    if (!trip) return;

    if (!isIsoDate(trip.startDate)) {
      // An undated trip gets scheduled: it starts where it was dropped and
      // keeps whatever length it was planned for.
      const span = Math.max(1, trip.days);
      actions.updateTripDetails(trip.id, {
        startDate: targetIso,
        endDate: addDays(targetIso, span - 1),
      });
      play("drop");
      return;
    }

    const offset = daysBetween(trip.startDate, dragging.grabbedOn) ?? 0;
    const delta = daysBetween(trip.startDate, targetIso);
    if (delta === null || delta - offset === 0) return;

    actions.moveTrip(trip.id, delta - offset);
    play("drop");
  };

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
            Your travel calendar
          </h2>
          <p className="mt-1 font-body text-sm text-clay-ink-soft">
            {dated.length
              ? "Drag a trip to move it, or tap it to edit the details"
              : "Trips appear here once they have dates"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ClayButton
            variant="icon"
            size="sm"
            aria-label="Previous month"
            sound={null}
            onClick={() => goMonth(-1)}
          >
            <ChevronLeftIcon size={18} />
          </ClayButton>
          <ClayButton size="sm" tone="surface" sound={null} onClick={goToday}>
            Today
          </ClayButton>
          <ClayButton
            variant="icon"
            size="sm"
            aria-label="Next month"
            sound={null}
            onClick={() => goMonth(1)}
          >
            <ChevronRightIcon size={18} />
          </ClayButton>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="xl" depth="lg" className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-clay-sm bg-clay-lilac text-clay-ink shadow-clay-xs">
              <CalendarIcon size={17} />
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={`${cursor.year}-${cursor.monthIndex}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="font-display text-lg font-semibold"
              >
                {formatMonthYear(cursor.year, cursor.monthIndex)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ------------------------------------------------ weekday rule */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map((day) => (
              <p
                key={day}
                className="pb-1 text-center font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted"
              >
                {day}
              </p>
            ))}
          </div>

          {/* ------------------------------------------------------- grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((cell) => {
              const onThisDay = tripsOn.get(cell.iso) ?? [];
              const isDropTarget = hoverDay === cell.iso && dragging !== null;

              return (
                <div
                  key={cell.iso}
                  onDragOver={(event) => {
                    if (!dragging) return;
                    event.preventDefault();
                    setHoverDay(cell.iso);
                  }}
                  onDragLeave={() =>
                    setHoverDay((current) => (current === cell.iso ? null : current))
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(cell.iso);
                  }}
                  className={[
                    "min-h-[74px] rounded-clay-sm p-1.5 transition-colors sm:min-h-[92px]",
                    cell.inMonth
                      ? "bg-clay-sunken/50 shadow-clay-inset-sm"
                      : "bg-clay-sunken/20",
                    isDropTarget ? "bg-clay-mint ring-2 ring-clay-jade" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] font-bold",
                      cell.isToday
                        ? "bg-clay-tangerine text-white shadow-clay-xs"
                        : cell.inMonth
                          ? "text-clay-ink-soft"
                          : "text-clay-muted/60",
                    ].join(" ")}
                  >
                    {cell.day}
                  </span>

                  <div className="mt-1 space-y-1">
                    {onThisDay.slice(0, 2).map((trip) => (
                      <TripBlock
                        key={trip.id}
                        trip={trip}
                        day={cell.iso}
                        onGrab={() => {
                          play("lift");
                          setDragging({ id: trip.id, grabbedOn: cell.iso });
                        }}
                        onRelease={() => {
                          setDragging(null);
                          setHoverDay(null);
                        }}
                        onOpen={() => {
                          play("tap");
                          setEditingId(trip.id === editingId ? null : trip.id);
                        }}
                      />
                    ))}
                    {onThisDay.length > 2 && (
                      <p className="px-1 font-body text-[9px] font-bold text-clay-muted">
                        +{onThisDay.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* --------------------------------------------- unscheduled tray */}
          {undated.length > 0 && (
            <div className="mt-5 border-t border-clay-sunken pt-4">
              <p className="mb-2 font-body text-[11px] font-bold uppercase tracking-wider text-clay-muted">
                Not scheduled yet — drag one onto a day
              </p>
              <div className="flex flex-wrap gap-2">
                {undated.map((trip) => (
                  <button
                    key={trip.id}
                    draggable
                    onDragStart={() => {
                      play("lift");
                      setDragging({ id: trip.id, grabbedOn: "" });
                    }}
                    onDragEnd={() => {
                      setDragging(null);
                      setHoverDay(null);
                    }}
                    onClick={() => {
                      play("tap");
                      setEditingId(trip.id === editingId ? null : trip.id);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-xs font-semibold shadow-clay-xs transition-shadow hover:shadow-clay-sm ${
                      TONES[trip.tone].bg
                    }`}
                  >
                    <PlusIcon size={12} />
                    {trip.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {dated.length === 0 && undated.length === 0 && (
            <div className="mt-5 rounded-clay bg-clay-sunken/40 p-6 text-center shadow-clay-inset-sm">
              <p className="font-display text-base font-semibold">
                Nothing planned yet
              </p>
              <p className="mx-auto mt-1 max-w-xs font-body text-sm text-clay-ink-soft">
                Trips you create show up on this calendar, and you can move them
                around by dragging.
              </p>
              <Link href="/plan" className="mt-4 inline-block">
                <ClayButton size="sm" tone="mint">
                  Plan a trip
                </ClayButton>
              </Link>
            </div>
          )}
        </ClayCard>
      </motion.div>

      {/* ------------------------------------------------------- editor */}
      <AnimatePresence initial={false}>
        {editing && (
          <TripEditor
            key={editing.id}
            trip={editing}
            onClose={() => setEditingId(null)}
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* One day's slice of a trip                                           */
/* ------------------------------------------------------------------ */

function TripBlock({
  trip,
  day,
  onGrab,
  onRelease,
  onOpen,
}: {
  trip: Trip;
  day: string;
  onGrab: () => void;
  onRelease: () => void;
  onOpen: () => void;
}) {
  const isStart = day === trip.startDate;
  const done = isTravelled(trip);

  return (
    <motion.button
      layout
      draggable
      onDragStart={onGrab}
      onDragEnd={onRelease}
      onClick={onOpen}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={springSnappy}
      title={`${trip.title} · ${formatRange(trip.startDate, trip.endDate)}`}
      className={[
        "block w-full cursor-grab truncate rounded-full px-1.5 py-1 text-left font-body text-[9.5px] font-bold shadow-clay-xs active:cursor-grabbing sm:text-[10.5px]",
        TONES[trip.tone].bg,
        done ? "opacity-55" : "",
      ].join(" ")}
    >
      {isStart ? trip.title : "·"}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Inline editor                                                       */
/* ------------------------------------------------------------------ */

function TripEditor({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const { play } = useFeedback();
  const [title, setTitle] = useState(trip.title);
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);
  const [status, setStatus] = useState<TripStatus>(trip.status);

  const span =
    isIsoDate(start) && isIsoDate(end) ? tripLength(start, end) : null;
  const invalid = isIsoDate(start) && isIsoDate(end) && end < start;

  const save = () => {
    actions.updateTripDetails(trip.id, {
      title,
      startDate: start,
      endDate: end,
      status,
    });
    play("success");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <ClayCard tone="surface" radius="lg" depth="md" className="mt-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-base font-semibold">Edit trip</p>
          <span className="font-body text-xs text-clay-ink-soft">
            {isIsoDate(start)
              ? `${formatRange(start, end)}${
                  span ? ` · ${span} ${span === 1 ? "day" : "days"}` : ""
                } · leaves ${relativeDay(start)}`
              : "No dates set"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Trip name">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full bg-transparent font-body text-sm outline-none"
            />
          </Field>

          <Field label="Starts">
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="w-full bg-transparent font-body text-sm outline-none"
            />
          </Field>

          <Field label="Ends" invalid={invalid}>
            <input
              type="date"
              value={end}
              min={start || undefined}
              onChange={(event) => setEnd(event.target.value)}
              className="w-full bg-transparent font-body text-sm outline-none"
            />
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TripStatus)}
              className="w-full bg-transparent font-body text-sm capitalize outline-none"
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {invalid && (
          <p className="mt-2 font-body text-xs font-semibold text-clay-tangerine">
            The end date is before the start — saving will pull it back to the
            start date.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <ClayButton
            size="sm"
            variant="primary"
            leftIcon={<CheckIcon size={14} />}
            sound={null}
            onClick={save}
          >
            Save changes
          </ClayButton>
          <ClayButton size="sm" tone="surface" onClick={onClose}>
            Cancel
          </ClayButton>
          <Link href={`/trips/${trip.id}`} className="ml-auto">
            <ClayButton size="sm" tone="mint" sound="nav">
              Open trip
            </ClayButton>
          </Link>
        </div>
      </ClayCard>
    </motion.div>
  );
}

function Field({
  label,
  invalid = false,
  children,
}: {
  label: string;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted">
        {label}
      </span>
      <ClayWell
        radius="sm"
        className={`px-3 py-2.5 ${invalid ? "ring-2 ring-clay-tangerine" : ""}`}
      >
        {children}
      </ClayWell>
    </label>
  );
}
