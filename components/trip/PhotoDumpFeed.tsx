"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ClayButton } from "@/components/ui/ClayButton";
import { ClayCard } from "@/components/ui/ClayCard";
import { CameraIcon, PlusIcon } from "@/components/ui/Icons";
import { PhotoDumpCard } from "@/components/trip/PhotoDumpCard";
import { PhotoDumpUpload } from "@/components/trip/PhotoDumpUpload";
import { fadeUp, stagger } from "@/lib/animations";
import { useSession } from "@/lib/auth/session";
import { fetchPhotoDumps } from "@/lib/photo-dumps";
import type { PhotoDump } from "@/types/photo-dump";
import type { Trip } from "@/types/dashboard";

export function PhotoDumpFeed({
  trip,
  onPosted,
}: {
  trip: Trip;
  onPosted?: (dump: PhotoDump) => void;
}) {
  const session = useSession();
  const [dumps, setDumps] = useState<PhotoDump[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPhotoDumps(trip.id)
      .then((result) => {
        if (!cancelled) setDumps(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this trip's memories.");
      });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  const userId = session.status === "authenticated" && session.user ? session.user.id : null;

  return (
    <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <ClayCard tone="surface" radius="lg" depth="sm" className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <CameraIcon size={20} />
            <div>
              <p className="font-display text-base font-semibold">Trip memories</p>
              <p className="font-body text-xs text-clay-muted">
                {dumps?.length ?? 0} {dumps?.length === 1 ? "dump" : "dumps"} from this trip
              </p>
            </div>
          </div>
          {userId && (
            <ClayButton
              size="sm"
              tone="butter"
              className="ml-auto"
              leftIcon={<PlusIcon size={16} />}
              onClick={() => setCreating((current) => !current)}
            >
              {creating ? "Close" : "Create photo dump"}
            </ClayButton>
          )}
        </ClayCard>
      </motion.div>

      {userId && (
        <AnimatePresence>
          {creating && (
            <PhotoDumpUpload
              tripId={trip.id}
              userId={userId}
              onCancel={() => setCreating(false)}
              onPosted={(dump) => {
                setDumps((current) => [dump, ...(current ?? [])]);
                setCreating(false);
                onPosted?.(dump);
              }}
            />
          )}
        </AnimatePresence>
      )}

      {error && (
        <motion.div variants={fadeUp}>
          <ClayCard tone="blush" radius="lg" depth="sm" className="p-5 text-center font-body text-sm">
            {error}
          </ClayCard>
        </motion.div>
      )}

      {dumps === null && !error ? (
        <motion.div variants={fadeUp}>
          <ClayCard tone="surface" radius="lg" depth="sm" className="p-8 text-center">
            <p className="font-body text-sm text-clay-muted">Loading memories…</p>
          </ClayCard>
        </motion.div>
      ) : dumps?.length === 0 ? (
        <motion.div variants={fadeUp}>
          <ClayCard tone="surface" radius="lg" depth="sm" className="p-8 text-center">
            <CameraIcon size={26} className="mx-auto text-clay-muted" />
            <p className="mt-2 font-display text-lg font-semibold">No dumps yet</p>
            <p className="mt-1 font-body text-sm text-clay-ink-soft">
              Post the first batch of photos from this trip.
            </p>
          </ClayCard>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dumps?.map((dump) => (
            <PhotoDumpCard
              key={dump.id}
              tripId={trip.id}
              dump={dump}
              viewerId={userId ?? ""}
              onChange={(updated) =>
                setDumps((current) => current?.map((d) => (d.id === updated.id ? updated : d)) ?? null)
              }
              onRemoved={() =>
                setDumps((current) => current?.filter((d) => d.id !== dump.id) ?? null)
              }
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
