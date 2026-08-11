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
/*                                                                     */
/* Source of truth is profiles.theme in Supabase. localStorage holds a  */
/* mirror purely so the very first paint is already the right colour —  */
/* /api/auth/me takes a round trip, and a flash of terracotta before a  */
/* snow theme loads looks like a bug.                                   */
/*                                                                     */
/* The painted theme is derived during render rather than mirrored into */
/* state by an effect. That keeps it impossible for the DOM attribute   */
/* and React's idea of the theme to disagree, and avoids the cascading  */
/* render a setState-in-effect would cause.                             */
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
  /**
   * Paint a theme without saving it — used by the questionnaire so the app
   * changes colour the instant someone taps a weather option. Pass null to
   * drop back to the real theme.
   */
  previewTheme: (id: ThemeId | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * A tiny script that runs before first paint. Reading localStorage in an
 * effect would be one frame too late — the user would see the default
 * palette flash first.
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

/** The server has no localStorage, so it always renders the default. */
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
  } catch {
    /* private mode — the theme applies, it just won't survive a reload */
  }
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

  const mode = useSyncExternalStore(
    subscribeToCache,
    readModeCache,
    readModeOnServer,
  );

  /**
   * An optimistic local choice, tagged with whose choice it was. Tagging means
   * signing into a different account cannot inherit the previous user's pick,
   * without needing an effect to clear it.
   */
  const [override, setOverride] = useState<{ userId: string; theme: ThemeId } | null>(
    null,
  );
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [saving, setSaving] = useState(false);

  const explicit = user?.theme ?? null;

  const fromProfile = user
    ? resolveTheme(user.theme, user.preferences.preferredWeather)
    : null;

  const optimistic =
    override && user && override.userId === user.id ? override.theme : null;

  // Precedence: an active preview, then an unsaved local pick, then the
  // profile, then whatever was cached from last time.
  const painted = preview ?? optimistic ?? fromProfile ?? cachedTheme;

  /* Listen for OS system preference changes if user has no saved preference */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const saved =
        window.localStorage.getItem(MODE_STORAGE_KEY) ||
        window.localStorage.getItem("wanderly-theme-mode");
      if (!saved) {
        cacheListeners.forEach((listener) => listener());
      }
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  /* The only place that touches the DOM. Writing an attribute on <html> is
     exactly the external-system synchronisation effects are for. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", painted);

    if (painted === "clay" && mode === "dark") {
      document.documentElement.setAttribute("data-mode", "dark");
    } else {
      document.documentElement.removeAttribute("data-mode");
    }

    // A preview is not the user's theme, so it must not poison the cache —
    // otherwise abandoning the questionnaire half way would stick.
    if (preview === null) writeCache(painted);
  }, [painted, preview, mode]);

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
        .catch(() => {
          /* Offline or signed out — the local paint stands, and Supabase
             catches up the next time the user changes it. */
        })
        .finally(() => setSaving(false));
    },
    [user],
  );

  const setMode = useCallback((newMode: ThemeMode) => {
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
      mode,
      explicit,
      saving,
      setTheme,
      setMode,
      clearOverride,
      previewTheme,
    }),
    [painted, mode, explicit, saving, setTheme, setMode, clearOverride, previewTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Remounted on every theme change by the key, which restarts the CSS
          animation. A soft wash makes the palette swap read as a change in
          light rather than an instant repaint — and needs no state to drive. */}
      <div
        key={`${painted}-${painted === "clay" ? mode : "default"}`}
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
