"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { initialsOf } from "@/components/shell/Navbar";
import { TravelStats } from "@/components/Dashboard/TravelStats";
import { DestinationCard } from "@/components/Dashboard/DestinationCard";
import { AvatarPicker } from "@/components/auth/AvatarPicker";
import { ClayCard, ClayWell } from "@/components/ui/ClayCard";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayAvatar, getAvatar } from "@/components/ui/ClayAvatar";
import {
  BookmarkIcon,
  CheckIcon,
  EditIcon,
  PinIcon,
  RefreshIcon,
  SoundOffIcon,
  SoundOnIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/Icons";
import { fadeUp, springSnappy, springSoft, stagger } from "@/lib/animations";
import { TONES } from "@/lib/tones";
import { useFeedback } from "@/lib/feedback";
import { AuthError, signOut, updateProfile, useSession } from "@/lib/auth/session";
import { actions, useAppState, useSavedDestinations } from "@/lib/store";
import { ACHIEVEMENTS, DESTINATIONS } from "@/lib/data";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useSession();
  const { sound, haptics, play, toggleSound, toggleHaptics } = useFeedback();
  const { trips } = useAppState();
  const { savedDestinationIds } = useSavedDestinations();

  const [editing, setEditing] = useState(false);

  const saved = DESTINATIONS.filter((destination) =>
    savedDestinationIds.includes(destination.id),
  );
  const completed = trips.filter((trip) => trip.status === "completed").length;

  if (!user) return null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your account"
        title={user.name}
        subtitle={`${user.homeCity ? `Travelling from ${user.homeCity} · ` : ""}${
          user.provider === "google" ? "Google account" : "Email account"
        } · joined ${user.createdAt}`}
        icon={<UserIcon size={24} />}
      />

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-8">
        {/* ------------------------------------------ identity */}
        <motion.div variants={fadeUp}>
          <ClayCard tone="lilac" radius="xl" depth="lg" className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-5">
              <motion.span
                whileHover={{ scale: 1.06, rotate: -5 }}
                transition={springSnappy}
                className="shrink-0"
              >
                <ClayAvatar
                  id={user.avatarId}
                  initials={initialsOf(user.name)}
                  size={84}
                  ring
                />
              </motion.span>

              <div className="min-w-0">
                <p className="font-display text-2xl font-semibold leading-tight">
                  {user.name}
                </p>
                <p className="font-body text-sm text-clay-ink-soft">{user.email}</p>
                <p className="mt-0.5 font-body text-xs text-clay-ink-soft">
                  {trips.length} trips · {completed} completed · {saved.length} bookmarked
                </p>
              </div>

              <div className="ml-auto flex flex-wrap gap-2">
                <ClayButton
                  size="sm"
                  tone="surface"
                  leftIcon={<EditIcon size={15} />}
                  onClick={() => setEditing((current) => !current)}
                >
                  {editing ? "Close" : "Edit profile"}
                </ClayButton>
                <Link href="/plan">
                  <ClayButton size="sm" tone="mint" leftIcon={<SparkIcon size={15} />} sound={null}>
                    Plan a trip
                  </ClayButton>
                </Link>
              </div>
            </div>

            <AnimatePresence>
              {editing && (
                <ProfileEditor
                  key="editor"
                  initialName={user.name}
                  initialCity={user.homeCity}
                  initialAvatar={user.avatarId}
                  onDone={() => setEditing(false)}
                />
              )}
            </AnimatePresence>
          </ClayCard>
        </motion.div>

        <TravelStats />

        {/* ------------------------------------------ achievements */}
        <motion.section variants={fadeUp}>
          <h2 className="mb-4 px-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Achievements
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {ACHIEVEMENTS.map((achievement) => (
              <ClayCard
                key={achievement.id}
                tone={achievement.unlocked ? achievement.tone : "surface"}
                radius="lg"
                depth="sm"
                interactive
                subtle
                className={`flex items-center gap-3 p-4 ${achievement.unlocked ? "" : "opacity-70"}`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-clay-xs ${
                    achievement.unlocked
                      ? "bg-clay-raised text-clay-jade"
                      : "bg-clay-sunken text-clay-muted shadow-clay-inset-sm"
                  }`}
                >
                  {achievement.unlocked ? <CheckIcon size={19} /> : <SparkIcon size={18} />}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-semibold">
                    {achievement.label}
                  </span>
                  <span className="block font-body text-[11px] leading-relaxed text-clay-ink-soft">
                    {achievement.detail}
                  </span>
                </span>
              </ClayCard>
            ))}
          </div>
        </motion.section>

        {/* ------------------------------------------ saved */}
        <motion.section variants={fadeUp}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Saved places
              </h2>
              <p className="mt-1 font-body text-sm text-clay-ink-soft">
                Everything you bookmarked while exploring
              </p>
            </div>
            <Link href="/explore">
              <ClayButton size="sm" tone="sky" leftIcon={<PinIcon size={15} />} sound={null}>
                Find more
              </ClayButton>
            </Link>
          </div>

          {saved.length === 0 ? (
            <ClayCard tone="surface" radius="lg" depth="sm" className="p-10 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-clay-sunken text-clay-muted shadow-clay-inset-sm">
                <BookmarkIcon size={20} />
              </span>
              <p className="font-display text-lg font-semibold">Nothing saved yet</p>
              <p className="mt-1 font-body text-sm text-clay-ink-soft">
                Tap the bookmark on any destination in Explore.
              </p>
            </ClayCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {saved.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} fluid />
              ))}
            </div>
          )}
        </motion.section>

        {/* ------------------------------------------ settings */}
        <motion.section variants={fadeUp}>
          <h2 className="mb-4 px-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h2>
          <ClayCard tone="surface" radius="lg" depth="sm" className="divide-y divide-clay-muted/15 p-2">
            <SettingRow
              icon={sound ? <SoundOnIcon size={18} /> : <SoundOffIcon size={18} />}
              title="Interface sounds"
              hint="Procedural clay taps, generated in the browser"
              checked={sound}
              onToggle={toggleSound}
            />
            <SettingRow
              icon={<SparkIcon size={18} />}
              title="Haptics"
              hint="Vibration feedback on supported devices"
              checked={haptics}
              onToggle={toggleHaptics}
            />

            <div className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-butter text-clay-ink shadow-clay-xs">
                <RefreshIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold">Reset trip data</span>
                <span className="block font-body text-[11px] text-clay-muted">
                  Clears your trips and bookmarks, back to the demo content. Your account stays.
                </span>
              </span>
              <ClayButton size="sm" tone="surface" onClick={() => actions.reset()}>
                Reset
              </ClayButton>
            </div>

            <div className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-blush text-clay-ink shadow-clay-xs">
                <UserIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold">Sign out</span>
                <span className="block font-body text-[11px] text-clay-muted">
                  You will be asked to sign in again next time
                </span>
              </span>
              <ClayButton
                size="sm"
                tone="blush"
                onClick={async () => {
                  play("toggleOff");
                  await signOut();
                  router.replace("/login");
                  router.refresh();
                }}
              >
                Sign out
              </ClayButton>
            </div>
          </ClayCard>
        </motion.section>
      </motion.div>
    </div>
  );
}

/* ------------------------------- editor ------------------------------- */

function ProfileEditor({
  initialName,
  initialCity,
  initialAvatar,
  onDone,
}: {
  initialName: string;
  initialCity: string;
  initialAvatar: string;
  onDone: () => void;
}) {
  const { play } = useFeedback();
  const [name, setName] = useState(initialName);
  const [homeCity, setHomeCity] = useState(initialCity);
  const [avatarId, setAvatarId] = useState(initialAvatar);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const dirty =
    name !== initialName || homeCity !== initialCity || avatarId !== initialAvatar;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await updateProfile({ name, homeCity, avatarId });
      play("success");
      setSavedFlash(true);
      window.setTimeout(() => {
        setSavedFlash(false);
        onDone();
      }, 900);
    } catch (caught) {
      setError(caught instanceof AuthError ? caught.message : "Could not save");
      play("toggleOff");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "tween", duration: 0.28, ease: "easeInOut" }}
      onSubmit={save}
      className="overflow-hidden"
    >
      <div className="mt-5 rounded-clay bg-clay-surface/80 p-4 shadow-clay-inset-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <ClayWell radius="md" className="px-4 py-2.5">
            <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
              Display name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
            />
          </ClayWell>

          <ClayWell radius="md" className="px-4 py-2.5">
            <span className="block font-body text-[10px] font-bold uppercase tracking-wide text-clay-muted">
              Home city
            </span>
            <input
              value={homeCity}
              onChange={(event) => setHomeCity(event.target.value)}
              placeholder="Bengaluru"
              className="w-full bg-transparent font-body text-[15px] outline-none placeholder:text-clay-muted"
            />
          </ClayWell>
        </div>

        <div className="mt-4">
          <div className="mb-2.5 flex items-center gap-3">
            <ClayAvatar id={avatarId} size={44} ring />
            <div>
              <p className="font-display text-sm font-semibold">
                {getAvatar(avatarId).label}
              </p>
              <p className="font-body text-[11px] text-clay-muted">
                Pick a different traveler
              </p>
            </div>
          </div>
          <AvatarPicker value={avatarId} onChange={setAvatarId} size={44} />
        </div>

        {error && (
          <p className="mt-3 rounded-clay-sm bg-clay-blush px-4 py-2.5 font-body text-xs font-bold shadow-clay-xs">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ClayButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={!dirty || savedFlash}
            leftIcon={<CheckIcon size={15} />}
          >
            {savedFlash ? "Saved" : "Save changes"}
          </ClayButton>
          <ClayButton type="button" size="sm" tone="surface" onClick={onDone}>
            Cancel
          </ClayButton>
          <AnimatePresence>
            {savedFlash && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={springSoft}
                className="font-body text-xs font-bold text-clay-jade"
              >
                Profile updated
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.form>
  );
}

function SettingRow({
  icon,
  title,
  hint,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-clay-sunken/40"
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${TONES.mint.bg} text-clay-ink shadow-clay-xs`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold">{title}</span>
        <span className="block font-body text-[11px] text-clay-muted">{hint}</span>
      </span>
      <span
        className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 shadow-clay-inset-sm transition-colors duration-300 ${
          checked ? "bg-clay-jade/70" : "bg-clay-sunken"
        }`}
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
