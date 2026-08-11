import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUuid } from "@/lib/ids";
import type {
  ClayTone,
  Expense,
  ExpenseCategory,
  ItineraryDay,
  Milestone,
  PackingItem,
  Traveler,
  Trip,
  TripStatus,
} from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Trip persistence                                                    */
/*                                                                     */
/* The client works in whole Trip objects, so the server does too: a    */
/* save is a full replace of the trip, its roster, its expenses and     */
/* their splits. That is a few more writes than a fine-grained API but  */
/* it removes an entire class of "the client and server disagree about  */
/* what changed" bugs, and a trip is a few dozen rows at most.          */
/* ------------------------------------------------------------------ */

const TONES: ClayTone[] = [
  "blush",
  "peach",
  "butter",
  "mint",
  "sky",
  "lilac",
  "surface",
];
const STATUSES: TripStatus[] = ["planning", "upcoming", "completed"];
const CATEGORIES: ExpenseCategory[] = [
  "stay",
  "travel",
  "food",
  "activity",
  "shopping",
  "other",
];

export interface TripRow {
  id: string;
  owner_id: string;
  title: string;
  country: string;
  destination_id: string;
  summary: string;
  start_date: string;
  end_date: string;
  days: number;
  budget: number | string;
  currency: string;
  tone: ClayTone;
  status: TripStatus;
  itinerary: ItineraryDay[] | null;
  packing: PackingItem[] | null;
  milestones: Milestone[] | null;
  created_at: string;
  updated_at: string;
}

export interface TravelerRow {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  initials: string;
  tone: ClayTone;
  email: string | null;
  is_you: boolean;
  position: number;
}

export interface ExpenseRow {
  id: string;
  trip_id: string;
  label: string;
  amount: number | string;
  category: ExpenseCategory;
  paid_by: string;
  spent_on: string;
  created_by: string;
}

export interface SplitRow {
  expense_id: string;
  traveler_id: string;
  weight: number | string;
}

/* ------------------------------- dates ------------------------------ */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "02 Aug" → an ISO date in the current year. Falls back to today. */
export function parseDisplayDate(value: string): string {
  const match = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(value.trim());
  if (match) {
    const month = MONTHS.findIndex(
      (name) => name.toLowerCase() === match[2].toLowerCase(),
    );
    if (month >= 0) {
      const year = new Date().getFullYear();
      const day = String(Number(match[1])).padStart(2, "0");
      return `${year}-${String(month + 1).padStart(2, "0")}-${day}`;
    }
  }

  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();

  return new Date().toISOString().slice(0, 10);
}

/** ISO date → "02 Aug", the format the UI has always rendered. */
export function toDisplayDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]} ${MONTHS[Number(match[2]) - 1] ?? ""}`.trim();
}

/* ------------------------------ mapping ----------------------------- */

function pick<T extends string>(value: unknown, allowed: T[], fallback: T): T {
  return typeof value === "string" && (allowed as string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function rowsToTrip(
  trip: TripRow,
  travelers: TravelerRow[],
  expenses: ExpenseRow[],
  splits: SplitRow[],
  /**
   * Who is reading. `is_you` on the row means "the trip owner", which is only
   * the same person as the reader on their own trips — once someone joins via
   * an invite, trusting the stored flag would label the owner as "you" in the
   * joiner's UI. Resolving it per reader keeps "you" meaning you.
   */
  viewerId?: string,
): Trip {
  const splitsByExpense = new Map<string, string[]>();
  splits.forEach((split) => {
    const list = splitsByExpense.get(split.expense_id) ?? [];
    list.push(split.traveler_id);
    splitsByExpense.set(split.expense_id, list);
  });

  const ownerIsViewer = Boolean(viewerId) && trip.owner_id === viewerId;

  return {
    id: trip.id,
    ownerId: trip.owner_id,
    title: trip.title,
    country: trip.country,
    destinationId: trip.destination_id,
    startDate: trip.start_date,
    endDate: trip.end_date,
    days: trip.days,
    budget: Number(trip.budget),
    currency: trip.currency,
    tone: pick(trip.tone, TONES, "lilac"),
    status: pick(trip.status, STATUSES, "planning"),
    summary: trip.summary,
    travelers: travelers
      .slice()
      .sort((a, b) => a.position - b.position)
      .map<Traveler>((row) => ({
        id: row.id,
        name: row.name,
        initials: row.initials,
        tone: pick(row.tone, TONES, "mint"),
        ...(row.email ? { email: row.email } : {}),
        ...((row.user_id && row.user_id === viewerId) || (row.is_you && ownerIsViewer)
          ? { isYou: true }
          : {}),
      })),
    milestones: trip.milestones ?? [],
    itinerary: trip.itinerary ?? [],
    packing: trip.packing ?? [],
    expenses: expenses.map<Expense>((row) => ({
      id: row.id,
      label: row.label,
      amount: Number(row.amount),
      category: pick(row.category, CATEGORIES, "other"),
      paidBy: row.paid_by,
      splitWith: splitsByExpense.get(row.id) ?? [],
      date: toDisplayDate(row.spent_on),
    })),
  };
}

/**
 * Rewrite every id on a trip into uuid form.
 *
 * Called before anything is written, so that a trip which started life in
 * localStorage with ids like "trip-goa" and "t1" lands in Postgres with valid
 * uuids — and lands on the *same* uuids every time, so re-syncing updates
 * rather than duplicating.
 */
export function canonicalise(trip: Trip): Trip {
  const travelerIds = new Map<string, string>();
  trip.travelers.forEach((traveler) => {
    travelerIds.set(traveler.id, ensureUuid(`${trip.id}:${traveler.id}`));
  });

  const fallbackTraveler = trip.travelers[0]
    ? travelerIds.get(trip.travelers[0].id)!
    : ensureUuid(`${trip.id}:self`);

  return {
    ...trip,
    id: ensureUuid(trip.id),
    travelers: trip.travelers.map((traveler) => ({
      ...traveler,
      id: travelerIds.get(traveler.id)!,
    })),
    expenses: trip.expenses.map((expense) => ({
      ...expense,
      id: ensureUuid(`${trip.id}:${expense.id}`),
      paidBy: travelerIds.get(expense.paidBy) ?? fallbackTraveler,
      splitWith: expense.splitWith
        .map((id) => travelerIds.get(id))
        .filter((id): id is string => Boolean(id)),
    })),
  };
}

/* ------------------------------ reading ----------------------------- */

/** Every trip the user can see: their own, plus any they were added to. */
export async function listTrips(
  supabase: SupabaseClient,
): Promise<Trip[]> {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<TripRow[]>();

  if (error || !trips?.length) {
    if (error) console.error("[trips] list failed:", error.message);
    return [];
  }

  const ids = trips.map((trip) => trip.id);

  // Three flat queries rather than a nested select: RLS on a nested select has
  // to be evaluated per embedded row, and this is both faster and easier to
  // reason about when a policy misbehaves.
  const [travelers, expenses] = await Promise.all([
    supabase
      .from("trip_travelers")
      .select("*")
      .in("trip_id", ids)
      .returns<TravelerRow[]>(),
    supabase
      .from("expenses")
      .select("*")
      .in("trip_id", ids)
      .order("spent_on", { ascending: false })
      .returns<ExpenseRow[]>(),
  ]);

  const expenseIds = (expenses.data ?? []).map((expense) => expense.id);
  const splits = expenseIds.length
    ? await supabase
        .from("expense_splits")
        .select("*")
        .in("expense_id", expenseIds)
        .returns<SplitRow[]>()
    : { data: [] as SplitRow[] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return trips.map((trip) =>
    rowsToTrip(
      trip,
      (travelers.data ?? []).filter((row) => row.trip_id === trip.id),
      (expenses.data ?? []).filter((row) => row.trip_id === trip.id),
      (splits.data ?? []).filter((row) =>
        (expenses.data ?? []).some(
          (expense) => expense.id === row.expense_id && expense.trip_id === trip.id,
        ),
      ),
      user?.id,
    ),
  );
}

export async function getTrip(
  supabase: SupabaseClient,
  tripId: string,
): Promise<Trip | null> {
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle<TripRow>();

  if (!trip) return null;

  const [travelers, expenses] = await Promise.all([
    supabase
      .from("trip_travelers")
      .select("*")
      .eq("trip_id", tripId)
      .returns<TravelerRow[]>(),
    supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .returns<ExpenseRow[]>(),
  ]);

  const expenseIds = (expenses.data ?? []).map((expense) => expense.id);
  const splits = expenseIds.length
    ? await supabase
        .from("expense_splits")
        .select("*")
        .in("expense_id", expenseIds)
        .returns<SplitRow[]>()
    : { data: [] as SplitRow[] };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return rowsToTrip(
    trip,
    travelers.data ?? [],
    expenses.data ?? [],
    splits.data ?? [],
    user?.id,
  );
}

/* ------------------------------ writing ----------------------------- */

/**
 * Write a whole trip. Creates it if it does not exist, replaces it if it does.
 *
 * Delete order matters: splits reference expenses, expenses reference
 * travelers with ON DELETE RESTRICT. Removing a traveler before the expenses
 * that point at them would be rejected by the database — correctly, since
 * that would be money with no payer.
 */
export async function saveTrip(
  supabase: SupabaseClient,
  userId: string,
  input: Trip,
): Promise<Trip | null> {
  const trip = canonicalise(input);

  const { error: tripError } = await supabase.from("trips").upsert(
    {
      id: trip.id,
      owner_id: userId,
      title: trip.title,
      country: trip.country,
      destination_id: trip.destinationId,
      summary: trip.summary,
      start_date: trip.startDate,
      end_date: trip.endDate,
      days: Math.max(1, Math.min(365, trip.days || 1)),
      budget: Math.max(0, trip.budget || 0),
      currency: trip.currency || "INR",
      tone: trip.tone,
      status: trip.status,
      itinerary: trip.itinerary,
      packing: trip.packing,
      milestones: trip.milestones,
    },
    { onConflict: "id" },
  );

  if (tripError) {
    console.error("[trips] save failed:", tripError.message);
    return null;
  }

  const travelerIds = trip.travelers.map((traveler) => traveler.id);
  const expenseIds = trip.expenses.map((expense) => expense.id);

  /* ---------------------------------------------------------------------
     Ordering matters, and it is not the obvious one.

     expenses.paid_by is ON DELETE RESTRICT, so a traveler cannot be removed
     while any expense row still points at them. The client has already
     reassigned those expenses to someone who remains — but that reassignment
     only reaches the database when the expenses are written. So the roster
     grows first, the expenses are rewritten against it, and only then do the
     departed travelers get deleted.
     ------------------------------------------------------------------- */

  /* -------------------- 1. add/refresh everyone present -------------- */

  if (trip.travelers.length) {
    const { error } = await supabase.from("trip_travelers").upsert(
      trip.travelers.map((traveler, position) => ({
        id: traveler.id,
        trip_id: trip.id,
        name: traveler.name,
        initials: traveler.initials,
        tone: traveler.tone,
        email: traveler.email ?? null,
        is_you: Boolean(traveler.isYou),
        position,
      })),
      { onConflict: "id" },
    );
    if (error) console.error("[trips] travelers failed:", error.message);
  }

  /* ------------------ 2. drop expenses that are gone ----------------- */

  const { data: existingExpenses } = await supabase
    .from("expenses")
    .select("id")
    .eq("trip_id", trip.id)
    .returns<{ id: string }[]>();

  const staleExpenses = (existingExpenses ?? [])
    .map((row) => row.id)
    .filter((id) => !expenseIds.includes(id));

  if (staleExpenses.length) {
    await supabase.from("expense_splits").delete().in("expense_id", staleExpenses);
    await supabase.from("expenses").delete().in("id", staleExpenses);
  }

  /* ----------------------- 3. upsert the expenses -------------------- */

  if (trip.expenses.length) {
    const { error } = await supabase.from("expenses").upsert(
      trip.expenses.map((expense) => ({
        id: expense.id,
        trip_id: trip.id,
        label: expense.label,
        amount: Math.max(0, expense.amount),
        category: expense.category,
        paid_by: expense.paidBy,
        spent_on: parseDisplayDate(expense.date),
        created_by: userId,
      })),
      { onConflict: "id" },
    );
    if (error) console.error("[trips] expenses failed:", error.message);

    // Splits are replaced wholesale — an expense has a handful of them and
    // diffing would cost more than rewriting.
    await supabase.from("expense_splits").delete().in("expense_id", expenseIds);

    const splits = trip.expenses.flatMap((expense) =>
      (expense.splitWith.length ? expense.splitWith : travelerIds).map(
        (travelerId) => ({
          expense_id: expense.id,
          traveler_id: travelerId,
          weight: 1,
        }),
      ),
    );

    if (splits.length) {
      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits);
      if (splitError) console.error("[trips] splits failed:", splitError.message);
    }
  }

  /* ------------- 4. finally, remove travellers who left -------------- */

  if (travelerIds.length) {
    const { error } = await supabase
      .from("trip_travelers")
      .delete()
      .eq("trip_id", trip.id)
      .not("id", "in", `(${travelerIds.join(",")})`);

    // A rejection here means an expense still points at a removed traveler,
    // which is a client-side bug worth seeing rather than swallowing.
    if (error) console.error("[trips] traveler cleanup failed:", error.message);
  }

  return getTrip(supabase, trip.id);
}

export async function deleteTrip(
  supabase: SupabaseClient,
  tripId: string,
): Promise<boolean> {
  // Cascades handle travelers, expenses and splits.
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) {
    console.error("[trips] delete failed:", error.message);
    return false;
  }
  return true;
}
