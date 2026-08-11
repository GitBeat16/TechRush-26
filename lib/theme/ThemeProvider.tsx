"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { updateProfile, useSession } from "@/lib/auth/session";
import { DEFAULT_THEME, isThemeId, resolveTheme } from "@/lib/theme/themes";
import type { ThemeId, ThemeMode } from "@/types/theme";

/* ------------------------------------------------------------------ */
/* Theme provider                                                      */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "wanderly:theme:v1";
const MODE_STORAGE_KEY = "wanderly:mode:v1";

interface ThemeContextValue {
  /** The theme currently painted. */
  theme: ThemeId;
  /** Light or Dark mode for the Original theme. */
  mode: ThemeMode;
  /** The user's explicit override, if they have set one. */
  explicit: ThemeId | null;
  /** True while a change is being written back to Supabase. */
  saving: boolean;
  /** Pick a theme by hand. Persists to the profile. */
  setTheme: (id: ThemeId) => void;
  /** Set light or dark mode. Persists to local storage. */
  setMode: (mode: ThemeMode) => void;
  /** Drop the override and fall back to the questionnaire answer. */
  clearOverride: () => void;
  /** Preview a theme without saving. */
  previewTheme: (id: ThemeId | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * A tiny script that runs before first paint.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});var m=localStorage.getItem(${JSON.stringify(
  MODE_STORAGE_KEY,
)})||localStorage.getItem("wanderly-theme-mode");var sysDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=m?m==="dark":sysDark;if(t==="sunny"||t==="snowy"||t==="rainy"||t==="clay"||!t){if(t)document.documentElement.setAttribute("data-theme",t);if((!t||t==="clay")&&isDark){document.documentElement.setAttribute("data-mode","dark");}}}catch(e){}})();`;

/* ---------------------- the cached theme, as a store ---------------- */

const cacheListeners = new Set<() => void>();

function subscribeToCache(listener: () => void) {
  cacheListeners.add(listener);
  return () => cacheListeners.delete(listener);
}

function readCache(): ThemeId {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function readModeCache(): ThemeMode {
  try {
    const raw =
      window.localStorage.getItem(MODE_STORAGE_KEY) ||
      window.localStorage.getItem("wanderly-theme-mode");
    if (raw === "dark" || raw === "light") return raw;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  } catch {
    return "light";
  }
}

function readCacheOnServer(): ThemeId {
  return DEFAULT_THEME;
}

function readModeOnServer(): ThemeMode {
  return "light";
}

function writeCache(theme: ThemeId) {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === theme) return;
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  cacheListeners.forEach((listener) => listener());
}

function writeModeCache(mode: ThemeMode) {
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    window.localStorage.setItem("wanderly-theme-mode", mode);
  } catch {}
  cacheListeners.forEach((listener) => listener());
}

/* ---------------------------------------------------- the provider */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();

  const cachedTheme = useSyncExternalStore(
    subscribeToCache,
    readCache,
    readCacheOnServer,
  );

  const cachedMode = useSyncExternalStore(
    subscribeToCache,
    readModeCache,
    readModeOnServer,
  );

  const [override, setOverride] = useState<{ userId: string; theme: ThemeId } | null>(
    null,
  );
  const [modeState, setModeState] = useState<ThemeMode>(cachedMode);
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [saving, setSaving] = useState(false);

  const explicit = user?.theme ?? null;

  const fromProfile = user
    ? resolveTheme(user.theme, user.preferences.preferredWeather)
    : null;

  const optimistic =
    override && user && override.userId === user.id ? override.theme : null;

  const painted = preview ?? optimistic ?? fromProfile ?? cachedTheme;

  /* Keep modeState in sync with cache updates */
  useEffect(() => {
    setModeState(cachedMode);
  }, [cachedMode]);

  /* Listen for OS system preference changes if user has no saved preference */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved =
        window.localStorage.getItem(MODE_STORAGE_KEY) ||
        window.localStorage.getItem("wanderly-theme-mode");
      if (!saved) {
        const sysMode = e.matches ? "dark" : "light";
        setModeState(sysMode);
      }
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  /* Synchronize DOM attributes data-theme and data-mode */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", painted);

    if (painted === "clay" && modeState === "dark") {
      document.documentElement.setAttribute("data-mode", "dark");
    } else {
      document.documentElement.removeAttribute("data-mode");
    }

    if (preview === null) writeCache(painted);
  }, [painted, preview, modeState]);

  const previewTheme = useCallback((id: ThemeId | null) => {
    setPreview(id);
  }, []);

  const setTheme = useCallback(
    (id: ThemeId) => {
      if (!user) return;
      setPreview(null);
      setOverride({ userId: user.id, theme: id });
      setSaving(true);
      updateProfile({ theme: id })
        .catch(() => {})
        .finally(() => setSaving(false));
    },
    [user],
  );

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    writeModeCache(newMode);
  }, []);

  const clearOverride = useCallback(() => {
    setPreview(null);
    setOverride(null);
    setSaving(true);
    updateProfile({ theme: null })
      .catch(() => {})
      .finally(() => setSaving(false));
  }, []);

  const value = useMemo(
    () => ({
      theme: painted,
      mode: modeState,
      explicit,
      saving,
      setTheme,
      setMode,
      clearOverride,
      previewTheme,
    }),
    [painted, modeState, explicit, saving, setTheme, setMode, clearOverride, previewTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <div
        key={`${painted}-${painted === "clay" ? modeState : "default"}`}
        aria-hidden
        className="clay-theme-wash pointer-events-none fixed inset-0 z-[60] bg-clay-bg"
      />
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}
