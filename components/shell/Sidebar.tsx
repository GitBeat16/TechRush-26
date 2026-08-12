"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClayPlane } from "@/components/ui/ClayIllustrations";
import { LogoutIcon } from "@/components/ui/Icons";
import { springSnappy, springSoft } from "@/lib/animations";
import { feedback } from "@/lib/feedback";
import { signOut, useSession } from "@/lib/auth/session";
import { NAV, activeHref } from "@/lib/nav";

/**
 * Desktop navigation: a floating clay rail. Fixed, so it survives every
 * route change — that persistence is the whole point of putting it in
 * the layout rather than in a page.
 *
 * The rail is destinations only. Your profile lives behind the avatar in the
 * navbar, so the one personal control down here is the way out: sign out.
 */

/** Parent orchestrator — the rail pops its entries in one after another. */
const railStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.22 } },
};

/** Each entry lands like a piece of clay being pressed into the rail. */
const railItem = {
  hidden: { opacity: 0, x: -18, scale: 0.6 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 520, damping: 15, mass: 0.7 },
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeHref(pathname);
  const { user } = useSession();
  const [leaving, setLeaving] = useState(false);

  // The rail is for going places. /profile is reachable from the navbar
  // avatar, so it does not need a seat here as well.
  const items = useMemo(() => NAV.filter((item) => item.href !== "/profile"), []);

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true);
    feedback("toggleOff");
    try {
      await signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <motion.aside
      initial={{ x: -90, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...springSoft, delay: 0.05 }}
      className="fixed inset-y-4 left-4 z-50 hidden w-24 flex-col items-center gap-3 rounded-clay-lg bg-clay-surface/95 py-5 shadow-clay-lg backdrop-blur-xl lg:flex"
    >
      <Link
        href="/"
        onClick={() => feedback("pop")}
        aria-label="Wanderly home"
        className="group flex flex-col items-center gap-1.5"
      >
        <motion.span
          whileHover={{ rotate: -12, scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          className="flex h-12 w-12 items-center justify-center rounded-clay-sm bg-clay-sky shadow-clay-sm"
        >
          <ClayPlane size={30} base="#6f9ee6" />
        </motion.span>
        <span className="font-title text-[11px] text-clay-ink">
          Wanderly
        </span>
      </Link>

      {/* With "You" gone the remaining entries get room to breathe: the nav
          centres itself in the leftover space instead of hugging the logo. */}
      <motion.nav
        variants={railStagger}
        initial="hidden"
        animate="show"
        className="flex w-full flex-1 flex-col items-center justify-center gap-2"
      >
        {items.map((item) => {
          const isActive = active === item.href;
          const Icon = item.icon;

          return (
            <motion.div key={item.href} variants={railItem} className="w-full">
              <Link
                href={item.href}
                onClick={() => feedback("nav")}
                title={item.description}
                aria-current={isActive ? "page" : undefined}
                className="relative mx-auto flex w-[74px] flex-col items-center gap-1 rounded-clay-sm px-1 py-2.5"
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
            </motion.div>
          );
        })}
      </motion.nav>

      {user && (
        <motion.button
          type="button"
          onClick={handleSignOut}
          disabled={leaving}
          title={`Sign out of ${user.name.split(" ")[0]}'s account`}
          aria-label="Sign out"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.6 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="flex w-[74px] flex-col items-center gap-1 border-t border-clay-muted/20 pt-3 disabled:opacity-60"
        >
          <motion.span
            whileHover={{ scale: 1.1, x: 2 }}
            transition={springSnappy}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-blush/70 text-clay-ink shadow-clay-xs"
          >
            <LogoutIcon size={20} />
          </motion.span>
          <span className="font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
            {leaving ? "Bye" : "Logout"}
          </span>
        </motion.button>
      )}
    </motion.aside>
  );
}
