"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { ClayButton, ClayChip } from "@/components/ui/ClayButton";
import { ClayGlobe } from "@/components/ui/ClayIllustrations";
import { CompanionPicker } from "@/components/trip/CompanionPicker";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  PinIcon,
  RefreshIcon,
  SparkIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import {
  fadeUp,
  floatY,
  popIn,
  revealViewport,
  springBouncy,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { useSession } from "@/lib/auth/session";
import { plannerDefaults } from "@/lib/personalize";
import { selfTraveler } from "@/lib/travelers";
import { actions } from "@/lib/store";
import { AI_STEPS, INTERESTS, TRAVEL_STYLES, formatInr } from "@/lib/data";
import type { GeneratedPlan, PlannerState, TravelStyle, Traveler } from "@/types/dashboard";
import type { TravelGroup } from "@/types/auth";

type Phase = "idle" | "thinking" | "ready" | "error";

const INITIAL: PlannerState = {
  destination: "",
  budget: 90000,
  duration: 7,
  style: "Adventure",
  interests: ["Food", "Nature"],
};

export function AIPlanner({ initialDestination = "" }: { initialDestination?: string }) {
  const router = useRouter();
  const { play } = useFeedback();
  const { user } = useSession();
  const preferences = user?.preferences ?? null;

  // The questionnaire already answered "how long", "how much" and "with whom" —
  // asking again from a blank form would be a worse experience than prefilling.
  const defaults = useMemo(() => plannerDefaults(preferences), [preferences]);

  const [state, setState] = useState<PlannerState>({
    ...INITIAL,
    destination: initialDestination,
  });

  const [group, setGroup] = useState<TravelGroup | null>(null);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const seeded = useRef(false);

  /* Seed once from the profile, and never again — re-running this on every
     session refresh would stomp on whatever the user has since typed. */
  useEffect(() => {
    if (seeded.current || !user) return;
    seeded.current = true;

    setState((current) => ({
      ...current,
      budget: defaults.budget,
      duration: defaults.days,
    }));
    setGroup(preferences?.travelGroup ?? "solo");

    const self = selfTraveler(user.name, user.email);
    const placeholders = Array.from(
      { length: Math.max(0, defaults.groupSize - 1) },
      (_, index) => ({
        id: `seed-${index}`,
        name: `Traveller ${index + 2}`,
        initials: `T${index + 2}`,
        tone: "mint" as const,
      }),
    );
    setTravelers([self, ...placeholders]);
  }, [user, defaults, preferences]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState("");
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearInterval);
    },
    [],
  );

  async function generate() {
    if (phase === "thinking") return;

    timers.current.forEach(clearInterval);
    timers.current = [];
    setPhase("thinking");
    setStep(0);
    setError("");

    // The step ticker is cosmetic: it advances while the request is in flight
    // and stops one short of the end, so the last tick lands with the answer.
    const ticker = setInterval(() => {
      setStep((current) => {
        if (current >= AI_STEPS.length - 2) return current;
        play("pop");
        return current + 1;
      });
    }, 900);
    timers.current.push(ticker);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...state,
          destination: state.destination.trim() || "Kyoto",
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);

      const generated = (await response.json()) as GeneratedPlan;
      clearInterval(ticker);
      setStep(AI_STEPS.length);
      setPlan(generated);
      actions.setLastPlan(generated);
      setPhase("ready");
      play("success");
    } catch (requestError) {
      clearInterval(ticker);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong",
      );
      setPhase("error");
      play("toggleOff");
    }
  }

  function saveAsTrip() {
    if (!plan) return;
    play("success");
    const id = actions.createTripFromPlan(plan, state.budget, travelers);
    router.push(`/trips/${id}`);
  }

  const toggleInterest = (interest: string) =>
    setState((s) => ({
      ...s,
      interests: s.interests.includes(interest)
        ? s.interests.filter((i) => i !== interest)
        : [...s.interests, interest],
    }));

  return (
    <motion.section
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
    >
      <ClayCard
        tone="lilac"
        radius="xl"
        depth="lg"
        className="relative overflow-hidden p-5 sm:p-7 lg:p-9"
      >
        <motion.div
          {...floatY(14, 6)}
          className="pointer-events-none absolute -right-8 -top-8 opacity-70 sm:right-4 sm:top-2 sm:opacity-100"
        >
          <ClayGlobe size={130} base="#b09ff0" />
        </motion.div>

        <motion.div variants={fadeUp} className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-clay-raised px-4 py-2 font-body text-[11px] font-extrabold uppercase tracking-wider shadow-clay-xs">
            <SparkIcon size={14} />
            Wanderly AI
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Plan your next journey with AI
          </h2>
          <p className="mt-2 font-body text-sm text-clay-ink-soft sm:text-base">
            Tell it roughly what you want. It shapes a day by day plan around
            your budget, pace and taste — then saves it as a real trip.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="relative mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* ------------------------------------------------ form */}
          <div className="space-y-5">
            <div>
              <Label>Where do you want to go?</Label>
              <ClayWell radius="md" className="mt-2 flex items-center gap-3 px-5 py-4">
                <PinIcon size={20} className="shrink-0 text-clay-muted" />
                <input
                  value={state.destination}
                  onChange={(e) => setState((s) => ({ ...s, destination: e.target.value }))}
                  onFocus={() => play("pop")}
                  placeholder="Kyoto, a quiet coast, anywhere warm..."
                  className="w-full bg-transparent font-body text-[15px] text-clay-ink outline-none placeholder:text-clay-muted"
                />
              </ClayWell>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>
                  Budget
                  <span className="ml-2 rounded-full bg-clay-raised px-2.5 py-0.5 font-display text-xs font-bold shadow-clay-xs">
                    {formatInr(state.budget)}
                  </span>
                </Label>
                <div className="mt-3 flex items-center gap-3">
                  <WalletIcon size={19} className="shrink-0 text-clay-ink-soft" />
                  <input
                    type="range"
                    min={20000}
                    max={250000}
                    step={5000}
                    value={state.budget}
                    onChange={(e) => setState((s) => ({ ...s, budget: Number(e.target.value) }))}
                    onPointerUp={() => play("tap")}
                    className="clay-range"
                    aria-label="Budget"
                  />
                </div>
              </div>

              <div>
                <Label>Duration</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Stepper
                    value={state.duration}
                    onChange={(duration) => setState((s) => ({ ...s, duration }))}
                  />
                  <span className="flex items-center gap-1.5 font-body text-xs text-clay-ink-soft">
                    <CalendarIcon size={15} />
                    {state.duration} days
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label>Travel style</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRAVEL_STYLES.map((style: TravelStyle) => (
                  <ClayChip
                    key={style}
                    tone="peach"
                    active={state.style === style}
                    onClick={() => setState((s) => ({ ...s, style }))}
                  >
                    {style}
                  </ClayChip>
                ))}
              </div>
            </div>

            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon size={14} />
                  Who&rsquo;s coming
                </span>
                <span className="ml-2 rounded-full bg-clay-raised px-2.5 py-0.5 font-display text-xs font-bold shadow-clay-xs">
                  {travelers.length} {travelers.length === 1 ? "person" : "people"}
                </span>
              </Label>
              <div className="mt-3">
                <CompanionPicker
                  travelers={travelers}
                  onChange={setTravelers}
                  group={group}
                  onGroupChange={setGroup}
                />
                <p className="mt-2 font-body text-[11px] text-clay-muted">
                  {travelers.length > 1
                    ? `Roughly ${formatInr(Math.round(state.budget / travelers.length))} each — everyone here can be picked when you split an expense.`
                    : "Add people here and every expense on this trip becomes splittable."}
                </p>
              </div>
            </div>

            <div>
              <Label>
                Interests
                <span className="ml-2 font-body text-xs font-normal text-clay-ink-soft">
                  {state.interests.length} selected
                </span>
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERESTS.map((interest) => (
                  <ClayChip
                    key={interest}
                    tone="mint"
                    active={state.interests.includes(interest)}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </ClayChip>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <ClayButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={generate}
                disabled={phase === "thinking"}
                rightIcon={
                  <motion.span
                    animate={phase === "thinking" ? { rotate: 360 } : { rotate: 0, x: [0, 4, 0] }}
                    transition={
                      phase === "thinking"
                        ? { type: "tween" as const, duration: 1.1, repeat: Infinity, ease: "linear" as const }
                        : { type: "tween" as const, duration: 1.8, repeat: Infinity, ease: "easeInOut" as const }
                    }
                    className="inline-flex"
                  >
                    {phase === "thinking" ? <SparkIcon size={20} /> : <ArrowRightIcon size={20} />}
                  </motion.span>
                }
              >
                {phase === "thinking" ? "Shaping your trip" : "Generate Trip"}
              </ClayButton>
            </div>
          </div>

          {/* ------------------------------------------- output panel */}
          <div className="lg:relative lg:h-full">
            <ClayCard tone="surface" radius="lg" depth="sm" className="flex h-full min-h-[24rem] flex-col overflow-hidden p-5 lg:absolute lg:inset-0 lg:min-h-0">
              <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  variants={popIn}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="flex h-full flex-1 flex-col items-center justify-center gap-4 py-10 text-center"
                >
                  <motion.span {...floatY(8, 4)}>
                    <ClayGlobe size={96} base="#8fb6ee" />
                  </motion.span>
                  <p className="max-w-[16rem] font-body text-sm text-clay-ink-soft">
                    Set your budget and vibe, then press Generate. A full
                    itinerary appears here, ready to save as a trip.
                  </p>
                </motion.div>
              )}

              {phase === "thinking" && (
                <motion.ul
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-1 flex-col justify-center gap-3 py-6"
                >
                  {AI_STEPS.map((label, index) => {
                    const done = index < step;
                    const active = index === step;
                    return (
                      <li key={label} className="flex items-center gap-3">
                        <span
                          className={[
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                            done
                              ? "bg-clay-mint text-clay-ink shadow-clay-xs"
                              : active
                                ? "bg-clay-butter text-clay-ink shadow-clay-xs"
                                : "bg-clay-sunken text-clay-muted shadow-clay-inset-sm",
                          ].join(" ")}
                        >
                          {done ? (
                            <CheckIcon size={15} />
                          ) : active ? (
                            <motion.span
                              animate={{ scale: [1, 0.6, 1] }}
                              transition={{ type: "tween", duration: 1, repeat: Infinity }}
                              className="h-2.5 w-2.5 rounded-full bg-clay-tangerine"
                            />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-current opacity-50" />
                          )}
                        </span>
                        <span className={`font-body text-sm ${active ? "text-clay-ink" : "text-clay-muted"}`}>
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}

              {phase === "error" && (
                <motion.div
                  key="error"
                  variants={popIn}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-1 flex-col items-center justify-center gap-4 py-10 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-blush text-clay-rose shadow-clay-xs">
                    <RefreshIcon size={26} />
                  </span>
                  <p className="max-w-[17rem] font-body text-sm text-clay-ink-soft">
                    The planner could not be reached. {error}
                  </p>
                  <ClayButton size="sm" tone="peach" onClick={generate}>
                    Try again
                  </ClayButton>
                </motion.div>
              )}

              {phase === "ready" && plan && (
                <motion.div
                  key="ready"
                  variants={stagger(0.06)}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, y: -10 }}
                  className="flex h-full flex-1 flex-col"
                >
                  <motion.div variants={popIn} className="flex items-start gap-3 shrink-0">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clay-mint text-clay-ink shadow-clay-xs">
                      <CheckIcon size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-lg font-semibold leading-tight">{plan.title}</p>
                      <p className="font-body text-xs text-clay-muted">
                        {plan.days.length} days · about {formatInr(plan.estimatedTotal)}
                        {plan.source === "local" && " · offline planner"}
                      </p>
                    </div>
                  </motion.div>

                  {plan.summary && (
                    <motion.p variants={fadeUp} className="mt-3 shrink-0 font-body text-xs leading-relaxed text-clay-ink-soft">
                      {plan.summary}
                    </motion.p>
                  )}

                  <div className="mt-3 flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
                    {plan.days.map((day, index) => (
                      <motion.div
                        key={`${day.label}-${index}`}
                        variants={fadeUp}
                        className="rounded-clay-sm bg-clay-sunken/60 p-3 shadow-clay-inset-sm"
                      >
                        <p className="font-display text-sm font-semibold">{day.label}</p>
                        <ul className="mt-1.5 space-y-1">
                          {day.items.slice(0, 4).map((item, itemIndex) => (
                            <li
                              key={`${item.title}-${itemIndex}`}
                              className="flex items-baseline gap-2 font-body text-[11px] text-clay-ink-soft"
                            >
                              <ClockIcon size={11} className="shrink-0 translate-y-0.5 text-clay-muted" />
                              <span className="font-bold text-clay-ink">{item.time}</span>
                              <span className="truncate">{item.title}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div variants={fadeUp} className="mt-auto shrink-0 flex gap-2 pt-4">
                    <ClayButton size="sm" tone="mint" className="flex-1" sound="toggleOn" onClick={saveAsTrip}>
                      Save as trip
                    </ClayButton>
                    <ClayButton
                      size="sm"
                      tone="surface"
                      className="flex-1"
                      onClick={() => {
                        setPhase("idle");
                        setStep(0);
                        setPlan(null);
                      }}
                    >
                      Start over
                    </ClayButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            </ClayCard>
          </div>
        </motion.div>
      </ClayCard>
    </motion.section>
  );
}

/* ------------------------------- pieces ------------------------------- */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center font-display text-sm font-semibold text-clay-ink">
      {children}
    </span>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const { play } = useFeedback();
  const set = (next: number) => {
    const clamped = Math.min(21, Math.max(2, next));
    if (clamped !== value) play("tap");
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-clay-sunken p-1.5 shadow-clay-inset-sm">
      <motion.button
        whileTap={{ scale: 0.86 }}
        transition={springBouncy}
        onClick={() => set(value - 1)}
        aria-label="Fewer days"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-surface font-display text-lg font-bold shadow-clay-xs active:shadow-clay-pressed"
      >
        &minus;
      </motion.button>
      <motion.span
        key={value}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springSoft}
        className="w-9 text-center font-display text-lg font-bold"
      >
        {value}
      </motion.span>
      <motion.button
        whileTap={{ scale: 0.86 }}
        transition={springSnappy}
        onClick={() => set(value + 1)}
        aria-label="More days"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-surface font-display text-lg font-bold shadow-clay-xs active:shadow-clay-pressed"
      >
        +
      </motion.button>
    </div>
  );
}
