"use client";

import React from "react";
import { motion } from "framer-motion";
import type { DestinationTip } from "@/lib/budget/tips";
import type { Destination } from "@/types/dashboard";
import { ClayCard } from "@/components/ui/ClayCard";
import { PinIcon } from "@/components/ui/Icons";
import { fadeUp, stagger } from "@/lib/animations";

export interface DestinationTipsProps {
  destination?: Destination;
  tips: DestinationTip[];
  className?: string;
}

export function DestinationTips({
  destination,
  tips = [],
  className = "",
}: DestinationTipsProps) {
  if (!tips || tips.length === 0) return null;

  return (
    <ClayCard
      tone="butter"
      radius="lg"
      depth="md"
      className={`p-5 space-y-4 border-2 border-white ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-white/80 text-clay-ink shadow-clay-xs">
          <PinIcon size={18} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-clay-ink">
            {destination?.name || "Destination"} Insider Travel Tips
          </h3>
          <p className="font-body text-xs text-clay-ink-soft">
            Local budget hacks & smart recommendations
          </p>
        </div>
      </div>

      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-3"
      >
        {tips.map((item) => (
          <motion.div
            key={item.id}
            variants={fadeUp}
            className="p-3.5 rounded-clay-sm bg-white/70 shadow-clay-xs space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{item.icon}</span>
              {item.highlight && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-clay-peach/70 text-clay-ink">
                  {item.highlight}
                </span>
              )}
            </div>
            <p className="font-body text-xs text-clay-ink-soft leading-relaxed pt-1">
              {item.tip}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </ClayCard>
  );
}
