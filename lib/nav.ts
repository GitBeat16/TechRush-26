import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  GlobeIcon,
  HomeIcon,
  PinIcon,
  SparkIcon,
  SuitcaseIcon,
  SwapIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/Icons";

export interface NavItem {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** shown in the mobile dock */
  primary: boolean;
}

/**
 * The rail and the dock. The assistant is deliberately absent: it lives in
 * the floating launcher (components/assistant/AssistantDock) so asking a
 * question never costs you the page you were reading. /assistant is still a
 * real route — the launcher links to it — it just isn't navigation.
 */
export const NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    short: "Home",
    description: "Your travel command center",
    icon: HomeIcon,
    primary: true,
  },
  {
    href: "/plan",
    label: "Plan with AI",
    short: "Plan",
    description: "Generate a trip from a sentence",
    icon: SparkIcon,
    primary: true,
  },
  {
    href: "/explore",
    label: "Explore",
    short: "Explore",
    description: "Browse and save destinations",
    icon: PinIcon,
    primary: true,
  },
  {
    href: "/trips",
    label: "My Trips",
    short: "Trips",
    description: "Itinerary, packing and budget",
    icon: SuitcaseIcon,
    primary: true,
  },
  {
    href: "/budget",
    label: "Budget Planner",
    short: "Budget",
    description: "Smart travel cost estimator and live analytics",
    icon: WalletIcon,
    primary: false,
  },
  {
    href: "/compare",
    label: "Compare",
    short: "Compare",
    description: "Two destinations, side by side",
    icon: SwapIcon,
    primary: false,
  },
  {
    href: "/profile",
    label: "Profile",
    short: "You",
    description: "Stats, saved places and settings",
    icon: UserIcon,
    primary: true,
  },
];

export const FALLBACK_ICON = GlobeIcon;

/** Longest match wins, so /trips/abc highlights /trips. */
export function activeHref(pathname: string): string {
  const match = NAV.filter(
    (item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? "/";
}
