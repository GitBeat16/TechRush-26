"use client";

import Link from "next/link";
import { ClayCard } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import {
  CalendarIcon,
  CloudIcon,
  EditIcon,
  PinIcon,
  SparkIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/Icons";
import { useSession } from "@/lib/auth/session";
import {
  DESTINATION_LABEL,
  DURATION_LABEL,
  GROUP_LABEL,
  STYLE_LABEL,
} from "@/lib/personalize";
import { THEMES, themeForWeather } from "@/lib/theme/themes";
import type { ClayTone } from "@/types/dashboard";

const BUDGET_LABEL = {
  budget: "Budget",
  "mid-range": "Mid-range",
  luxury: "Luxury",
} as const;

/**
 * A read-only recap of the questionnaire, so the user can see exactly what
 * the dashboard is personalising against — and go change it.
 */
export function PreferenceSummary() {
  const { user } = useSession();
  if (!user) return null;

  const { preferences } = user;

  const rows: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone: ClayTone;
  }[] = [
    {
      icon: <PinIcon size={16} />,
      label: "Places",
      value:
        preferences.preferredDestinations
          .map((kind) => DESTINATION_LABEL[kind])
          .join(", ") || "Not set",
      tone: "mint",
    },
    {
      icon: <CloudIcon size={16} />,
      label: "Weather",
      value: preferences.preferredWeather
        ? THEMES[themeForWeather(preferences.preferredWeather)].label
        : "Not set",
      tone: "sky",
    },
    {
      icon: <WalletIcon size={16} />,
      label: "Budget",
      value: preferences.budget ? BUDGET_LABEL[preferences.budget] : "Not set",
      tone: "butter",
    },
    {
      icon: <SparkIcon size={16} />,
      label: "Style",
      value: preferences.travelStyle
        ? STYLE_LABEL[preferences.travelStyle]
        : "Not set",
      tone: "lilac",
    },
    {
      icon: <CalendarIcon size={16} />,
      label: "Trip length",
      value: preferences.tripDuration
        ? DURATION_LABEL[preferences.tripDuration]
        : "Not set",
      tone: "peach",
    },
    {
      icon: <UsersIcon size={16} />,
      label: "Usually with",
      value: preferences.travelGroup
        ? GROUP_LABEL[preferences.travelGroup]
        : "Not set",
      tone: "blush",
    },
  ];

  return (
    <ClayCard tone="surface" radius="xl" depth="lg" className="p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold leading-tight">
            Your travel profile
          </h2>
          <p className="mt-0.5 font-body text-sm text-clay-ink-soft">
            What the dashboard, planner and recommendations are tuned to
          </p>
        </div>
        <Link href="/onboarding?edit=1">
          <ClayButton size="sm" tone="surface" leftIcon={<EditIcon size={14} />}>
            Retake
          </ClayButton>
        </Link>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-3 rounded-clay-sm bg-clay-sunken/60 p-3 shadow-clay-inset-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay-raised text-clay-ink-soft shadow-clay-xs">
              {row.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
                {row.label}
              </span>
              <span className="block truncate font-display text-sm font-semibold">
                {row.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}
