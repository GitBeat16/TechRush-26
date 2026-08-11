"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayAvatar } from "@/components/ui/ClayAvatar";
import { CheckIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/ui/Icons";
import { springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { useSession } from "@/lib/auth/session";
import { readTrips, useAppState } from "@/lib/store";
import { startTripSync } from "@/lib/sync/trips";
import {
  INVITE_ERROR_COPY,
  formatInviteCode,
  normaliseInviteCode,
  type InviteError,
  type TripInvite,
} from "@/types/invite";
import type { Trip } from "@/types/dashboard";

type Mode = "join" | "share";

/**
 * Travelling together.
 *
 * Two halves of one idea: take a code someone gave you, or hand one out.
 * Sits on the trips overview because that is where you are when you realise
 * a trip has other people in it.
 */
export function TravellingTogether() {
  const { trips } = useAppState();
  const { user } = useSession();
  const [mode, setMode] = useState<Mode>("join");

  // Only trips the server knows about can carry an invite: the code points at
  // a uuid foreign key, and a trip that has not synced yet still has a local
  // id like "trip-msnosqcc". Offering those would produce a code that cannot
  // be created, so they are counted and explained instead.
  const owned = useMemo(
    () => trips.filter((trip) => trip.ownerId && trip.ownerId === user?.id),
    [trips, user?.id],
  );
  const joined = useMemo(
    () => trips.filter((trip) => trip.ownerId && trip.ownerId !== user?.id),
    [trips, user?.id],
  );
  const unsynced = useMemo(() => trips.filter((trip) => !trip.ownerId).length, [trips]);

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="border-4 border-white/70 p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-clay-sm bg-clay-mint text-clay-ink shadow-clay-xs">
          <UsersIcon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-title text-lg leading-tight text-clay-ink">Travelling together</h2>
          <p className="font-body text-[11.5px] text-clay-ink-soft">
            {joined.length > 0
              ? `You're on ${joined.length} shared ${joined.length === 1 ? "trip" : "trips"}`
              : "Share a code so friends can join and split costs"}
          </p>
        </div>

        <div className="flex rounded-full bg-clay-sunken p-1 shadow-clay-inset-sm">
          {(["join", "share"] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                feedback("tap");
                setMode(value);
              }}
              aria-pressed={mode === value}
              className="relative rounded-full px-3.5 py-1.5 font-display text-[12px] font-bold"
            >
              {mode === value && (
                <motion.span
                  layoutId="together-tab"
                  transition={springSnappy}
                  className="absolute inset-0 rounded-full bg-clay-surface shadow-clay-xs"
                />
              )}
              <span className={`relative ${mode === value ? "text-clay-ink" : "text-clay-muted"}`}>
                {value === "join" ? "Join" : "Invite"}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          {mode === "join" ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={springSnappy}
            >
              <JoinByCode />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={springSnappy}
            >
              <ShareATrip trips={owned} unsynced={unsynced} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ClayCard>
  );
}

/* ------------------------------------------------------------------ */
/* Join                                                                */
/* ------------------------------------------------------------------ */

function JoinByCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<InviteError | null>(null);
  const [joined, setJoined] = useState<string | null>(null);

  const clean = normaliseInviteCode(code);
  const ready = clean.length === 8 && !busy;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/trips/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      const data = (await response.json()) as { tripId?: string; reason?: InviteError };

      if (!response.ok || !data.tripId) {
        setError(data.reason ?? "unknown");
        feedback("toggleOff");
        return;
      }

      feedback("success");
      setJoined(data.tripId);

      // The trip only exists on the server until sync pulls it down, so the
      // list behind this card would stay empty without a refresh.
      await startTripSync(readTrips());
      router.push(`/trips/${data.tripId}`);
    } catch {
      setError("unknown");
      feedback("toggleOff");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label
        htmlFor="invite-code"
        className="mb-2 block font-body text-[10px] font-extrabold uppercase tracking-[0.14em] text-clay-muted"
      >
        Enter an invite code
      </label>

      <div className="flex flex-wrap gap-2.5">
        <input
          id="invite-code"
          value={formatInviteCode(clean) || code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          placeholder="WNDR-4K2P"
          autoComplete="off"
          spellCheck={false}
          maxLength={9}
          className="h-12 min-w-[170px] flex-1 rounded-clay-sm bg-clay-sunken px-4 text-center font-title text-lg uppercase tracking-[0.18em] text-clay-ink shadow-clay-inset-sm outline-none placeholder:font-body placeholder:tracking-normal placeholder:text-clay-muted focus:shadow-clay-inset"
        />
        <ClayButton type="submit" variant="primary" disabled={!ready} sound={null}>
          {busy ? "Joining" : "Join trip"}
        </ClayButton>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2.5 rounded-clay-sm bg-clay-blush px-3.5 py-2.5 font-body text-[12px] font-bold text-clay-ink shadow-clay-xs"
          >
            {INVITE_ERROR_COPY[error]}
          </motion.p>
        )}
        {joined && !error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2.5 flex items-center gap-1.5 font-body text-[12px] font-bold text-clay-jade"
          >
            <CheckIcon size={14} />
            You&apos;re in. Opening the trip.
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-3 font-body text-[11px] leading-relaxed text-clay-muted">
        Once you join you can see the itinerary and log what you spend, so the
        split stays honest. Only the trip owner edits the plan itself.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Invite                                                              */
/* ------------------------------------------------------------------ */

function ShareATrip({ trips, unsynced }: { trips: Trip[]; unsynced: number }) {
  const [selectedId, setSelectedId] = useState(trips[0]?.id ?? "");
  const selected = trips.find((trip) => trip.id === selectedId) ?? trips[0];

  if (trips.length === 0) {
    return unsynced > 0 ? (
      <SyncPrompt count={unsynced} />
    ) : (
      <p className="rounded-clay-sm bg-clay-sunken/60 p-4 text-center font-body text-[12.5px] text-clay-ink-soft shadow-clay-inset-sm">
        Plan a trip first, then you&apos;ll have something to invite people to.
      </p>
    );
  }

  return (
    <div>
      {unsynced > 0 && (
        <p className="mb-3 rounded-clay-sm bg-clay-butter/60 px-3.5 py-2.5 font-body text-[11.5px] text-clay-ink shadow-clay-xs">
          {unsynced} {unsynced === 1 ? "trip is" : "trips are"} still syncing and can&apos;t be
          shared yet.
        </p>
      )}
      {trips.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {trips.map((trip) => {
            const active = trip.id === selected?.id;
            return (
              <button
                key={trip.id}
                type="button"
                onClick={() => {
                  feedback("tap");
                  setSelectedId(trip.id);
                }}
                aria-pressed={active}
                className={`max-w-[170px] truncate rounded-full px-3 py-1.5 font-body text-[11.5px] font-bold transition-colors ${
                  active
                    ? "bg-clay-butter text-clay-ink shadow-clay-xs"
                    : "bg-clay-sunken/70 text-clay-muted shadow-clay-inset-sm hover:text-clay-ink"
                }`}
              >
                {trip.title}
              </button>
            );
          })}
        </div>
      )}

      {selected && <InviteManager key={selected.id} trip={selected} />}
    </div>
  );
}

/**
 * Shown when nothing is shareable because nothing has reached the server.
 * Retrying in place beats telling someone to reload and hope — and if the
 * retry fails too, that is a real answer rather than a longer wait.
 */
function SyncPrompt({ count }: { count: number }) {
  const [state, setState] = useState<"idle" | "syncing" | "failed">("idle");

  async function retry() {
    setState("syncing");
    feedback("press");
    await startTripSync(readTrips());

    // adoptTrips flows back through the store, so if it worked this component
    // re-renders with owned trips and unmounts before the timeout matters.
    window.setTimeout(() => setState("failed"), 1200);
  }

  return (
    <div className="rounded-clay-sm bg-clay-sunken/60 p-4 text-center shadow-clay-inset-sm">
      <p className="font-body text-[12.5px] text-clay-ink-soft">
        {count === 1 ? "Your trip hasn't" : `Your ${count} trips haven't`} reached the server
        yet, so there is nothing to attach a code to.
      </p>

      <ClayButton
        size="sm"
        tone="mint"
        onClick={retry}
        disabled={state === "syncing"}
        className="mt-3"
        sound={null}
      >
        {state === "syncing" ? "Syncing" : "Try syncing now"}
      </ClayButton>

      {state === "failed" && (
        <p className="mt-3 font-body text-[11.5px] leading-relaxed text-clay-muted">
          Still not synced. Open the browser console — a rejected write logs the
          reason there, and a database permission error means a migration is
          waiting to be applied.
        </p>
      )}
    </div>
  );
}

function InviteManager({ trip }: { trip: Trip }) {
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Fetching is exactly what an effect is for. State lands in the promise
  // callbacks rather than the effect body, and the component is keyed on the
  // trip id upstream, so switching trips remounts with `loading` already true.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trips/${trip.id}/invites`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { invites?: TripInvite[]; error?: string }) => {
        if (cancelled) return;
        setInvites(data.invites ?? []);
        // An error and an empty list look identical otherwise, which is how a
        // missing grant disguises itself as "no invites yet".
        setProblem(data.error ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setInvites([]);
        setProblem("Couldn't reach the server. Check your connection.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  async function create() {
    setCreating(true);
    setProblem(null);
    feedback("press");
    try {
      const response = await fetch(`/api/trips/${trip.id}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expiresInDays: 30 }),
      });
      const data = (await response.json()) as { invite?: TripInvite; error?: string };

      if (!response.ok || !data.invite) {
        setProblem(data.error ?? "Could not create a code. Try again.");
        feedback("toggleOff");
        return;
      }

      setInvites((prev) => [data.invite as TripInvite, ...prev]);
      feedback("success");
    } catch {
      setProblem("Couldn't reach the server. Check your connection.");
      feedback("toggleOff");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(code: string) {
    feedback("toggleOff");
    setInvites((prev) =>
      prev.map((invite) =>
        invite.code === code
          ? { ...invite, active: false, revokedAt: new Date().toISOString() }
          : invite,
      ),
    );
    await fetch(`/api/trips/invites/${code}`, { method: "DELETE" });
  }

  const live = invites.filter((invite) => invite.active);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex -space-x-2">
          {trip.travelers.slice(0, 5).map((traveler) => (
            <ClayAvatar
              key={traveler.id}
              id={traveler.id}
              initials={traveler.initials}
              size={28}
            />
          ))}
        </div>
        <p className="font-body text-[11.5px] text-clay-ink-soft">
          {trip.travelers.length} on this trip
        </p>

        <ClayButton
          size="sm"
          tone="mint"
          onClick={create}
          disabled={creating}
          leftIcon={<PlusIcon size={14} />}
          sound={null}
          className="ml-auto"
        >
          {creating ? "Creating" : "New code"}
        </ClayButton>
      </div>

      {problem && (
        <p className="mb-2.5 rounded-clay-sm bg-clay-blush px-3.5 py-2.5 font-body text-[12px] font-bold leading-snug text-clay-ink shadow-clay-xs">
          {problem}
        </p>
      )}

      {loading ? (
        <div className="h-16 animate-pulse rounded-clay-sm bg-clay-sunken/60" />
      ) : live.length === 0 && !problem ? (
        <p className="rounded-clay-sm bg-clay-sunken/60 p-4 text-center font-body text-[12.5px] text-clay-ink-soft shadow-clay-inset-sm">
          No active codes. Create one and share it however you like.
        </p>
      ) : (
        <motion.div layout className="space-y-2">
          {live.map((invite) => (
            <InviteRow key={invite.id} invite={invite} onRevoke={() => revoke(invite.code)} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function InviteRow({ invite, onRevoke }: { invite: TripInvite; onRevoke: () => void }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const link =
    typeof window === "undefined" ? "" : `${window.location.origin}/join/${invite.code}`;

  async function copy(what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(what === "code" ? invite.code : link);
      feedback("success");
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      feedback("toggleOff");
    }
  }

  const remaining =
    invite.maxUses === null ? null : Math.max(0, invite.maxUses - invite.uses);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSoft}
      className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-clay-sm bg-clay-raised/85 p-3 shadow-clay-xs"
    >
      <p className="font-title text-base tracking-[0.12em] text-clay-ink">
        {formatInviteCode(invite.code)}
      </p>

      <p className="font-body text-[11px] text-clay-muted">
        {invite.uses === 0 ? "Unused" : `Used ${invite.uses}×`}
        {remaining !== null && ` · ${remaining} left`}
        {invite.expiresAt && ` · expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
      </p>

      <div className="ml-auto flex items-center gap-1.5">
        <SmallButton onClick={() => copy("code")} active={copied === "code"}>
          {copied === "code" ? "Copied" : "Code"}
        </SmallButton>
        <SmallButton onClick={() => copy("link")} active={copied === "link"}>
          {copied === "link" ? "Copied" : "Link"}
        </SmallButton>
        <button
          type="button"
          onClick={onRevoke}
          aria-label="Turn this code off"
          title="Turn this code off"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-clay-sunken/70 text-clay-muted shadow-clay-inset-sm transition-colors hover:text-clay-rose"
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </motion.div>
  );
}

function SmallButton({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      transition={springSnappy}
      onClick={onClick}
      className={`flex h-8 items-center gap-1 rounded-full px-3 font-body text-[11px] font-bold shadow-clay-xs transition-colors ${
        active ? "bg-clay-mint text-clay-ink" : "bg-clay-sunken/80 text-clay-ink-soft hover:text-clay-ink"
      }`}
    >
      {active && <CheckIcon size={12} />}
      {children}
    </motion.button>
  );
}
