"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import { RiveCharacter } from "@/components/Dashboard/RiveCharacter";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayAvatar, DEFAULT_AVATAR_ID, getAvatar } from "@/components/ui/ClayAvatar";
import { ClayCloud, ClayPlane } from "@/components/ui/ClayIllustrations";
import {
  ArrowRightIcon,
  CheckIcon,
  PinIcon,
  SparkIcon,
  SuitcaseIcon,
} from "@/components/ui/Icons";
import {
  breathe,
  fadeUp,
  floatDrift,
  springSnappy,
  springSoft,
  stagger,
} from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import {
  AuthError,
  DEMO_CREDENTIALS,
  OAUTH_ERRORS,
  passwordStrength,
  signInWithEmail,
  signUpWithEmail,
  startGoogleOAuth,
} from "@/lib/auth/session";

type Mode = "signin" | "signup";
type FieldError = { field?: "name" | "email" | "password"; message: string } | null;

const HIGHLIGHTS = [
  { icon: SparkIcon, text: "AI itineraries in one sentence" },
  { icon: SuitcaseIcon, text: "Packing that fills as you tick" },
  { icon: PinIcon, text: "Budgets split between friends" },
];

export function LoginView() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");

  const next = params.get("next") ?? "/";
  const oauthError = params.get("error");
  // Set by AppShell when the server session and /api/auth/me disagreed.
  const staleSession = params.has("stale");

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1200px] items-center gap-8 px-4 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8">
      <BrandPanel />

      <motion.div
        initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={springSoft}
      >
        <ClayCard tone="surface" radius="xl" depth="lg" className="p-5 sm:p-7">
          {oauthError && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-clay-sm bg-clay-blush px-4 py-3 font-body text-xs leading-relaxed font-bold text-clay-ink shadow-clay-xs"
            >
              {OAUTH_ERRORS[oauthError] ?? "Sign-in failed. Please try again."}
            </motion.p>
          )}

          {!oauthError && staleSession && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-clay-sm bg-clay-butter px-4 py-3 font-body text-xs leading-relaxed font-bold text-clay-ink shadow-clay-xs"
            >
              We could not verify your session. Please sign in again.
            </motion.p>
          )}

          <div className="mb-5 flex rounded-full bg-clay-sunken p-1.5 shadow-clay-inset-sm">
            {(["signin", "signup"] as Mode[]).map((value) => (
              <button
                key={value}
                onClick={() => {
                  setMode(value);
                  feedback("nav");
                }}
                aria-current={mode === value}
                className="relative flex-1 rounded-full px-4 py-2.5 font-display text-sm font-semibold"
              >
                {mode === value && (
                  <motion.span
                    layoutId="auth-tab"
                    transition={springSnappy}
                    className="absolute inset-0 rounded-full bg-clay-surface shadow-clay-xs"
                  />
                )}
                <span className={`relative ${mode === value ? "text-clay-ink" : "text-clay-muted"}`}>
                  {value === "signin" ? "Sign in" : "Create account"}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "signin" ? (
              <SignInForm key="signin" next={next} onSwitch={() => setMode("signup")} />
            ) : (
              <SignUpForm key="signup" next={next} onSwitch={() => setMode("signin")} />
            )}
          </AnimatePresence>
        </ClayCard>
      </motion.div>
    </div>
  );
}

/* ------------------------------ left panel ------------------------------ */

function BrandPanel() {
  return (
    <motion.div
      variants={stagger(0.08)}
      initial="hidden"
      animate="show"
      className="relative hidden lg:block"
    >
      <motion.div
        {...breathe(1.06, 12)}
        className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-clay-blush opacity-45 blur-3xl"
      />
      <motion.div
        {...breathe(1.08, 15, 2)}
        className="absolute bottom-0 right-8 h-64 w-64 rounded-full bg-clay-mint opacity-40 blur-3xl"
      />
      <motion.div {...floatDrift(16, 6, 12)} className="absolute right-4 top-4">
        <ClayCloud size={120} opacity={0.9} />
      </motion.div>
      <motion.div {...floatDrift(20, 9, 10, 1)} className="absolute right-40 top-24">
        <ClayPlane size={64} base="#a9c8f4" />
      </motion.div>

      <div className="relative">
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full bg-clay-butter px-4 py-2 font-body text-[11px] font-extrabold uppercase tracking-widest shadow-clay-xs"
        >
          <SparkIcon size={14} />
          Wanderly
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight"
        >
          Your travel
          <br />
          command center
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-4 max-w-md font-body text-base leading-relaxed text-clay-ink-soft">
          Plan with AI, pack without forgetting anything, and keep every trip,
          budget and idea in one soft, tactile place.
        </motion.p>

        <motion.ul variants={stagger(0.07, 0.2)} className="mt-7 space-y-2.5">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <motion.li
              key={text}
              variants={fadeUp}
              className="flex items-center gap-3 font-body text-sm text-clay-ink"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-surface text-clay-tangerine shadow-clay-xs">
                <Icon size={17} />
              </span>
              {text}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div variants={fadeUp} className="mt-2 flex justify-start">
          <RiveCharacter size={230} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------- sign in ------------------------------- */

function SignInForm({ next, onSwitch }: { next: string; onSwitch: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<FieldError>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail({ email, password });
      feedback("success");
      router.replace(next);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof AuthError
          ? { field: caught.field, message: caught.message }
          : { message: "Could not sign in" },
      );
      feedback("toggleOff");
      setBusy(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 14 }}
      transition={springSnappy}
      onSubmit={submit}
      className="space-y-4"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
        <p className="mt-1 font-body text-sm text-clay-ink-soft">
          Sign in to pick up where your trips left off.
        </p>
      </div>

      <GoogleButton next={next} />
      <Divider />

      <Field label="Email" error={error?.field === "email" ? error.message : undefined}>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
        />
      </Field>

      <PasswordField
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        error={error?.field === "password" ? error.message : undefined}
      />

      {error && !error.field && <ErrorNote>{error.message}</ErrorNote>}

      <ClayButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={busy}
        rightIcon={<ArrowRightIcon size={19} />}
      >
        {busy ? "Signing in" : "Sign in"}
      </ClayButton>

      <button
        type="button"
        onClick={() => {
          setEmail(DEMO_CREDENTIALS.email);
          setPassword(DEMO_CREDENTIALS.password);
          feedback("pop");
        }}
        className="w-full rounded-clay-sm bg-clay-sunken/70 p-3 text-left font-body text-xs text-clay-ink-soft shadow-clay-inset-sm transition-colors hover:text-clay-ink"
      >
        <span className="font-bold text-clay-ink">Just looking around?</span> Tap
        to fill the demo account ({DEMO_CREDENTIALS.email}).
      </button>

      <p className="text-center font-body text-xs text-clay-muted">
        New here?{" "}
        <button type="button" onClick={onSwitch} className="font-bold text-clay-ink underline">
          Create an account
        </button>
      </p>
    </motion.form>
  );
}

/* ------------------------------- sign up ------------------------------- */

function SignUpForm({ next, onSwitch }: { next: string; onSwitch: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [error, setError] = useState<FieldError>(null);
  const [busy, setBusy] = useState(false);

  const strength = passwordStrength(password);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signUpWithEmail({ name, email, password, avatarId, homeCity });
      feedback("success");
      router.replace(next);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof AuthError
          ? { field: caught.field, message: caught.message }
          : { message: "Could not create your account" },
      );
      feedback("toggleOff");
      setBusy(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={springSnappy}
      onSubmit={submit}
      className="space-y-4"
    >
      <div>
        <h2 className="font-display text-2xl font-semibold">Make it yours</h2>
        <p className="mt-1 font-body text-sm text-clay-ink-soft">
          Pick a face, and Wanderly starts remembering your trips.
        </p>
      </div>

      <GoogleButton next={next} />
      <Divider />

      <div className="rounded-clay bg-clay-sunken/60 p-4 shadow-clay-inset-sm">
        <div className="mb-3 flex items-center gap-3">
          <ClayAvatar id={avatarId} size={54} ring />
          <div>
            <p className="font-display text-sm font-semibold">
              {getAvatar(avatarId).label}
            </p>
            <p className="font-body text-[11px] text-clay-muted">
              Choose your traveler — you can change it any time
            </p>
          </div>
        </div>
        <AvatarPicker value={avatarId} onChange={setAvatarId} size={44} />
      </div>

      <Field label="Name" error={error?.field === "name" ? error.message : undefined}>
        <input
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Srushti Kalokhe"
          className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
        />
      </Field>

      <Field label="Email" error={error?.field === "email" ? error.message : undefined}>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
        />
      </Field>

      <div>
        <PasswordField
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={error?.field === "password" ? error.message : undefined}
        />
        {password.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  animate={{
                    backgroundColor:
                      index < strength.score
                        ? ["#f9b384", "#f2c34e", "#7fcfae"][strength.score - 1]
                        : "#ece0d4",
                  }}
                  className="h-1.5 flex-1 rounded-full"
                />
              ))}
            </div>
            <span className="font-body text-[11px] font-bold text-clay-muted">
              {strength.label}
            </span>
          </div>
        )}
      </div>

      <Field label="Home city (optional)">
        <input
          value={homeCity}
          onChange={(event) => setHomeCity(event.target.value)}
          placeholder="Bengaluru"
          className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
        />
      </Field>

      {error && !error.field && <ErrorNote>{error.message}</ErrorNote>}

      <ClayButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={busy}
        rightIcon={<CheckIcon size={19} />}
      >
        {busy ? "Creating account" : "Create account"}
      </ClayButton>

      <p className="text-center font-body text-xs text-clay-muted">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-bold text-clay-ink underline">
          Sign in
        </button>
      </p>
    </motion.form>
  );
}

/* ------------------------------- google -------------------------------- */

function GoogleButton({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      disabled={busy}
      onClick={() => {
        feedback("press");
        setBusy(true);
        startGoogleOAuth(next);
      }}
      className="flex w-full items-center justify-center gap-3 rounded-full bg-clay-raised px-6 py-3.5 font-display text-[15px] font-semibold text-clay-ink shadow-clay-sm transition-shadow hover:shadow-clay active:shadow-clay-pressed disabled:opacity-60"
    >
      <GoogleMark />
      {busy ? "Opening Google" : "Continue with Google"}
    </motion.button>
  );
}

function GoogleMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.8-2 5.1-4.4 6.7v5.6h7.1c4.2-3.8 6.6-9.5 6.6-16.5z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.6c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.8C7.9 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.6 28c-.4-1.3-.7-2.6-.7-4s.3-2.7.7-4v-5.8H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8L11.6 28z" />
      <path fill="#EA4335" d="M24 11.5c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 5 30 3 24 3 15.4 3 7.9 7.9 4.3 15.2l7.3 5.8c1.7-5.2 6.6-9.5 12.4-9.5z" />
    </svg>
  );
}

/* -------------------------------- fields -------------------------------- */

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <ClayWell radius="md" className={`px-4 py-2.5 ${error ? "ring-2 ring-clay-rose" : ""}`}>
        <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
          {label}
        </span>
        {children}
      </ClayWell>
      {error && <p className="mt-1.5 px-1 font-body text-xs font-bold text-clay-rose">{error}</p>}
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  autoComplete,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <ClayWell
        radius="md"
        className={`flex items-center gap-3 px-4 py-2.5 ${error ? "ring-2 ring-clay-rose" : ""}`}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
            Password
          </span>
          <input
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
          />
        </span>
        <button
          type="button"
          onClick={() => {
            setVisible((current) => !current);
            feedback("tap");
          }}
          aria-label={visible ? "Hide password" : "Show password"}
          className="shrink-0 rounded-full bg-clay-surface px-3 py-1.5 font-body text-[11px] font-bold text-clay-muted shadow-clay-xs"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </ClayWell>
      {error && <p className="mt-1.5 px-1 font-body text-xs font-bold text-clay-rose">{error}</p>}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-clay-muted/25" />
      <span className="font-body text-[11px] font-bold uppercase tracking-wide text-clay-muted">
        or with email
      </span>
      <span className="h-px flex-1 bg-clay-muted/25" />
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-clay-sm bg-clay-blush px-4 py-2.5 font-body text-xs font-bold text-clay-ink shadow-clay-xs"
    >
      {children}
    </motion.p>
  );
}
