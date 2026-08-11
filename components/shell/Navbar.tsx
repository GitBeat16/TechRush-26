"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BellIcon,
  ChevronRightIcon,
  PinIcon,
  SearchIcon,
  SettingsIcon,
  SoundOffIcon,
  SoundOnIcon,
  SparkIcon,
  SuitcaseIcon,
} from "@/components/ui/Icons";
import { ClayPlane } from "@/components/ui/ClayIllustrations";
import { ClayAvatar } from "@/components/ui/ClayAvatar";
import { iconPress, springSnappy, springSoft } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import { signOut, useSession } from "@/lib/auth/session";
import { useAppState } from "@/lib/store";
import { DESTINATIONS } from "@/lib/data";

interface Notification {
  id: string;
  title: string;
  body: string;
  href: string;
  unread: boolean;
}

const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Visa approved", body: "Your Japan tourist visa is confirmed for 14 Oct.", href: "/trips", unread: true },
  { id: "n2", title: "Fare drop", body: "Bengaluru to Osaka is down 12% for your dates.", href: "/explore", unread: true },
  { id: "n3", title: "Packing reminder", body: "Items still unpacked in your Japan checklist.", href: "/trips", unread: false },
];

type Panel = "none" | "alerts" | "settings" | "search";

export function Navbar() {
  const router = useRouter();
  const { sound, haptics, play, toggleSound, toggleHaptics } = useFeedback();
  const { user } = useSession();
  const { trips } = useAppState();
  const [panel, setPanel] = useState<Panel>("none");
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const needle = query.trim().toLowerCase();

  const destinationHits = needle
    ? DESTINATIONS.filter((d) =>
        `${d.name} ${d.region} ${d.vibes.join(" ")}`.toLowerCase().includes(needle),
      ).slice(0, 3)
    : [];

  const tripHits = needle
    ? trips.filter((t) => `${t.title} ${t.country}`.toLowerCase().includes(needle)).slice(0, 2)
    : [];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setPanel("none");
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const openPanel = (next: Panel) => {
    play(panel === next ? "tap" : "nav");
    setPanel((current) => (current === next ? "none" : next));
  };

  const goToDestination = (name: string) => {
    play("tap");
    setPanel("none");
    setFocused(false);
    setQuery("");
    router.push(`/explore?q=${encodeURIComponent(name)}`);
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springSoft, delay: 0.05 }}
      className="sticky top-3 z-40 px-3 sm:top-4 sm:px-5 lg:pr-6"
    >
      <div ref={shellRef} className="relative mx-auto w-full max-w-[1400px]">
        <div className="flex items-center gap-3 rounded-clay-lg bg-clay-surface/95 p-2.5 shadow-clay backdrop-blur-xl sm:gap-4 sm:p-3">
          {/* brand — the rail carries it on large screens */}
          <Link
            href="/"
            onClick={() => play("pop")}
            className="flex shrink-0 items-center gap-2.5 pl-1 lg:hidden"
          >
            <motion.span
              whileHover={{ rotate: -12, scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={springSnappy}
              className="flex h-11 w-11 items-center justify-center rounded-clay-sm bg-clay-sky shadow-clay-sm"
            >
              <ClayPlane size={28} base="#6f9ee6" />
            </motion.span>
            <span className="hidden font-title text-xl sm:block">
              Wanderly
            </span>
          </Link>

          {/* search */}
          <div className="relative mx-auto hidden max-w-xl flex-1 md:block">
            <motion.div
              animate={{ scale: focused ? 1.02 : 1 }}
              transition={springSnappy}
              className={[
                "flex items-center gap-3 rounded-full bg-clay-sunken px-5 py-3 transition-shadow duration-300",
                focused ? "shadow-clay-inset ring-4 ring-clay-ocean/25" : "shadow-clay-inset-sm",
              ].join(" ")}
            >
              <SearchIcon size={20} className="shrink-0 text-clay-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => {
                  setFocused(true);
                  play("pop");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && destinationHits[0]) {
                    goToDestination(destinationHits[0].name);
                  }
                }}
                placeholder="Search a destination, trip or vibe"
                className="w-full bg-transparent font-body text-[15px] text-clay-ink outline-none placeholder:text-clay-muted"
              />
              {query && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => {
                    setQuery("");
                    play("toggleOff");
                  }}
                  className="rounded-full bg-clay-surface px-3 py-1 font-body text-xs font-bold text-clay-muted shadow-clay-xs"
                >
                  clear
                </motion.button>
              )}
            </motion.div>

            <AnimatePresence>
              {focused && (destinationHits.length > 0 || tripHits.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={springSnappy}
                  className="absolute left-0 right-0 top-[calc(100%+12px)] overflow-hidden rounded-clay bg-clay-surface p-2 shadow-clay-lg"
                >
                  {tripHits.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      onClick={() => {
                        play("tap");
                        setFocused(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-clay-sm px-3 py-2.5 text-left transition-colors hover:bg-clay-sunken/70"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-mint text-clay-ink shadow-clay-xs">
                        <SuitcaseIcon size={17} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-sm font-semibold">{trip.title}</span>
                        <span className="block font-body text-xs text-clay-muted">
                          Your trip · {trip.days} days
                        </span>
                      </span>
                      <ChevronRightIcon size={16} className="text-clay-muted" />
                    </Link>
                  ))}

                  {destinationHits.map((destination) => (
                    <button
                      key={destination.id}
                      onClick={() => goToDestination(destination.name)}
                      className="flex w-full items-center gap-3 rounded-clay-sm px-3 py-2.5 text-left transition-colors hover:bg-clay-sunken/70"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-peach text-clay-ink shadow-clay-xs">
                        <PinIcon size={17} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-display text-sm font-semibold">
                          {destination.name}
                        </span>
                        <span className="block font-body text-xs text-clay-muted">
                          {destination.tagline}
                        </span>
                      </span>
                      <ChevronRightIcon size={16} className="text-clay-muted" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* actions */}
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <NavIconButton
              label="Search"
              className="md:hidden"
              active={panel === "search"}
              onClick={() => openPanel("search")}
            >
              <SearchIcon size={20} />
            </NavIconButton>

            <NavIconButton
              label="Notifications"
              active={panel === "alerts"}
              onClick={() => openPanel("alerts")}
            >
              <BellIcon size={20} />
              {unread > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ type: "tween", duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-clay-rose font-body text-[11px] font-extrabold text-white shadow-clay-xs"
                >
                  {unread}
                </motion.span>
              )}
            </NavIconButton>

            <NavIconButton
              label="Settings"
              active={panel === "settings"}
              onClick={() => openPanel("settings")}
              className="hidden sm:flex"
            >
              <SettingsIcon size={20} />
            </NavIconButton>

            <Link
              href="/profile"
              onClick={() => play("nav")}
              aria-label={user ? `${user.name} — your profile` : "Your profile"}
            >
              <motion.span
                whileHover={{ scale: 1.07, y: -2 }}
                whileTap={{ scale: 0.93 }}
                transition={springSnappy}
                className="relative block"
              >
                <ClayAvatar
                  id={user?.avatarId}
                  initials={initialsOf(user?.name)}
                  size={46}
                  className="shadow-clay-sm"
                />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-clay-jade ring-[3px] ring-clay-surface" />
              </motion.span>
            </Link>
          </div>
        </div>

        {/* mobile search sheet */}
        <AnimatePresence>
          {panel === "search" && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={springSnappy}
              className="mt-3 rounded-clay bg-clay-surface p-3 shadow-clay md:hidden"
            >
              <div className="flex items-center gap-3 rounded-full bg-clay-sunken px-4 py-3 shadow-clay-inset-sm">
                <SearchIcon size={19} className="text-clay-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Where to?"
                  className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
                />
              </div>
              {destinationHits.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {destinationHits.map((destination) => (
                    <li key={destination.id}>
                      <button
                        onClick={() => goToDestination(destination.name)}
                        className="w-full rounded-clay-sm px-3 py-2 text-left font-body text-sm hover:bg-clay-sunken/60"
                      >
                        <span className="font-display font-semibold">{destination.name}</span>
                        <span className="text-clay-muted"> — {destination.tagline}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* notifications */}
        <AnimatePresence>
          {panel === "alerts" && (
            <Popover>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Updates</h3>
                <span className="rounded-full bg-clay-blush px-3 py-1 font-body text-xs font-bold shadow-clay-xs">
                  {unread} new
                </span>
              </div>
              <ul className="space-y-2">
                {NOTIFICATIONS.map((n, i) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springSnappy, delay: 0.04 * i }}
                  >
                    <Link
                      href={n.href}
                      onClick={() => {
                        play("tap");
                        setPanel("none");
                      }}
                      className="flex gap-3 rounded-clay-sm bg-clay-sunken/60 p-3 shadow-clay-inset-sm transition-colors hover:bg-clay-sunken"
                    >
                      <span
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          n.unread ? "bg-clay-rose" : "bg-clay-muted/40"
                        }`}
                      />
                      <span>
                        <span className="block font-display text-sm font-semibold">{n.title}</span>
                        <span className="block font-body text-xs leading-relaxed text-clay-ink-soft">
                          {n.body}
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </Popover>
          )}
        </AnimatePresence>

        {/* settings */}
        <AnimatePresence>
          {panel === "settings" && (
            <Popover>
              <h3 className="mb-1 font-display text-lg font-semibold">Feel and feedback</h3>
              <p className="mb-4 font-body text-xs text-clay-muted">
                Wanderly answers every press with a soft sound and a tap.
              </p>
              <ToggleRow
                label="Interface sounds"
                hint="Procedural clay taps, no audio files"
                checked={sound}
                onChange={toggleSound}
                icon={sound ? <SoundOnIcon size={18} /> : <SoundOffIcon size={18} />}
              />
              <ToggleRow
                label="Haptics"
                hint="Vibration on supported devices"
                checked={haptics}
                onChange={toggleHaptics}
                icon={<SparkIcon size={18} />}
              />

              {user && (
                <div className="mt-3 flex items-center gap-3 border-t border-clay-muted/20 pt-3">
                  <ClayAvatar id={user.avatarId} initials={initialsOf(user.name)} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-semibold">
                      {user.name}
                    </span>
                    <span className="block truncate font-body text-[11px] text-clay-muted">
                      {user.email}
                    </span>
                  </span>
                  <button
                    onClick={async () => {
                      play("toggleOff");
                      await signOut();
                      router.replace("/login");
                      router.refresh();
                    }}
                    className="shrink-0 rounded-full bg-clay-blush px-3 py-1.5 font-body text-[11px] font-bold text-clay-ink shadow-clay-xs"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </Popover>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

/* ------------------------------- pieces ------------------------------- */

export function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NavIconButton({
  children,
  onClick,
  label,
  active,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      {...iconPress}
      onClick={onClick}
      aria-label={label}
      className={[
        "relative flex h-11 w-11 items-center justify-center rounded-full text-clay-ink transition-shadow duration-200 sm:h-12 sm:w-12",
        active ? "bg-clay-butter shadow-clay-pressed" : "bg-clay-surface shadow-clay-sm hover:shadow-clay",
        className,
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}

function Popover({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={springSnappy}
      className="absolute right-0 top-[calc(100%+14px)] w-[min(92vw,22rem)] rounded-clay bg-clay-surface p-4 shadow-clay-lg"
    >
      {children}
    </motion.div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  icon,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onChange}
      className="mb-2 flex w-full items-center gap-3 rounded-clay-sm p-2.5 text-left transition-colors hover:bg-clay-sunken/50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-mint text-clay-ink shadow-clay-xs">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-display text-sm font-semibold">{label}</span>
        <span className="block font-body text-[11px] text-clay-muted">{hint}</span>
      </span>
      <span
        className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-300 ${
          checked ? "bg-clay-jade/70" : "bg-clay-sunken"
        } shadow-clay-inset-sm`}
      >
        <motion.span
          layout
          transition={springSnappy}
          className={`h-6 w-6 rounded-full bg-clay-raised shadow-clay-xs ${checked ? "ml-auto" : ""}`}
        />
      </span>
    </button>
  );
}
