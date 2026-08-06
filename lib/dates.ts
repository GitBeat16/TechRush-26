/* ------------------------------------------------------------------ */
/* Dates                                                               */
/*                                                                     */
/* Trips store dates as ISO `YYYY-MM-DD` strings and nothing else. An   */
/* empty string means "not set yet", which is a real state — a trip can */
/* exist before anyone has agreed when to go.                           */
/*                                                                     */
/* Everything here is deliberately timezone-free. A trip that starts on */
/* the 14th starts on the 14th regardless of where you open the app,    */
/* so dates are treated as plain calendar days, never as instants.      */
/* ------------------------------------------------------------------ */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * True for a well-formed, real calendar date. Rejects 2026-02-31.
 *
 * Not a type predicate on purpose — narrowing to `string` would make the
 * *false* branch `never` for callers who already hold a string, which is
 * exactly backwards.
 */
export function isIsoDate(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const match = ISO.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const month = Number(m);
  if (month < 1 || month > 12) return false;
  const day = Number(d);
  return day >= 1 && day <= daysInMonth(Number(y), month - 1);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** A Date (UTC noon, so no timezone can push it onto a neighbouring day). */
function toDate(iso: string): Date | null {
  if (!isIsoDate(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function fromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

export function todayIso(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/* ---------------------------------------------------------- parsing */

/**
 * Coerce whatever a date field holds into ISO, or "" if it cannot be read.
 *
 * This exists for one reason: trips used to store display strings like
 * "14 Oct 2026" or the placeholder "Dates to set". Rather than guess at read
 * time forever, the store runs everything through here once on load.
 */
export function toIsoDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  if (isIsoDate(raw)) return raw;

  // "14 Oct 2026" / "14 October 2026" / "Oct 14 2026" / "14-10-2026"
  const cleaned = raw.replace(/[,]/g, " ").replace(/\s+/g, " ").trim();

  const dayFirst = /^(\d{1,2})[\s\-/]([A-Za-z]+)[\s\-/](\d{4})$/.exec(cleaned);
  const monthFirst = /^([A-Za-z]+)[\s\-/](\d{1,2})[\s\-/](\d{4})$/.exec(cleaned);
  const numeric = /^(\d{1,2})[\-/](\d{1,2})[\-/](\d{4})$/.exec(cleaned);

  if (dayFirst) {
    const month = monthIndexFromName(dayFirst[2]);
    if (month >= 0) return build(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }
  if (monthFirst) {
    const month = monthIndexFromName(monthFirst[1]);
    if (month >= 0) return build(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }
  if (numeric) {
    // Ambiguous by nature; day-first, because the rest of the app is en-IN.
    return build(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]));
  }

  return "";
}

function monthIndexFromName(name: string): number {
  const key = name.slice(0, 3).toLowerCase();
  return MONTHS.findIndex((month) => month.toLowerCase() === key);
}

function build(year: number, monthIndex: number, day: number): string {
  if (monthIndex < 0 || monthIndex > 11) return "";
  if (day < 1 || day > daysInMonth(year, monthIndex)) return "";
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/* -------------------------------------------------------- formatting */

/** "14 Oct 2026". Returns the fallback when the date is not set. */
export function formatDate(iso: string, fallback = "Not set"): string {
  const date = toDate(iso);
  if (!date) return fallback;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "14 Oct" — for tight spaces where the year is obvious from context. */
export function formatDateShort(iso: string, fallback = "—"): string {
  const date = toDate(iso);
  if (!date) return fallback;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTHS_LONG[monthIndex]} ${year}`;
}

/**
 * "14 – 23 Oct 2026", collapsing whatever the two ends share.
 * A range with no end reads as "From 14 Oct 2026".
 */
export function formatRange(startIso: string, endIso: string): string {
  const start = toDate(startIso);
  const end = toDate(endIso);

  if (!start && !end) return "Dates not set";
  if (start && !end) return `From ${formatDate(startIso)}`;
  if (!start && end) return `Until ${formatDate(endIso)}`;
  if (!start || !end) return "Dates not set";

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

  if (sameMonth) {
    return `${start.getUTCDate()} – ${end.getUTCDate()} ${
      MONTHS[end.getUTCMonth()]
    } ${end.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${end.getUTCDate()} ${
      MONTHS[end.getUTCMonth()]
    } ${end.getUTCFullYear()}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/* ----------------------------------------------------------- maths */

const DAY_MS = 86_400_000;

/** Whole days from a to b. Negative when b is earlier. */
export function daysBetween(aIso: string, bIso: string): number | null {
  const a = toDate(aIso);
  const b = toDate(bIso);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Nights a trip covers. A single-day trip is 1 day, 0 nights. */
export function nightsBetween(startIso: string, endIso: string): number {
  const gap = daysBetween(startIso, endIso);
  return gap === null ? 0 : Math.max(0, gap);
}

/** Days the trip occupies, inclusive of both ends. */
export function tripLength(startIso: string, endIso: string): number {
  const gap = daysBetween(startIso, endIso);
  return gap === null ? 0 : Math.max(1, gap + 1);
}

export function addDays(iso: string, amount: number): string {
  const date = toDate(iso);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + amount);
  return fromDate(date);
}

/** Days until a date from today. Negative once it is in the past. */
export function daysUntil(iso: string, from = todayIso()): number | null {
  return daysBetween(from, iso);
}

export function isPast(iso: string, from = todayIso()): boolean {
  const gap = daysBetween(from, iso);
  return gap !== null && gap < 0;
}

export function isFuture(iso: string, from = todayIso()): boolean {
  const gap = daysBetween(from, iso);
  return gap !== null && gap > 0;
}

/** True when `iso` sits inside [start, end], ends included. */
export function isWithin(iso: string, startIso: string, endIso: string): boolean {
  if (!isIsoDate(iso)) return false;
  const start = startIso || endIso;
  const end = endIso || startIso;
  if (!isIsoDate(start) || !isIsoDate(end)) return false;
  return iso >= start && iso <= end; // ISO strings sort chronologically
}

/**
 * A friendly countdown: "in 12 days", "tomorrow", "today", "3 weeks ago".
 * Deliberately coarse — the dashboard wants a feeling, not a stopwatch.
 */
export function relativeDay(iso: string, from = todayIso()): string {
  const gap = daysBetween(from, iso);
  if (gap === null) return "";
  if (gap === 0) return "today";
  if (gap === 1) return "tomorrow";
  if (gap === -1) return "yesterday";
  if (gap > 0) {
    if (gap < 14) return `in ${gap} days`;
    if (gap < 60) return `in ${Math.round(gap / 7)} weeks`;
    return `in ${Math.round(gap / 30)} months`;
  }
  const past = Math.abs(gap);
  if (past < 14) return `${past} days ago`;
  if (past < 60) return `${Math.round(past / 7)} weeks ago`;
  if (past < 365) return `${Math.round(past / 30)} months ago`;
  return `${Math.round(past / 365)} years ago`;
}

/* --------------------------------------------------------- calendar */

export interface CalendarCell {
  iso: string;
  day: number;
  /** False for the leading/trailing days borrowed from adjacent months. */
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Six weeks of cells for a month grid, Monday first.
 *
 * Always six rows, never five: a grid that changes height as you page
 * through months makes the whole dashboard jump.
 */
export function monthMatrix(
  year: number,
  monthIndex: number,
  today = todayIso(),
): CalendarCell[] {
  const first = new Date(Date.UTC(year, monthIndex, 1, 12));
  // getUTCDay is Sunday-first; shift so Monday is 0.
  const lead = (first.getUTCDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  const cursor = new Date(first);
  cursor.setUTCDate(cursor.getUTCDate() - lead);

  for (let i = 0; i < 42; i += 1) {
    const iso = fromDate(cursor);
    const weekday = cursor.getUTCDay();
    cells.push({
      iso,
      day: cursor.getUTCDate(),
      inMonth: cursor.getUTCMonth() === monthIndex,
      isToday: iso === today,
      isWeekend: weekday === 0 || weekday === 6,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return cells;
}

/** Step a {year, month} pair by whole months, wrapping the year. */
export function shiftMonth(
  year: number,
  monthIndex: number,
  by: number,
): { year: number; monthIndex: number } {
  const total = year * 12 + monthIndex + by;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}
