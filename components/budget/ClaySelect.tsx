"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springSnappy } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/Icons";
import { BudgetIcon } from "./BudgetIcons";

export interface ClayOption<T> {
  value: T;
  label: string;
  icon?: string | React.ReactNode;
}

export interface ClaySelectProps<T> {
  options: ClayOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function ClaySelect<T extends string | number>({
  options,
  value,
  onChange,
  icon,
  placeholder = "Select...",
  className = "",
}: ClaySelectProps<T>) {
  const { play } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Collapsed Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={springSnappy}
        onClick={() => {
          setIsOpen((prev) => !prev);
          play("pop");
        }}
        className="w-full flex items-center justify-between gap-2.5 rounded-clay-lg bg-clay-surface px-4 py-3 text-left font-display text-sm font-bold text-clay-ink shadow-clay-sm hover:shadow-clay transition-all duration-200 border-2 border-white/80"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <BudgetIcon icon={selectedOption.icon} size={16} />}
          {!selectedOption?.icon && icon && <span className="text-clay-tangerine">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>

        {/* Animated Dropdown Chevron Arrow */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springSnappy}
          className="text-clay-muted shrink-0 flex items-center justify-center"
        >
          <ChevronDownIcon size={16} />
        </motion.span>
      </motion.button>

      {/* Expanded Clay Options Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={springSnappy}
            className="absolute left-0 right-0 top-full mt-2 z-50 max-h-64 overflow-y-auto no-scrollbar rounded-clay-lg bg-clay-surface/98 p-2 shadow-clay-lg backdrop-blur-xl border-2 border-white/90 space-y-1"
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <motion.li
                  key={String(option.value)}
                  whileHover={{ x: 3, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    play("tap");
                  }}
                  className={`flex items-center justify-between gap-2 rounded-clay-sm px-3.5 py-2.5 cursor-pointer font-display text-sm font-bold transition-colors ${
                    isSelected
                      ? "bg-clay-butter text-clay-ink shadow-clay-xs"
                      : "text-clay-ink-soft hover:bg-clay-sunken/60 hover:text-clay-ink"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <BudgetIcon icon={option.icon} size={16} />}
                    <span className="truncate">{option.label}</span>
                  </div>

                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={springSnappy}
                      className="text-clay-tangerine shrink-0"
                    >
                      <CheckIcon size={14} />
                    </motion.span>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ClaySelect as ClayDropdown };
