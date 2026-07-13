import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const LS_KEY = "color-game-theme";
const subscribers = new Set<() => void>();

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: "#f3f1ec",
  dark: "#1c1a18",
};

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** First visit: follow OS. After that, only light/dark are stored. */
function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    // Migrate old "system" (or missing) → concrete light/dark from OS
    if (saved === "system" || saved == null) {
      const fromSystem: ThemePreference = systemPrefersDark() ? "dark" : "light";
      if (saved === "system") {
        localStorage.setItem(LS_KEY, fromSystem);
      }
      return fromSystem;
    }
  } catch {
    // ignore
  }
  return systemPrefersDark() ? "dark" : "light";
}

let preference: ThemePreference = readPreference();
let resolved: ResolvedTheme = preference;

function notify() {
  subscribers.forEach((s) => s());
}

export function applyThemeToDocument(next: ResolvedTheme = resolved): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", THEME_COLORS[next]);
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function getResolvedTheme(): ResolvedTheme {
  return resolved;
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  resolved = next;
  try {
    localStorage.setItem(LS_KEY, next);
  } catch {
    // ignore
  }
  applyThemeToDocument(resolved);
  notify();
}

export function toggleTheme(): void {
  setThemePreference(preference === "dark" ? "light" : "dark");
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => preference,
    () => preference,
  );
}

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => resolved,
    () => resolved,
  );
}

/** Call once before React render to avoid a light flash. */
export function initTheme(): void {
  preference = readPreference();
  resolved = preference;
  // Persist first-visit choice so later OS changes don't flip a settled UI
  try {
    if (localStorage.getItem(LS_KEY) == null) {
      localStorage.setItem(LS_KEY, preference);
    }
  } catch {
    // ignore
  }
  applyThemeToDocument(resolved);
}
