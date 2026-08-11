"use client";

import React from "react";
import {
  AlertTriangleIcon,
  AwardIcon,
  BackpackIcon,
  BagIcon,
  BedIcon,
  BoatIcon,
  CalendarIcon,
  CarIcon,
  ChartPieIcon,
  CompassIcon,
  CrownIcon,
  LightbulbIcon,
  PiggyBankIcon,
  PinIcon,
  PlaneIcon,
  ShieldIcon,
  SparkIcon,
  SunIcon,
  TicketIcon,
  UsersIcon,
  UtensilsIcon,
  WalletIcon,
} from "@/components/ui/Icons";

export interface BudgetIconProps {
  icon?: string | React.ReactNode;
  size?: number;
  className?: string;
}

export function BudgetIcon({ icon, size = 18, className = "" }: BudgetIconProps) {
  if (React.isValidElement(icon)) {
    return <>{icon}</>;
  }

  if (typeof icon !== "string") {
    return <SparkIcon size={size} className={className} />;
  }

  const key = icon.trim().toLowerCase();

  switch (key) {
    // Travel Styles
    case "backpack":
    case "budget":
    case "🎒":
      return <BackpackIcon size={size} className={className} />;
    case "standard":
    case "hotel":
    case "stay":
    case "🏨":
      return <BedIcon size={size} className={className} />;
    case "luxury":
    case "crown":
    case "👑":
      return <CrownIcon size={size} className={className} />;

    // Expense Categories
    case "transport":
    case "plane":
    case "flight":
    case "✈️":
    case "🚅":
      return <PlaneIcon size={size} className={className} />;
    case "food":
    case "dining":
    case "utensils":
    case "🍽️":
    case "🍱":
    case "🥐":
    case "🍵":
    case "🥥":
    case "🍛":
    case "🧀":
    case "🐟":
    case "🍜":
      return <UtensilsIcon size={size} className={className} />;
    case "activity":
    case "activities":
    case "ticket":
    case "🎟️":
      return <TicketIcon size={size} className={className} />;
    case "local_transport":
    case "transit":
    case "cab":
    case "car":
    case "scooter":
    case "🚕":
    case "🛵":
    case "🚗":
    case "🚇":
    case "🚐":
    case "🚋":
      return <CarIcon size={size} className={className} />;
    case "boat":
    case "ship":
    case "⛵":
      return <BoatIcon size={size} className={className} />;
    case "shopping":
    case "bag":
    case "🛍️":
      return <BagIcon size={size} className={className} />;
    case "emergency":
    case "shield":
    case "safety":
    case "🛡️":
      return <ShieldIcon size={size} className={className} />;

    // General Controls & Identifiers
    case "destination":
    case "pin":
    case "location":
    case "📍":
    case "⛩️":
    case "🏖️":
      return <PinIcon size={size} className={className} />;
    case "duration":
    case "calendar":
    case "date":
    case "📅":
      return <CalendarIcon size={size} className={className} />;
    case "traveller":
    case "travellers":
    case "user":
    case "users":
    case "group":
    case "👤":
    case "👥":
    case "👨‍👩‍👧‍👦":
      return <UsersIcon size={size} className={className} />;

    // Analytics, Warnings, Savings & Tips
    case "wallet":
    case "budget_total":
    case "💰":
    case "💳":
      return <WalletIcon size={size} className={className} />;
    case "piggy":
    case "savings":
    case "🐷":
      return <PiggyBankIcon size={size} className={className} />;
    case "warning":
    case "alert":
    case "🚨":
    case "⚠️":
      return <AlertTriangleIcon size={size} className={className} />;
    case "tip":
    case "lightbulb":
    case "idea":
    case "💡":
      return <LightbulbIcon size={size} className={className} />;
    case "award":
    case "score":
    case "trophy":
    case "🏆":
      return <AwardIcon size={size} className={className} />;
    case "chart":
    case "analysis":
    case "pie":
    case "📊":
      return <ChartPieIcon size={size} className={className} />;
    case "sun":
    case "sunrise":
    case "🌅":
      return <SunIcon size={size} className={className} />;
    case "mountain":
    case "compass":
    case "🏔️":
      return <CompassIcon size={size} className={className} />;
    case "water":
    case "glacier":
    case "💧":
      return <SparkIcon size={size} className={className} />;

    default:
      return <SparkIcon size={size} className={className} />;
  }
}
