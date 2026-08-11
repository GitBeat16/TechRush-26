"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClayPlane } from "@/components/ui/ClayIllustrations";
import { ClayAvatar } from "@/components/ui/ClayAvatar";
import { initialsOf } from "@/components/shell/Navbar";
import { springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { useSession } from "@/lib/auth/session";
import { NAV, activeHref } from "@/lib/nav";

/**
 * Desktop navigation: a floating clay rail. Fixed, so it survives every
 * route change — that persistence is the whole point of putting it in
 * the layout rather than in a page.
 */
export function Sidebar() {
  const pathname = usePathname();
  const active = activeHref(pathname);
  const { user } = useSession();

  return (
    <motion.aside
      initial={{ x: -90, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...springSoft, delay: 0.05 }}
      className="fixed inset-y-4 left-4 z-50 hidden w-24 flex-col items-center gap-2 rounded-clay-lg bg-clay-surface/95 py-5 shadow-clay-lg backdrop-blur-xl lg:flex"
    >
      <Link
        href="/"
        onClick={() => feedback("pop")}
        aria-label="Wanderly home"
        className="group mb-3 flex flex-col items-center gap-1.5"
      >
        <motion.span
          whileHover={{ rotate: -12, scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          className="flex h-12 w-12 items-center justify-center rounded-clay-sm bg-clay-sky shadow-clay-sm"
        >
          <ClayPlane size={30} base="#6f9ee6" />
        </motion.span>
        <span className="font-display text-[11px] font-bold tracking-tight text-clay-ink">
          Wanderly
        </span>
      </Link>

      <nav className="flex w-full flex-1 flex-col items-center gap-1.5">
        {NAV.map((item) => {
          const isActive = active === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => feedback("nav")}
              title={item.description}
              aria-current={isActive ? "page" : undefined}
              className="relative flex w-[74px] flex-col items-center gap-1 rounded-clay-sm px-1 py-2.5"
            >
              {isActive && (
                <motion.span
                  layoutId="rail-active"
                  transition={springSnappy}
                  className="absolute inset-0 rounded-clay-sm bg-clay-butter shadow-clay-xs"
                />
              )}
              <motion.span
                whileHover={{ y: -3, scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={springSnappy}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 ${
                  isActive
                    ? "bg-clay-raised text-clay-ink shadow-clay-xs"
                    : "text-clay-ink-soft"
                }`}
              >
                <Icon size={21} />
              </motion.span>
              <span
                className={`relative font-body text-[10px] font-bold uppercase tracking-wide transition-colors ${
                  isActive ? "text-clay-ink" : "text-clay-muted"
                }`}
              >
                {item.short}
              </span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <Link
          href="/profile"
          onClick={() => feedback("nav")}
          title={`${user.name} — profile`}
          className="mt-2 flex w-[74px] flex-col items-center gap-1 border-t border-clay-muted/20 pt-3"
        >
          <motion.span whileHover={{ scale: 1.1, y: -2 }} transition={springSnappy}>
            <ClayAvatar id={user.avatarId} initials={initialsOf(user.name)} size={38} />
          </motion.span>
          <span className="w-full truncate text-center font-body text-[10px] font-bold text-clay-muted">
            {user.name.split(" ")[0]}
          </span>
        </Link>
      )}
    </motion.aside>
  );
}
