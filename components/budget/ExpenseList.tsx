"use client";

import React from "react";
import { motion } from "framer-motion";
import type { ExpenseItem } from "@/types/budget";
import { ExpenseCard } from "./ExpenseCard";
import { fadeUp, stagger } from "@/lib/animations";

export interface ExpenseListProps {
  expenses: ExpenseItem[];
  onAmountChange: (id: ExpenseItem["id"], newAmount: number) => void;
  className?: string;
}

export function ExpenseList({
  expenses,
  onAmountChange,
  className = "",
}: ExpenseListProps) {
  return (
    <motion.div
      variants={stagger(0.05)}
      initial="hidden"
      animate="show"
      className={`space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display text-lg font-bold text-clay-ink">
          Expense Breakdown by Category
        </h3>
        <span className="font-body text-xs text-clay-ink-soft">
          {expenses.length} Categories
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {expenses.map((item) => (
          <motion.div key={item.id} variants={fadeUp}>
            <ExpenseCard item={item} onAmountChange={onAmountChange} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
