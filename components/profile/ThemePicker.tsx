"use client";

import { motion } from "framer-motion";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { CheckIcon, CloudIcon, RefreshIcon, SunIcon } from "@/components/ui/Icons";
import { fadeUp, springSnappy, stagger } from "@/lib/animations";
import { useFeedback, WEATHER_FEEDBACK } from "@/lib/feedback";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { THEME_IDS, THEMES, themeForWeather } from "@/lib/theme/themes";
import { useSession } from "@/lib/auth/session";
import type { AmbienceKind, ThemeId } from "@/types/theme";

const AMBIENCE_ICON: Record<AmbienceKind, typeof SunIcon> = {
  none: RefreshIcon,
  sun: SunIcon,
  snow: CloudIcon,
  rain: CloudIcon,
};

/**
 * The theme switcher on /profile. Themes start out following the weather
 * answer from onboarding; picking one here pins it until the user resets.
 */
export function ThemePicker() {
  const { theme, explicit, saving, setTheme, clearOverride, mode, setMode } = useTheme();
  const { user } = useSession();
  const { play } = useFeedback();

  const implied = themeForWeather(user?.preferences.preferredWeather);
  const following = explicit === null;

  /**
   * Tap, then the weather itself a beat later. The gap is roughly the length
   * of the palette wash, so the stinger lands as the new colours settle
   * rather than fighting the click.
   */
  const changeTheme = (id: ThemeId) => {
    play("tap");
    setTheme(id);
    play(WEATHER_FEEDBACK[THEMES[id].ambience], 0.22);
  };

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight">
            Appearance
          </h2>
          <p className="mt-0.5 font-body text-sm text-clay-ink-soft">
            {following
              ? `Following your weather answer — ${THEMES[implied].label.toLowerCase()}`
              : `Pinned to ${THEMES[theme].label.toLowerCase()}`}
          </p>
        </div>

        {!following && (
          <ClayButton
            size="sm"
            tone="surface"
            leftIcon={<RefreshIcon size={14} />}
            disabled={saving}
            onClick={() => {
              play("tap");
              clearOverride();
              // Resetting also changes the weather, so it gets a stinger too.
              play(WEATHER_FEEDBACK[THEMES[implied].ambience], 0.22);
            }}
          >
            Follow my weather
          </ClayButton>
        )}
      </div>

      <motion.div
        variants={stagger(0.05)}
        initial="hidden"
        animate="show"
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        {THEME_IDS.map((id) => (
          <motion.div key={id} variants={fadeUp}>
            <ThemeOption
              id={id}
              active={theme === id}
              implied={following && implied === id}
              disabled={saving}
              onPick={() => changeTheme(id)}
            />
          </motion.div>
        ))}
      </motion.div>


      {/* Light / Dark Mode selector — available for all themes */}
      <motion.div variants={fadeUp} className="mt-6 pt-5 border-t border-clay-sky space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-clay-ink leading-tight">
                Appearance Mode
              </h3>
              <p className="font-body text-xs text-clay-ink-soft">
                Switch between day and night atmosphere
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                play("tap");
                setMode("light");
              }}
              className={`flex items-center justify-center gap-2 rounded-clay-sm p-3 font-display text-sm font-bold transition-all ${
                mode === "light"
                  ? "bg-clay-surface border-2 border-clay-tangerine text-clay-tangerine shadow-clay-xs"
                  : "bg-clay-sunken/80 border border-clay-sky text-clay-ink-soft hover:text-clay-ink"
              }`}
            >
              <span>☀ Light</span>
            </button>
            <button
              type="button"
              onClick={() => {
                play("tap");
                setMode("dark");
              }}
              className={`flex items-center justify-center gap-2 rounded-clay-sm p-3 font-display text-sm font-bold transition-all ${
                mode === "dark"
                  ? "bg-clay-surface border-2 border-clay-tangerine text-clay-tangerine shadow-clay-xs"
                  : "bg-clay-sunken/80 border border-clay-sky text-clay-ink-soft hover:text-clay-ink"
              }`}
            >
              <span>🌙 Dark</span>
            </button>
          </div>
        </motion.div>


      <p className="mt-4 font-body text-xs text-clay-muted">
        Themes change the whole app — colours, shadows and the weather drifting
        behind it. Motion respects your system&rsquo;s reduced-motion setting.
      </p>
    </ClayCard>
  );
}

function ThemeOption({
  id,
  active,
  implied,
  disabled,
  onPick,
}: {
  id: ThemeId;
  active: boolean;
  implied: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const definition = THEMES[id];
  const Icon = AMBIENCE_ICON[definition.ambience];

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onPick}
      whileHover={{ y: -4, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={springSnappy}
      aria-pressed={active}
      className={`relative flex w-full items-center gap-4 rounded-clay-lg p-4 text-left transition-shadow duration-300 disabled:opacity-60 ${
        active
          ? "bg-clay-raised shadow-clay"
          : "bg-clay-sunken/60 shadow-clay-inset-sm hover:shadow-clay-sm"
      }`}
    >
      {/* Swatch — a miniature of the palette this theme paints. */}
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-clay-sm shadow-clay-xs"
        style={{
          background: `linear-gradient(140deg, ${definition.swatch[0]} 0%, ${definition.swatch[1]} 55%, ${definition.swatch[2]} 100%)`,
        }}
      >
        <span style={{ color: definition.swatch[2] }}>
          <Icon size={20} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-base font-semibold leading-tight">
            {definition.label}
          </span>
          {implied && (
            <span className="rounded-full bg-clay-butter px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-clay-ink shadow-clay-xs">
              Yours
            </span>
          )}
        </span>
        <span className="block font-body text-xs text-clay-ink-soft">
          {definition.hint}
        </span>
      </span>

      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
          active
            ? "bg-clay-jade text-white shadow-clay-xs"
            : "bg-clay-sunken text-transparent shadow-clay-inset-sm"
        }`}
      >
        <CheckIcon size={14} />
      </span>
    </motion.button>
  );
}
