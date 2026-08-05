"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import {
  ArrowRightIcon,
  BedIcon,
  CalendarIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  CloudIcon,
  FlameIcon,
  GlobeIcon,
  HomeIcon,
  PinIcon,
  PlaneIcon,
  SparkIcon,
  StarIcon,
  SunIcon,
  SuitcaseIcon,
  TicketIcon,
  UserIcon,
  UsersIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSnappy, springSoft, stagger } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { TONES } from "@/lib/tones";
import { AuthError, submitOnboarding, useSession } from "@/lib/auth/session";
import type {
  BudgetTier,
  DestinationType,
  TravelGroup,
  TravelStyle,
  TripDuration,
  WeatherPreference,
} from "@/types/auth";
import type { ClayTone } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/* The questionnaire that stands between signing in and the dashboard. */
/* Six questions, one per screen: five single-choice, one multi.       */
/* Answers land in public.profiles via PATCH /api/auth/onboarding.     */
/* ------------------------------------------------------------------ */

interface Option<T extends string> {
  value: T;
  label: string;
  hint: string;
  icon: ComponentType<{ size?: number }>;
  tone: ClayTone;
}

const DESTINATION_OPTIONS: Option<DestinationType>[] = [
  { value: "beaches", label: "Beaches", hint: "Sand, surf, slow mornings", icon: SunIcon, tone: "butter" },
  { value: "mountains", label: "Mountains", hint: "Altitude and long views", icon: PinIcon, tone: "mint" },
  { value: "heritage", label: "Heritage", hint: "Forts, ruins, old streets", icon: StarIcon, tone: "peach" },
  { value: "islands", label: "Islands", hint: "Ferries and blue water", icon: GlobeIcon, tone: "sky" },
  { value: "cities", label: "Cities", hint: "Cafés, museums, late nights", icon: HomeIcon, tone: "lilac" },
];

const WEATHER_OPTIONS: Option<WeatherPreference>[] = [
  { value: "hot", label: "Hot and sunny", hint: "Shorts weather all week", icon: SunIcon, tone: "butter" },
  { value: "snowy", label: "Cold and snowy", hint: "Layers, fires, fresh powder", icon: CloudIcon, tone: "sky" },
  { value: "rainy", label: "Cool and rainy", hint: "Green hills and petrichor", icon: CloudIcon, tone: "mint" },
];

const BUDGET_OPTIONS: Option<BudgetTier>[] = [
  { value: "budget", label: "Budget", hint: "Hostels, street food, buses", icon: WalletIcon, tone: "mint" },
  { value: "mid-range", label: "Mid-range", hint: "Comfortable stays, some splurges", icon: BedIcon, tone: "sky" },
  { value: "luxury", label: "Luxury", hint: "The good room, no compromises", icon: StarIcon, tone: "lilac" },
];

const STYLE_OPTIONS: Option<TravelStyle>[] = [
  { value: "relaxation", label: "Relaxation", hint: "Nowhere to be", icon: SunIcon, tone: "butter" },
  { value: "adventure", label: "Adventure", hint: "Treks, dives, long days", icon: FlameIcon, tone: "peach" },
  { value: "cultural", label: "Cultural", hint: "Museums, history, people", icon: CameraIcon, tone: "lilac" },
  { value: "food", label: "Food", hint: "Eat your way through", icon: UtensilsIcon, tone: "mint" },
  { value: "nightlife", label: "Nightlife", hint: "The city after dark", icon: TicketIcon, tone: "sky" },
];

const DURATION_OPTIONS: Option<TripDuration>[] = [
  { value: "weekend", label: "A weekend", hint: "Two or three days", icon: ClockIcon, tone: "peach" },
  { value: "3-5-days", label: "3–5 days", hint: "A proper short break", icon: CalendarIcon, tone: "butter" },
  { value: "one-week", label: "About a week", hint: "Room to settle in", icon: SuitcaseIcon, tone: "mint" },
  { value: "two-weeks-plus", label: "Two weeks or more", hint: "The long one", icon: PlaneIcon, tone: "sky" },
];

const GROUP_OPTIONS: Option<TravelGroup>[] = [
  { value: "solo", label: "Solo", hint: "Your pace, your plan", icon: UserIcon, tone: "lilac" },
  { value: "partner", label: "With a partner", hint: "Two of you", icon: SparkIcon, tone: "blush" },
  { value: "friends", label: "With friends", hint: "The group chat trip", icon: UsersIcon, tone: "butter" },
  { value: "family", label: "With family", hint: "All ages on board", icon: HomeIcon, tone: "mint" },
];

interface Answers {
  preferredDestinations: DestinationType[];
  preferredWeather: WeatherPreference | null;
  budget: BudgetTier | null;
  travelStyle: TravelStyle | null;
  tripDuration: TripDuration | null;
  travelGroup: TravelGroup | null;
}

const EMPTY: Answers = {
  preferredDestinations: [],
  preferredWeather: null,
  budget: null,
  travelStyle: null,
  tripDuration: null,
  travelGroup: null,
};

const STEPS = 6;

const QUESTION_LABELS = [
  "the kind of places you like",
  "the weather you want",
  "how you like to spend",
  "what makes a trip worth it",
  "how long you go for",
  "who travels with you",
];

/** Never let the step index leave the range that has a screen to show. */
function clampStep(value: number) {
  return Math.max(0, Math.min(value, STEPS - 1));
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useSession();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* The auto-advance timer, held so a second tap cancels the first. Without
     this, two quick taps both advanced the step and skipped a question. */
  const advanceTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const answered = [
    answers.preferredDestinations.length > 0,
    answers.preferredWeather !== null,
    answers.budget !== null,
    answers.travelStyle !== null,
    answers.tripDuration !== null,
    answers.travelGroup !== null,
  ];

  const firstUnanswered = answered.findIndex((done) => !done);

  function cancelAdvance() {
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }

  function goTo(target: number) {
    cancelAdvance();
    setError(null);
    setStep(clampStep(target));
  }

  function back() {
    if (step === 0) return;
    feedback("nav");
    goTo(step - 1);
  }

  function forward() {
    if (!answered[step]) return;
    feedback("nav");
    goTo(step + 1);
  }

  /**
   * Single-choice steps advance on their own — one tap, one question.
   * The timer is cancelled and re-armed on every tap, and only advances if
   * we are still on the step the tap came from, so changing your mind or
   * tapping twice can never skip past the end of the questionnaire.
   */
  function choose<K extends keyof Answers>(key: K, value: Answers[K]) {
    feedback("pop");
    setError(null);
    setAnswers((current) => ({ ...current, [key]: value }));

    const from = step;
    cancelAdvance();
    if (from >= STEPS - 1) return;

    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      setStep((current) => (current === from ? clampStep(current + 1) : current));
    }, 220);
  }

  function toggleDestination(value: DestinationType) {
    feedback("tap");
    cancelAdvance();
    setError(null);
    setAnswers((current) => ({
      ...current,
      preferredDestinations: current.preferredDestinations.includes(value)
        ? current.preferredDestinations.filter((entry) => entry !== value)
        : [...current.preferredDestinations, value],
    }));
  }

  async function finish() {
    if (
      !answers.preferredWeather ||
      !answers.budget ||
      !answers.travelStyle ||
      !answers.tripDuration ||
      !answers.travelGroup ||
      answers.preferredDestinations.length === 0
    ) {
      // Send them to the gap rather than sitting on a dead button.
      setError(`One left — tell us about ${QUESTION_LABELS[firstUnanswered]}.`);
      goTo(firstUnanswered);
      return;
    }

    cancelAdvance();
    setBusy(true);
    setError(null);
    try {
      await submitOnboarding({
        preferredDestinations: answers.preferredDestinations,
        preferredWeather: answers.preferredWeather,
        budget: answers.budget,
        travelStyle: answers.travelStyle,
        tripDuration: answers.tripDuration,
        travelGroup: answers.travelGroup,
      });
      feedback("success");
      // The session cache already holds the saved profile, so AppShell will
      // render the dashboard as soon as we land. No refresh() — that only
      // adds another round trip through the auth proxy.
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof AuthError ? caught.message : "Could not save your preferences",
      );
      feedback("toggleOff");
      setBusy(false);
    }
  }

  // Belt and braces: every read of the index goes through the clamp, so no
  // state path can render a screen that does not exist.
  const current = clampStep(step);
  const isLast = current === STEPS - 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSoft}
        className="px-1"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-clay-butter px-4 py-2 font-body text-[11px] font-extrabold uppercase tracking-widest shadow-clay-xs">
          <SparkIcon size={14} />
          Step {current + 1} of {STEPS}
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {current === 0 ? `Nice to meet you, ${firstName}` : "A little more"}
        </h1>
        <p className="mt-2 font-body text-sm text-clay-ink-soft">
          Six quick questions and Wanderly starts suggesting trips that actually
          sound like you.
        </p>
      </motion.div>

      <Progress step={current} answered={answered} />

      <ClayCard tone="surface" radius="xl" depth="lg" className="p-5 sm:p-7">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 22, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -22, filter: "blur(4px)" }}
            transition={springSnappy}
          >
            {current === 0 && (
              <Question
                title="What kind of places pull you in?"
                subtitle="Pick as many as you like"
              >
                <Grid>
                  {DESTINATION_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.preferredDestinations.includes(option.value)}
                      onSelect={() => toggleDestination(option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}

            {current === 1 && (
              <Question title="What weather are you chasing?" subtitle="Pick one">
                <Grid>
                  {WEATHER_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.preferredWeather === option.value}
                      onSelect={() => choose("preferredWeather", option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}

            {current === 2 && (
              <Question title="How do you like to spend?" subtitle="Pick one">
                <Grid>
                  {BUDGET_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.budget === option.value}
                      onSelect={() => choose("budget", option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}

            {current === 3 && (
              <Question title="What makes a trip worth it?" subtitle="Pick one">
                <Grid>
                  {STYLE_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.travelStyle === option.value}
                      onSelect={() => choose("travelStyle", option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}

            {current === 4 && (
              <Question title="How long do you usually go for?" subtitle="Pick one">
                <Grid>
                  {DURATION_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.tripDuration === option.value}
                      onSelect={() => choose("tripDuration", option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}

            {current === 5 && (
              <Question title="Who is usually with you?" subtitle="Pick one">
                <Grid>
                  {GROUP_OPTIONS.map((option) => (
                    <Tile
                      key={option.value}
                      option={option}
                      selected={answers.travelGroup === option.value}
                      onSelect={() => choose("travelGroup", option.value)}
                    />
                  ))}
                </Grid>
              </Question>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-clay-sm bg-clay-blush px-4 py-2.5 font-body text-xs font-bold text-clay-ink shadow-clay-xs"
          >
            {error}
          </motion.p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <ClayButton
            variant="ghost"
            size="md"
            onClick={back}
            disabled={current === 0 || busy}
            leftIcon={<ChevronLeftIcon size={18} />}
          >
            Back
          </ClayButton>

          {isLast ? (
            <ClayButton
              variant="primary"
              size="lg"
              onClick={finish}
              disabled={busy}
              rightIcon={<CheckIcon size={19} />}
            >
              {busy ? "Saving" : "Finish"}
            </ClayButton>
          ) : (
            <ClayButton
              variant="primary"
              size="lg"
              onClick={forward}
              disabled={!answered[current] || busy}
              rightIcon={<ArrowRightIcon size={19} />}
            >
              Continue
            </ClayButton>
          )}
        </div>
      </ClayCard>
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

function Progress({ step, answered }: { step: number; answered: boolean[] }) {
  return (
    <div className="flex gap-1.5 px-1">
      {Array.from({ length: STEPS }, (_, index) => (
        <motion.span
          key={index}
          animate={{
            backgroundColor:
              index === step ? "#f08a5d" : answered[index] ? "#7fcfae" : "#ece0d4",
          }}
          transition={{ duration: 0.25 }}
          className="h-2 flex-1 rounded-full"
        />
      ))}
    </div>
  );
}

function Question({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold leading-tight">{title}</h2>
      <p className="mt-1 font-body text-sm text-clay-ink-soft">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={stagger(0.05)}
      initial="hidden"
      animate="show"
      className="grid gap-3 sm:grid-cols-2"
    >
      {children}
    </motion.div>
  );
}

function Tile<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <motion.button
      type="button"
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-clay p-4 text-left transition-shadow ${
        TONES[option.tone].bg
      } ${
        selected
          ? "shadow-clay-pressed ring-2 ring-clay-tangerine"
          : "shadow-clay-sm hover:shadow-clay"
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-clay-sm bg-clay-raised text-clay-ink shadow-clay-xs">
        <Icon size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold leading-tight text-clay-ink">
          {option.label}
        </span>
        <span className="mt-0.5 block font-body text-xs leading-snug text-clay-ink-soft">
          {option.hint}
        </span>
      </span>

      <motion.span
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={springSnappy}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clay-tangerine text-white"
      >
        <CheckIcon size={14} />
      </motion.span>
    </motion.button>
  );
}
