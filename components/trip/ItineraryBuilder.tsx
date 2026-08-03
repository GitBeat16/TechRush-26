"use client";

import { AnimatePresence, Reorder, motion, useDragControls } from "framer-motion";
import { useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import {
  BedIcon,
  CheckIcon,
  ClockIcon,
  GripIcon,
  PinIcon,
  PlaneIcon,
  PlusIcon,
  SparkIcon,
  TicketIcon,
  TrashIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSnappy, springSoft, stagger } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { actions } from "@/lib/store";
import { formatInr } from "@/lib/data";
import type {
  ActivityCategory,
  ItineraryDay,
  ItineraryItem,
  Trip,
} from "@/types/dashboard";

const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; tone: string; icon: typeof PinIcon }
> = {
  sight: { label: "Sight", tone: "bg-clay-sky", icon: PinIcon },
  food: { label: "Food", tone: "bg-clay-peach", icon: UtensilsIcon },
  travel: { label: "Travel", tone: "bg-clay-lilac", icon: PlaneIcon },
  stay: { label: "Stay", tone: "bg-clay-blush", icon: BedIcon },
  activity: { label: "Activity", tone: "bg-clay-mint", icon: TicketIcon },
  free: { label: "Free", tone: "bg-clay-butter", icon: SparkIcon },
};

const CATEGORIES = Object.keys(CATEGORY_META) as ActivityCategory[];

export function ItineraryBuilder({ trip }: { trip: Trip }) {
  const { play } = useFeedback();
  const [openDay, setOpenDay] = useState<string | null>(
    trip.itinerary[0]?.id ?? null,
  );

  const totalCost = trip.itinerary.reduce(
    (total, day) => total + day.items.reduce((sum, item) => sum + item.cost, 0),
    0,
  );
  const totalActivities = trip.itinerary.reduce(
    (total, day) => total + day.items.length,
    0,
  );

  return (
    <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="lg" depth="sm" className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          <Summary label="Days planned" value={`${trip.itinerary.length}`} tone="bg-clay-sky" />
          <Summary label="Activities" value={`${totalActivities}`} tone="bg-clay-mint" />
          <Summary label="Planned spend" value={formatInr(totalCost)} tone="bg-clay-peach" />
          <ClayButton
            size="sm"
            tone="butter"
            className="ml-auto"
            leftIcon={<PlusIcon size={16} />}
            onClick={() => {
              actions.addDay(trip.id);
              play("toggleOn");
            }}
          >
            Add day
          </ClayButton>
        </ClayCard>
      </motion.div>

      {trip.itinerary.length === 0 && (
        <motion.div variants={fadeUp}>
          <ClayCard tone="surface" radius="lg" depth="sm" className="p-8 text-center">
            <p className="font-display text-lg font-semibold">No days yet</p>
            <p className="mt-1 font-body text-sm text-clay-ink-soft">
              Add a day, or generate a plan from the Plan page and save it as a trip.
            </p>
          </ClayCard>
        </motion.div>
      )}

      {trip.itinerary.map((day, index) => (
        <motion.div key={day.id} variants={fadeUp}>
          <DayCard
            trip={trip}
            day={day}
            index={index}
            open={openDay === day.id}
            onToggle={() => {
              play("nav");
              setOpenDay((current) => (current === day.id ? null : day.id));
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* --------------------------------- day --------------------------------- */

function DayCard({
  trip,
  day,
  index,
  open,
  onToggle,
}: {
  trip: Trip;
  day: ItineraryDay;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { play } = useFeedback();
  const [adding, setAdding] = useState(false);

  const dayCost = day.items.reduce((sum, item) => sum + item.cost, 0);
  const doneCount = day.items.filter((item) => item.done).length;

  return (
    <ClayCard tone="surface" radius="lg" depth="sm" className="overflow-hidden">
      {/* header */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-clay-sm bg-clay-butter font-display text-sm font-bold shadow-clay-xs">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-semibold sm:text-lg">
            {day.label}
          </span>
          <span className="block font-body text-xs text-clay-muted">
            {day.items.length} activities · {formatInr(dayCost)}
            {doneCount > 0 && ` · ${doneCount} done`}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={springSnappy}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-sunken text-clay-ink-soft shadow-clay-inset-sm"
        >
          <PinIcon size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              {day.items.length > 0 ? (
                <Reorder.Group
                  axis="y"
                  values={day.items}
                  onReorder={(items) =>
                    actions.reorderDayItems(trip.id, day.id, items as ItineraryItem[])
                  }
                  className="space-y-2"
                >
                  {day.items.map((item) => (
                    <ActivityRow key={item.id} trip={trip} day={day} item={item} />
                  ))}
                </Reorder.Group>
              ) : (
                <p className="rounded-clay-sm bg-clay-sunken/60 p-4 text-center font-body text-xs text-clay-muted shadow-clay-inset-sm">
                  Nothing scheduled. Add the first activity below.
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ClayButton
                  size="sm"
                  tone="mint"
                  leftIcon={<PlusIcon size={15} />}
                  onClick={() => setAdding((current) => !current)}
                >
                  {adding ? "Close" : "Add activity"}
                </ClayButton>
                <ClayButton
                  size="sm"
                  tone="surface"
                  leftIcon={<TrashIcon size={15} />}
                  onClick={() => {
                    play("toggleOff");
                    actions.removeDay(trip.id, day.id);
                  }}
                >
                  Remove day
                </ClayButton>
                <span className="ml-auto font-body text-[11px] text-clay-muted">
                  Drag the handle to reorder
                </span>
              </div>

              <AnimatePresence>
                {adding && (
                  <ActivityForm
                    onCancel={() => setAdding(false)}
                    onSubmit={(item) => {
                      actions.addActivity(trip.id, day.id, item);
                      play("success");
                      setAdding(false);
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClayCard>
  );
}

/* ------------------------------- activity ------------------------------- */

function ActivityRow({
  trip,
  day,
  item,
}: {
  trip: Trip;
  day: ItineraryDay;
  item: ItineraryItem;
}) {
  const { play } = useFeedback();
  const controls = useDragControls();
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.03, zIndex: 20 }}
      transition={springSoft}
      className="list-none"
    >
      <div
        className={`flex items-start gap-3 rounded-clay-sm p-3 shadow-clay-xs transition-colors ${
          item.done ? "bg-clay-sunken/70" : "bg-clay-raised"
        }`}
      >
        <button
          onPointerDown={(event) => {
            play("tap");
            controls.start(event);
          }}
          aria-label="Drag to reorder"
          className="mt-0.5 cursor-grab touch-none rounded-full p-1 text-clay-muted active:cursor-grabbing"
        >
          <GripIcon size={16} />
        </button>

        <button
          onClick={() => {
            play(item.done ? "toggleOff" : "toggleOn");
            actions.updateActivity(trip.id, day.id, item.id, { done: !item.done });
          }}
          aria-pressed={item.done}
          aria-label={item.done ? "Mark as not done" : "Mark as done"}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
            item.done
              ? "bg-clay-jade text-white shadow-clay-xs"
              : "bg-clay-sunken text-transparent shadow-clay-inset-sm"
          }`}
        >
          <CheckIcon size={14} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="flex items-center gap-1 font-display text-xs font-bold text-clay-ink-soft">
              <ClockIcon size={12} />
              {item.time}
            </span>
            <span
              className={`font-display text-[15px] font-semibold ${
                item.done ? "text-clay-muted line-through" : "text-clay-ink"
              }`}
            >
              {item.title}
            </span>
          </div>
          {item.note && (
            <p className="mt-0.5 font-body text-xs leading-relaxed text-clay-muted">
              {item.note}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`flex items-center gap-1 rounded-full ${meta.tone} px-2 py-0.5 font-body text-[10px] font-bold shadow-clay-xs`}>
              <Icon size={11} />
              {meta.label}
            </span>
            {item.cost > 0 && (
              <span className="rounded-full bg-clay-sunken px-2 py-0.5 font-body text-[10px] font-bold text-clay-ink-soft shadow-clay-inset-sm">
                {formatInr(item.cost)}
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          transition={springSnappy}
          onClick={() => {
            play("toggleOff");
            actions.removeActivity(trip.id, day.id, item.id);
          }}
          aria-label={`Remove ${item.title}`}
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-surface text-clay-muted shadow-clay-xs hover:text-clay-rose"
        >
          <TrashIcon size={15} />
        </motion.button>
      </div>
    </Reorder.Item>
  );
}

/* --------------------------------- form --------------------------------- */

function ActivityForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (item: Omit<ItineraryItem, "id">) => void;
  onCancel: () => void;
}) {
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("sight");

  const canSubmit = title.trim().length > 0;

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          time,
          title: title.trim(),
          note: note.trim(),
          cost: Number(cost) || 0,
          category,
          done: false,
        });
        setTitle("");
        setNote("");
        setCost("");
      }}
      className="mt-3 overflow-hidden"
    >
      <div className="rounded-clay-sm bg-clay-sunken/60 p-3.5 shadow-clay-inset-sm">
        <div className="grid gap-2.5 sm:grid-cols-[6rem_1fr_7rem]">
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="w-full bg-transparent font-body text-sm outline-none"
            />
          </Field>
          <Field label="What">
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Fushimi Inari at sunrise"
              className="w-full bg-transparent font-body text-sm outline-none placeholder:text-clay-muted"
            />
          </Field>
          <Field label="Cost">
            <input
              inputMode="numeric"
              value={cost}
              onChange={(event) => setCost(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-full bg-transparent font-body text-sm outline-none placeholder:text-clay-muted"
            />
          </Field>
        </div>

        <div className="mt-2.5">
          <Field label="Note">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Go early, the gates empty out above halfway"
              className="w-full bg-transparent font-body text-sm outline-none placeholder:text-clay-muted"
            />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((value) => (
            <ClayChip
              key={value}
              type="button"
              tone="sky"
              active={category === value}
              onClick={() => setCategory(value)}
            >
              {CATEGORY_META[value].label}
            </ClayChip>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <ClayButton type="submit" size="sm" variant="primary" disabled={!canSubmit}>
            Add to day
          </ClayButton>
          <ClayButton type="button" size="sm" tone="surface" onClick={onCancel}>
            Cancel
          </ClayButton>
        </div>
      </div>
    </motion.form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-clay-sm bg-clay-raised px-3 py-2 shadow-clay-xs">
      <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone} text-clay-ink shadow-clay-xs`}>
        <WalletIcon size={17} />
      </span>
      <span>
        <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
          {label}
        </span>
        <span className="block font-display text-base font-semibold leading-tight">{value}</span>
      </span>
    </div>
  );
}
