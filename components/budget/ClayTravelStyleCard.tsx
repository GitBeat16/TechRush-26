"use client";

import React from "react";
import { motion } from "framer-motion";
import type { TravelStyleOption } from "@/types/budget";
import { springSnappy } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { CheckIcon } from "@/components/ui/Icons";
import { BudgetIcon } from "./BudgetIcons";

export interface ClayTravelStyleCardProps {
  option: TravelStyleOption;
  selected: boolean;
  onSelect: (id: TravelStyleOption["id"]) => void;
}

export function ClayTravelStyleCard({
  option,
  selected,
  onSelect,
}: ClayTravelStyleCardProps) {
  const { play } = useFeedback();

  return (
    <motion.div
      whileHover={{ y: selected ? -4 : -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      animate={{ y: selected ? -3 : 0 }}
      transition={springSnappy}
      onClick={() => {
        onSelect(option.id);
        play("toggleOn");
      }}
      className={`relative cursor-pointer rounded-clay-lg p-3 transition-all duration-200 border-2 ${
        selected
          ? "bg-clay-butter shadow-clay-md border-clay-tangerine/80"
          : "bg-clay-surface/90 hover:bg-clay-surface shadow-clay-xs border-white/80"
      }`}
    >
      {/* Selected Checkmark Badge */}
      {selected && (
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springSnappy}
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-clay-tangerine text-white shadow-clay-xs border border-white"
        >
          <CheckIcon size={12} />
        </motion.span>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay-raised/90 text-clay-ink shadow-clay-xs">
          <BudgetIcon icon={option.icon} size={18} />
        </div>
        <div>
          <h4 className="font-display font-bold text-sm text-clay-ink leading-tight">
            {option.title}
          </h4>
          <p className="font-body text-[10px] font-semibold text-clay-muted">
            {option.subtitle}
          </p>
        </div>
      </div>

      {/* Bullet Items */}
      <ul className="space-y-0.5 pt-1.5 border-t border-clay-muted/15 font-body text-[11px] text-clay-ink-soft">
        {option.bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <span className="text-clay-tangerine font-bold">•</span>
            <span className="line-clamp-1">{bullet}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
