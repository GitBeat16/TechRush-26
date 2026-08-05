"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { springSnappy } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { NAV, activeHref } from "@/lib/nav";

/** Bottom navigation for phones and small tablets. */
export function MobileDock() {
  const pathname = usePathname();
  const active = activeHref(pathname);
  const items = NAV.filter((item) => item.primary);

  return (
    <motion.nav
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springSnappy, delay: 0.35 }}
      className="fixed inset-x-3 bottom-3 z-50 lg:hidden"
    >
      <div className="flex items-center justify-around rounded-clay-lg bg-clay-surface/95 p-1.5 shadow-clay-lg backdrop-blur-xl">
        {items.map((item) => {
          const isActive = active === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => feedback("nav")}
              aria-current={isActive ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-clay-sm py-2"
            >
              {isActive && (
                <motion.span
                  layoutId="dock-active"
                  transition={springSnappy}
                  className="absolute inset-0 rounded-clay-sm bg-clay-butter shadow-clay-xs"
                />
              )}
              <motion.span
                whileTap={{ scale: 0.86 }}
                transition={springSnappy}
                className={`relative ${isActive ? "text-clay-ink" : "text-clay-ink-soft"}`}
              >
                <Icon size={20} />
              </motion.span>
              <span
                className={`relative font-body text-[9.5px] font-bold uppercase tracking-wide ${
                  isActive ? "text-clay-ink" : "text-clay-muted"
                }`}
              >
                {item.short}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
