import type { ClayTone, Trip, Traveler } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* Travel companions                                                   */
/*                                                                     */
/* A traveler is whoever a cost can be split with. The signed-in user   */
/* is always one of them, flagged isYou so the UI can say "you" instead */
/* of repeating their name and so they cannot be removed by accident.   */
/* ------------------------------------------------------------------ */

/** Colours cycle in this order so a group never has two identical avatars. */
const TONE_CYCLE: ClayTone[] = ["peach", "mint", "lilac", "sky", "blush", "butter"];

export function toneForIndex(index: number): ClayTone {
  return TONE_CYCLE[index % TONE_CYCLE.length];
}

/** "Aarav Sharma" → "AS", "Meera" → "ME". Always two characters. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function makeTraveler(
  name: string,
  index: number,
  options: { id?: string; email?: string; isYou?: boolean } = {},
): Traveler {
  const clean = name.trim() || "Traveller";
  return {
    id:
      options.id ??
      `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: clean,
    initials: initialsFor(clean),
    tone: toneForIndex(index),
    ...(options.email ? { email: options.email } : {}),
    ...(options.isYou ? { isYou: true } : {}),
  };
}

/** The "you" row, built from the signed-in profile. */
export function selfTraveler(name: string | undefined, email?: string): Traveler {
  return makeTraveler(name || "You", 0, { id: "self", email, isYou: true });
}

export interface Transfer {
  from: Traveler;
  to: Traveler;
  amount: number;
}

/**
 * Turn per-person balances into the shortest list of payments that settles
 * the trip.
 *
 * Greedy largest-debtor-pays-largest-creditor. It is not provably minimal in
 * every case, but for real group sizes it produces at most n-1 transfers and
 * is instant — the alternative is an NP-hard partition search nobody needs
 * for a five-person holiday.
 */
export function settleUp(
  balances: { traveler: Traveler; balance: number }[],
): Transfer[] {
  // Ignore rounding dust: a one-rupee imbalance is not worth a transfer row.
  const debtors = balances
    .filter((entry) => entry.balance < -1)
    .map((entry) => ({ ...entry, balance: -entry.balance }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = balances
    .filter((entry) => entry.balance > 1)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.balance - a.balance);

  const transfers: Transfer[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 1) {
      transfers.push({
        from: debtor.traveler,
        to: creditor.traveler,
        amount: Math.round(amount),
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance <= 1) debtorIndex += 1;
    if (creditor.balance <= 1) creditorIndex += 1;
  }

  return transfers;
}

/** What each person owes for a single expense, after the split. */
export function shareOf(
  amount: number,
  splitCount: number,
): number {
  if (splitCount <= 0) return amount;
  return Math.round(amount / splitCount);
}

/** Everyone on a trip except the signed-in user. */
export function companionsOf(trip: Trip): Traveler[] {
  return trip.travelers.filter((traveler) => !traveler.isYou);
}
