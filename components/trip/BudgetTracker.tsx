"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import {
  BagIcon,
  BedIcon,
  PlaneIcon,
  PlusIcon,
  ReceiptIcon,
  TicketIcon,
  TrashIcon,
  UsersIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  revealViewport,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { TONES } from "@/lib/tones";
import { actions, settlement, tripSpend } from "@/lib/store";
import { settleUp, shareOf } from "@/lib/travelers";
import { formatInr } from "@/lib/data";
import type { ClayTone, Expense, ExpenseCategory, Trip } from "@/types/dashboard";

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; tone: ClayTone; icon: typeof BedIcon }
> = {
  stay: { label: "Stay", tone: "blush", icon: BedIcon },
  travel: { label: "Travel", tone: "lilac", icon: PlaneIcon },
  food: { label: "Food", tone: "peach", icon: UtensilsIcon },
  activity: { label: "Activity", tone: "mint", icon: TicketIcon },
  shopping: { label: "Shopping", tone: "butter", icon: BagIcon },
  other: { label: "Other", tone: "sky", icon: WalletIcon },
};

const CATEGORIES = Object.keys(CATEGORY_META) as ExpenseCategory[];

export function BudgetTracker({ trip }: { trip: Trip }) {
  const { play } = useFeedback();
  const [adding, setAdding] = useState(false);

  const spent = tripSpend(trip);
  const remaining = trip.budget - spent;
  const ratio = trip.budget > 0 ? Math.min(1, spent / trip.budget) : 0;
  const perPerson = trip.travelers.length
    ? Math.round(spent / trip.travelers.length)
    : spent;

  const byCategory = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    trip.expenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    });
    return CATEGORIES.map((category) => ({
      category,
      total: totals.get(category) ?? 0,
    }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [trip.expenses]);

  // No useMemo here on purpose: the React Compiler memoizes this call for us,
  // and a manual wrapper around a whole-object dependency defeats it.
  const balances = settlement(trip);
  const transfers = settleUp(balances);

  return (
    <motion.div
      variants={stagger(0.07)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* -------------------------------------------------- overview */}
      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ClayCard tone="surface" radius="lg" depth="sm" className="flex items-center gap-5 p-5">
          <BudgetRing ratio={ratio} over={remaining < 0} />
          <div className="min-w-0">
            <p className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
              Spent so far
            </p>
            <p className="font-display text-3xl font-semibold leading-tight">
              {formatInr(spent)}
            </p>
            <p className="mt-1 font-body text-xs text-clay-ink-soft">
              of {formatInr(trip.budget)} budget
            </p>
            <p
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 font-body text-[11px] font-bold shadow-clay-xs ${
                remaining < 0 ? "bg-clay-blush text-clay-ink" : "bg-clay-mint text-clay-ink"
              }`}
            >
              {remaining < 0
                ? `${formatInr(Math.abs(remaining))} over`
                : `${formatInr(remaining)} left`}
            </p>
          </div>
        </ClayCard>

        <ClayCard tone="surface" radius="lg" depth="sm" className="p-5">
          <p className="mb-3 font-display text-sm font-semibold">Where it went</p>
          {byCategory.length === 0 ? (
            <p className="font-body text-xs text-clay-muted">
              No expenses logged yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {byCategory.map(({ category, total }) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                const share = spent > 0 ? (total / spent) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[meta.tone].bg} shadow-clay-xs`}>
                      <Icon size={15} />
                    </span>
                    <span className="w-20 shrink-0 font-body text-xs font-bold text-clay-ink-soft">
                      {meta.label}
                    </span>
                    <span className="h-3 flex-1 overflow-hidden rounded-full bg-clay-sunken shadow-clay-inset-sm">
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: `${share}%` }}
                        viewport={revealViewport}
                        transition={springSoft}
                        style={{ backgroundColor: TONES[meta.tone].accent }}
                        className="block h-full rounded-full"
                      />
                    </span>
                    <span className="w-20 shrink-0 text-right font-display text-xs font-bold">
                      {formatInr(total)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ClayCard>
      </motion.div>

      {/* -------------------------------------------------- settlement */}
      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="lg" depth="sm" className="p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-sm font-semibold">Who owes what</p>
            <p className="font-body text-xs text-clay-muted">
              Equal split · {formatInr(perPerson)} per person so far
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {balances.map(({ traveler, balance }) => (
              <div
                key={traveler.id}
                className="flex items-center gap-3 rounded-clay-sm bg-clay-sunken/60 p-3 shadow-clay-inset-sm"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONES[traveler.tone].bg} font-display text-xs font-bold shadow-clay-xs`}>
                  {traveler.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-semibold">
                    {traveler.name}
                  </span>
                  <span
                    className={`block font-body text-xs font-bold ${
                      balance > 0
                        ? "text-clay-jade"
                        : balance < 0
                          ? "text-clay-rose"
                          : "text-clay-muted"
                    }`}
                  >
                    {balance > 0
                      ? `is owed ${formatInr(balance)}`
                      : balance < 0
                        ? `owes ${formatInr(Math.abs(balance))}`
                        : "settled up"}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* The actionable half: balances say who is up and down, transfers
              say what to actually pay. Greedy settlement, so at most one row
              per person rather than everyone paying everyone. */}
          {transfers.length > 0 && (
            <div className="mt-4 border-t border-clay-muted/15 pt-4">
              <p className="mb-2.5 flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
                <UsersIcon size={13} />
                Settle up in {transfers.length}{" "}
                {transfers.length === 1 ? "payment" : "payments"}
              </p>
              <ul className="space-y-2">
                {transfers.map((transfer, index) => (
                  <motion.li
                    key={`${transfer.from.id}-${transfer.to.id}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springSoft, delay: index * 0.05 }}
                    className="flex flex-wrap items-center gap-2 rounded-clay-sm bg-clay-raised p-3 shadow-clay-xs"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[transfer.from.tone].bg} font-display text-[10px] font-bold shadow-clay-xs`}>
                      {transfer.from.initials}
                    </span>
                    <span className="font-display text-sm font-semibold">
                      {transfer.from.isYou ? "You" : transfer.from.name}
                    </span>
                    <span className="font-body text-xs text-clay-muted">pays</span>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[transfer.to.tone].bg} font-display text-[10px] font-bold shadow-clay-xs`}>
                      {transfer.to.initials}
                    </span>
                    <span className="font-display text-sm font-semibold">
                      {transfer.to.isYou ? "you" : transfer.to.name}
                    </span>
                    <span className="ml-auto rounded-full bg-clay-butter px-3 py-1 font-display text-sm font-bold shadow-clay-xs">
                      {formatInr(transfer.amount)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {transfers.length === 0 && trip.expenses.length > 0 && (
            <p className="mt-4 rounded-clay-sm bg-clay-mint/50 p-3 text-center font-body text-xs font-bold text-clay-ink shadow-clay-inset-sm">
              Everyone is square — nothing to settle.
            </p>
          )}
        </ClayCard>
      </motion.div>

      {/* -------------------------------------------------- expenses */}
      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="lg" depth="sm" className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold">
              Expenses
              <span className="ml-2 font-body text-xs font-normal text-clay-muted">
                {trip.expenses.length} logged
              </span>
            </p>
            <ClayButton
              size="sm"
              tone="mint"
              leftIcon={<PlusIcon size={15} />}
              onClick={() => setAdding((current) => !current)}
            >
              {adding ? "Close" : "Add expense"}
            </ClayButton>
          </div>

          <AnimatePresence>
            {adding && (
              <ExpenseForm
                trip={trip}
                onCancel={() => setAdding(false)}
                onSubmit={(expense) => {
                  actions.addExpense(trip.id, expense);
                  play("success");
                  setAdding(false);
                }}
              />
            )}
          </AnimatePresence>

          {trip.expenses.length === 0 ? (
            <p className="rounded-clay-sm bg-clay-sunken/60 p-5 text-center font-body text-xs text-clay-muted shadow-clay-inset-sm">
              Nothing logged yet. Add flights, stays and the first dinner.
            </p>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {trip.expenses.map((expense) => {
                  const meta = CATEGORY_META[expense.category];
                  const Icon = meta.icon;
                  const payer = trip.travelers.find((t) => t.id === expense.paidBy);

                  return (
                    <motion.li
                      key={expense.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={springSoft}
                      className="flex items-center gap-3 rounded-clay-sm bg-clay-raised p-3 shadow-clay-xs"
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONES[meta.tone].bg} shadow-clay-xs`}>
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[15px] font-semibold">
                          {expense.label}
                        </span>
                        <span className="block font-body text-[11px] text-clay-muted">
                          {payer?.isYou ? "You" : (payer?.name ?? "Someone")} paid ·{" "}
                          {expense.splitWith.length > 1
                            ? `${formatInr(shareOf(expense.amount, expense.splitWith.length))} each × ${expense.splitWith.length}`
                            : "not split"}{" "}
                          · {expense.date}
                        </span>
                      </span>
                      <span className="shrink-0 font-display text-sm font-bold">
                        {formatInr(expense.amount)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.88 }}
                        transition={springSnappy}
                        onClick={() => {
                          play("toggleOff");
                          actions.removeExpense(trip.id, expense.id);
                        }}
                        aria-label={`Remove ${expense.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-surface text-clay-muted shadow-clay-xs hover:text-clay-rose"
                      >
                        <TrashIcon size={15} />
                      </motion.button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </ClayCard>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- ring --------------------------------- */

function BudgetRing({ ratio, over }: { ratio: number; over: boolean }) {
  const size = 104;
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ece0d4"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={over ? "#f7a8b8" : "#7fcfae"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - ratio) }}
          transition={{ ...springSoft, delay: 0.15 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold">
        {Math.round(ratio * 100)}%
      </span>
    </div>
  );
}

/* --------------------------------- form --------------------------------- */

function ExpenseForm({
  trip,
  onSubmit,
  onCancel,
}: {
  trip: Trip;
  onSubmit: (expense: Omit<Expense, "id">) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  // Default the payer to whoever is signed in — that is the overwhelmingly
  // common case, and it is the one row the user cannot delete.
  const self = trip.travelers.find((traveler) => traveler.isYou);
  const [paidBy, setPaidBy] = useState(
    self?.id ?? trip.travelers[0]?.id ?? "t1",
  );
  const [splitWith, setSplitWith] = useState<string[]>(
    trip.travelers.map((traveler) => traveler.id),
  );

  const canSubmit = label.trim().length > 0 && Number(amount) > 0 && splitWith.length > 0;

  const perHead =
    Number(amount) > 0 && splitWith.length > 0
      ? shareOf(Number(amount), splitWith.length)
      : 0;

  const toggleSplit = (id: string) =>
    setSplitWith((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const everyone = trip.travelers.map((traveler) => traveler.id);
  const splitEvenly = splitWith.length === everyone.length;

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
          label: label.trim(),
          amount: Number(amount),
          category,
          paidBy,
          splitWith,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        });
        setLabel("");
        setAmount("");
      }}
      className="mb-3 overflow-hidden"
    >
      <div className="rounded-clay-sm bg-clay-sunken/60 p-3.5 shadow-clay-inset-sm">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_8rem]">
          <label className="block rounded-clay-sm bg-clay-raised px-3 py-2 shadow-clay-xs">
            <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
              What was it
            </span>
            <input
              autoFocus
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Dinner in Namba"
              className="w-full bg-transparent font-body text-sm outline-none placeholder:text-clay-muted"
            />
          </label>
          <label className="block rounded-clay-sm bg-clay-raised px-3 py-2 shadow-clay-xs">
            <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
              Amount
            </span>
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))}
              placeholder="1400"
              className="w-full bg-transparent font-body text-sm outline-none placeholder:text-clay-muted"
            />
          </label>
        </div>

        <p className="mt-3 font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
          Category
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CATEGORIES.map((value) => (
            <ClayChip
              key={value}
              type="button"
              tone={CATEGORY_META[value].tone}
              active={category === value}
              onClick={() => setCategory(value)}
            >
              {CATEGORY_META[value].label}
            </ClayChip>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
              Paid by
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {trip.travelers.map((traveler) => (
                <ClayChip
                  key={traveler.id}
                  type="button"
                  tone="peach"
                  active={paidBy === traveler.id}
                  onClick={() => setPaidBy(traveler.id)}
                >
                  {traveler.name}
                </ClayChip>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
                Split between
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSplitWith(everyone)}
                  className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-bold shadow-clay-xs transition-colors ${
                    splitEvenly ? "bg-clay-jade text-white" : "bg-clay-raised text-clay-ink-soft"
                  }`}
                >
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setSplitWith([paidBy])}
                  className={`rounded-full px-2.5 py-0.5 font-body text-[10px] font-bold shadow-clay-xs transition-colors ${
                    splitWith.length === 1 ? "bg-clay-jade text-white" : "bg-clay-raised text-clay-ink-soft"
                  }`}
                >
                  Payer only
                </button>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {trip.travelers.map((traveler) => (
                <ClayChip
                  key={traveler.id}
                  type="button"
                  tone="mint"
                  active={splitWith.includes(traveler.id)}
                  onClick={() => toggleSplit(traveler.id)}
                  title={traveler.name}
                >
                  {traveler.initials}
                </ClayChip>
              ))}
            </div>
          </div>
        </div>

        {/* Live share, so nobody has to do the division in their head before
            deciding whether the split is right. */}
        <p
          className={`mt-3 rounded-clay-sm px-3 py-2 font-body text-xs shadow-clay-inset-sm transition-colors ${
            splitWith.length === 0
              ? "bg-clay-blush/60 font-bold text-clay-ink"
              : "bg-clay-raised/70 text-clay-ink-soft"
          }`}
        >
          {splitWith.length === 0
            ? "Pick at least one person to split this between."
            : perHead > 0
              ? `${formatInr(perHead)} each across ${splitWith.length} ${splitWith.length === 1 ? "person" : "people"}.`
              : `Splitting ${splitWith.length} ${splitWith.length === 1 ? "way" : "ways"} once you enter an amount.`}
        </p>

        <div className="mt-3 flex gap-2">
          <ClayButton
            type="submit"
            size="sm"
            variant="primary"
            disabled={!canSubmit}
            leftIcon={<ReceiptIcon size={15} />}
          >
            Log expense
          </ClayButton>
          <ClayButton type="button" size="sm" tone="surface" onClick={onCancel}>
            Cancel
          </ClayButton>
        </div>
      </div>
    </motion.form>
  );
}
