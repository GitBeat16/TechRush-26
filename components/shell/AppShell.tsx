"use client";

import { MotionConfig, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Navbar } from "@/components/shell/Navbar";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileDock } from "@/components/shell/MobileDock";
import { ClayPlane } from "@/components/ui/ClayIllustrations";
import { WeatherAmbience } from "@/components/theme/WeatherAmbience";
import { TripSync } from "@/components/shell/TripSync";
import { AssistantDock } from "@/components/assistant/AssistantDock";
import { breathe, floatY, springSoft } from "@/lib/animations";
import { useSession } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/login"];
const ONBOARDING_ROUTE = "/onboarding";

/**
 * Everything that persists across routes lives here: the rail, the navbar,
 * the dock and the ambient background. It also holds the auth gate, so a
 * signed-out visitor never sees a flash of the dashboard — and now the
 * onboarding gate, so a signed-in visitor who hasn't set preferences yet
 * never sees a flash of it either.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { status, user } = useSession();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isFlipbookRoute = pathname !== "/destinations" && pathname.startsWith("/destinations/");
  const isOnboardingRoute = pathname === ONBOARDING_ROUTE;

  // Auth screens and full-screen 3D magazine pages get isolated view
  if (isPublic || isFlipbookRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen">
          <WeatherAmbience />
          {children}
        </div>
      </MotionConfig>
    );
  }

  if (status === "loading") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen">
          <WeatherAmbience />
          <Splash />
        </div>
      </MotionConfig>
    );
  }

  if (status === "unauthenticated") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen">
          <WeatherAmbience />
          {/* ?stale tells proxy.ts not to bounce us back if it disagrees and
              still considers this visitor signed in. Without it the two gates
              redirect each other between /login and / indefinitely. */}
          <RedirectTo path="/login?stale=1" label="Taking you to sign in" />
        </div>
      </MotionConfig>
    );
  }

  // status === "authenticated" from here on.
  const needsOnboarding = !user?.onboardingCompleted;

  // Signed in, hasn't onboarded yet, and trying to reach anything else —
  // send them to the questionnaire first.
  if (needsOnboarding && !isOnboardingRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen">
          <WeatherAmbience />
          <RedirectTo path={ONBOARDING_ROUTE} label="Just a couple of quick questions" />
        </div>
      </MotionConfig>
    );
  }

  // On the questionnaire — either because they have not answered it yet, or
  // because they came back from /profile to change their answers. Both get
  // the bare shell, no nav, same treatment as /login. (Bouncing an already
  // onboarded user away from here used to make preferences uneditable.)
  if (isOnboardingRoute) {
    return (
      <MotionConfig reducedMotion="user">
        <div className="relative min-h-screen">
          <WeatherAmbience />
          {children}
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen">
        <WeatherAmbience />
        <TripSync />

        <Sidebar />

        <div className="lg:pl-32">
          <Navbar />

          <main className="mx-auto w-full max-w-[1400px] px-3 pb-32 pt-6 sm:px-5 sm:pt-8 lg:pb-14 lg:pr-6">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...springSoft, filter: { duration: 0.35 } }}
            >
              {children}
            </motion.div>
          </main>
        </div>

        <MobileDock />

        {/* Sits above the mobile dock on phones, in the corner on desktop.
            Only rendered for signed-in, onboarded users — every earlier
            branch returns before this point. */}
        <AssistantDock />
      </div>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */

function RedirectTo({ path, label }: { path: string; label: string }) {
  const router = useRouter();

  // Navigation is an external system, so this is exactly what an effect is for.
  useEffect(() => {
    router.replace(path);
  }, [router, path]);

  return <Splash label={label} />;
}

function Splash({ label = "Warming up the clay" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <motion.div {...floatY(10, 2.6)}>
        <span className="flex h-20 w-20 items-center justify-center rounded-clay-sm bg-clay-sky shadow-clay">
          <ClayPlane size={48} base="#6f9ee6" />
        </span>
      </motion.div>
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            animate={{ scale: [1, 0.6, 1], opacity: [1, 0.4, 1] }}
            transition={{
              type: "tween",
              duration: 1.1,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
            className="h-2.5 w-2.5 rounded-full bg-clay-tangerine"
          />
        ))}
      </div>
      <p className="font-body text-sm text-clay-muted">{label}</p>
    </div>
  );
}

