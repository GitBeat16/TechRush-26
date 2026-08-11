"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayScene, SCENE_BY_ID } from "@/components/ui/ClayIllustrations";
import { CalendarIcon, PinIcon, UsersIcon } from "@/components/ui/Icons";
import { TONES } from "@/lib/tones";
import { fadeUp, springSoft, stagger } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { readTrips } from "@/lib/store";
import { startTripSync } from "@/lib/sync/trips";
import {
  INVITE_ERROR_COPY,
  formatInviteCode,
  normaliseInviteCode,
  type InviteError,
  type InvitePreview,
} from "@/types/invite";

type State =
  | { kind: "loading" }
  | { kind: "ready"; preview: InvitePreview }
  | { kind: "dead"; reason: InviteError };

/**
 * What a pasted invite link opens: enough of the trip to recognise it, and
 * one button. The preview comes from a definer function that returns a
 * deliberately thin slice — no itinerary, no budget, no member names — so
 * holding a code never reveals more than the decision needs.
 */
export function JoinView({ code }: { code: string }) {
  const router = useRouter();
  const clean = normaliseInviteCode(code);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<InviteError | null>(null);

  // State lands in the promise callbacks, not the effect body — a synchronous
  // setState here would cascade a render before the fetch has said anything.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/trips/join?code=${encodeURIComponent(clean)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { preview: InvitePreview | null } | null) => {
        if (cancelled) return;
        if (!data) {
          setState({ kind: "dead", reason: "unknown" });
          return;
        }
        setState(
          data.preview
            ? { kind: "ready", preview: data.preview }
            : { kind: "dead", reason: "invalid" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "dead", reason: "unknown" });
      });

    return () => {
      cancelled = true;
    };
  }, [clean]);

  async function join() {
    if (state.kind !== "ready") return;

    setJoining(true);
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
      await startTripSync(readTrips());
      router.push(`/trips/${data.tripId}`);
    } catch {
      setError("unknown");
      feedback("toggleOff");
    } finally {
      setJoining(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <ClayCard tone="surface" radius="xl" depth="lg" className="p-8">
          <div className="h-40 animate-pulse rounded-clay bg-clay-sunken/60" />
        </ClayCard>
      </div>
    );
  }

  if (state.kind === "dead") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <ClayCard tone="surface" radius="xl" depth="lg" className="p-8 text-center">
          <p className="font-title text-xl text-clay-ink">This invite doesn&apos;t work</p>
          <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-relaxed text-clay-ink-soft">
            {INVITE_ERROR_COPY[state.reason]}
          </p>
          <Link href="/trips" className="mt-5 inline-block">
            <ClayButton size="sm" tone="mint">
              Go to my trips
            </ClayButton>
          </Link>
        </ClayCard>
      </div>
    );
  }

  const { preview } = state;
  const scene = SCENE_BY_ID[preview.destinationId] ?? "coast";

  return (
    <motion.div
      variants={stagger(0.07)}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-lg py-8"
    >
      <motion.p
        variants={fadeUp}
        className="mb-3 text-center font-body text-[11px] font-extrabold uppercase tracking-[0.16em] text-clay-muted"
      >
        {preview.ownerName} invited you
      </motion.p>

      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="xl" depth="lg" className="overflow-hidden border-4 border-white/70">
          <div className="relative h-40">
            <ClayScene kind={scene} base={TONES[preview.tone].hex} className="h-full w-full" />
          </div>

          <div className="p-6">
            <h1 className="font-title text-2xl leading-tight text-clay-ink">{preview.title}</h1>
            {preview.summary && (
              <p className="mt-1.5 font-body text-[13px] leading-relaxed text-clay-ink-soft">
                {preview.summary}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {preview.country && (
                <Pill icon={<PinIcon size={12} />}>{preview.country}</Pill>
              )}
              <Pill icon={<CalendarIcon size={12} />}>{preview.days} days</Pill>
              <Pill icon={<UsersIcon size={12} />}>
                {preview.travelerCount} {preview.travelerCount === 1 ? "traveller" : "travellers"}
              </Pill>
            </div>

            <div className="mt-6">
              {preview.alreadyMember ? (
                <Link href={`/trips/${preview.tripId}`} onClick={() => feedback("nav")}>
                  <ClayButton variant="primary" fullWidth sound={null}>
                    You&apos;re already on this trip — open it
                  </ClayButton>
                </Link>
              ) : (
                <ClayButton
                  variant="primary"
                  fullWidth
                  onClick={join}
                  disabled={joining}
                  sound={null}
                >
                  {joining ? "Joining" : "Join this trip"}
                </ClayButton>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSoft}
                  className="mt-3 rounded-clay-sm bg-clay-blush px-3.5 py-2.5 font-body text-[12px] font-bold text-clay-ink shadow-clay-xs"
                >
                  {INVITE_ERROR_COPY[error]}
                </motion.p>
              )}

              <p className="mt-3 text-center font-body text-[11px] leading-relaxed text-clay-muted">
                Joining lets you see the plan and log what you spend. Code{" "}
                {formatInviteCode(clean)}.
              </p>
            </div>
          </div>
        </ClayCard>
      </motion.div>
    </motion.div>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-clay-sunken px-2.5 py-1 font-body text-[11px] font-bold text-clay-ink-soft shadow-clay-inset-sm">
      {icon}
      {children}
    </span>
  );
}
