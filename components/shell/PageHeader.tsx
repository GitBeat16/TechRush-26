"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/ui/Icons";
import { fadeUp, springSnappy, stagger } from "@/lib/animations";
import { feedback } from "@/lib/feedback";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

/** The consistent opening block on every route. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  action,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <motion.header
      variants={stagger(0.06)}
      initial="hidden"
      animate="show"
      className="mb-7 sm:mb-9"
    >
      {backHref && (
        <motion.div variants={fadeUp} className="mb-3">
          <Link
            href={backHref}
            onClick={() => feedback("nav")}
            className="inline-flex items-center gap-1.5 rounded-full bg-clay-surface px-3.5 py-2 font-body text-xs font-bold text-clay-ink-soft shadow-clay-xs transition-shadow hover:shadow-clay-sm active:shadow-clay-pressed"
          >
            <ChevronLeftIcon size={15} />
            {backLabel}
          </Link>
        </motion.div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          {icon && (
            <motion.span
              variants={fadeUp}
              whileHover={{ rotate: -8, scale: 1.06 }}
              transition={springSnappy}
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-clay-sm bg-clay-peach text-clay-ink shadow-clay-sm sm:flex"
            >
              {icon}
            </motion.span>
          )}

          <div>
            {eyebrow && (
              <motion.p
                variants={fadeUp}
                className="mb-1 font-body text-[11px] font-extrabold uppercase tracking-widest text-clay-muted"
              >
                {eyebrow}
              </motion.p>
            )}
            <motion.h1
              variants={fadeUp}
              className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                variants={fadeUp}
                className="mt-1.5 max-w-xl font-body text-sm leading-relaxed text-clay-ink-soft sm:text-base"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {action && <motion.div variants={fadeUp}>{action}</motion.div>}
      </div>
    </motion.header>
  );
}
