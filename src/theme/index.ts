import { useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
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

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {
    // ignore
  }
  return "system";
}

let preference: ThemePreference = readPreference();

function resolve(pref: ThemePreference = preference): ResolvedTheme {
  if (pref === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return pref;
}

let resolved: ResolvedTheme = resolve();

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
  try {
    localStorage.setItem(LS_KEY, next);
  } catch {
    // ignore
  }
  resolved = resolve(next);
  applyThemeToDocument(resolved);
  notify();
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

/** Keep `system` preference in sync when OS theme changes. */
export function useSystemThemeSync(): void {
  const pref = useThemePreference();

  useEffect(() => {
    if (pref !== "system" || typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      resolved = resolve("system");
      applyThemeToDocument(resolved);
      notify();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);
}

/** Call once before React render to avoid a light flash. */
export function initTheme(): void {
  preference = readPreference();
  resolved = resolve(preference);
  applyThemeToDocument(resolved);
}
