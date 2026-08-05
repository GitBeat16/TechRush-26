"use client";

import React from "react";
import { motion } from "framer-motion";
import type { BudgetStatus } from "@/types/budget";
import { springSnappy } from "@/lib/animations";

export interface BudgetProgressProps {
  percentageUsed: number;
  status: BudgetStatus;
  size?: number;
  strokeWidth?: number;
}

const STATUS_COLORS: Record<BudgetStatus, { stroke: string; bg: string; text: string; badge: string }> = {
  safe: {
    stroke: "#7fcfae",
    bg: "bg-clay-mint",
    text: "text-emerald-800",
    badge: "bg-emerald-100 text-emerald-800",
  },
  warning: {
    stroke: "#f9b384",
    bg: "bg-clay-peach",
    text: "text-amber-900",
    badge: "bg-amber-100 text-amber-900",
  },
  exceeded: {
    stroke: "#f7a8b8",
    bg: "bg-clay-blush",
    text: "text-rose-900",
    badge: "bg-rose-100 text-rose-900",
  },
};

/**
 * Circular progress ring with clay shadow and percentage badge
 */
export function CircularBudgetProgress({
  percentageUsed,
  status,
  size = 110,
  strokeWidth = 10,
}: BudgetProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentageUsed));
  const offset = circumference - (clampedPercentage / 100) * circumference;
  const colors = STATUS_COLORS[status] || STATUS_COLORS.safe;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ece0d4"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="shadow-clay-inset-sm"
        />
        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={springSnappy}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Center Percentage Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`font-display font-extrabold text-lg leading-none ${colors.text}`}>
          {percentageUsed}%
        </span>
        <span className="font-body text-[10px] font-bold uppercase tracking-wider text-clay-muted mt-0.5">
          {status === "exceeded" ? "Over" : "Used"}
        </span>
      </div>
    </div>
  );
}

/**
 * Linear clay progress bar
 */
export function LinearBudgetProgress({
  percentageUsed,
  status,
}: {
  percentageUsed: number;
  status: BudgetStatus;
}) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.safe;
  const fillWidth = `${Math.min(100, Math.max(0, percentageUsed))}%`;

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold text-clay-ink-soft">
        <span>Budget Utilization</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.badge}`}>
          {percentageUsed}% Used {status === "exceeded" && "⚠️ Exceeded"}
        </span>
      </div>

      <div className="h-4 w-full rounded-full bg-clay-sunken shadow-clay-inset-sm overflow-hidden p-0.5">
        <motion.div
          className={`h-full rounded-full ${colors.bg} shadow-clay-xs`}
          initial={{ width: "0%" }}
          animate={{ width: fillWidth }}
          transition={springSnappy}
        />
      </div>
    </div>
  );
}
