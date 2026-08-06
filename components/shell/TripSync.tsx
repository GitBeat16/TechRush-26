"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth/session";
import { readTrips } from "@/lib/store";
import { startTripSync, stopTripSync } from "@/lib/sync/trips";

/**
 * Headless. Starts trip sync once the user is authenticated and stops it when
 * they sign out. Lives in AppShell so it is mounted for the whole session
 * rather than per page.
 */
export function TripSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // Read the trips here rather than subscribing to them: the sync layer only
    // needs the starting snapshot, and every later change reaches it through
    // the store's own change notification.
    void startTripSync(readTrips());

    return () => stopTripSync();
  }, [status]);

  return null;
}
