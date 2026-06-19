import { useSyncExternalStore } from "react";
import { translations, type TranslationNode } from "./translations";

export type Locale = "en" | "zh";

const LS_KEY = "color-game-locale";
const subscribers = new Set<() => void>();

function detect(): Locale {
  try {
    const saved = localStorage.getItem(LS_KEY) as Locale | null;
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    // ignore
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

let current: Locale = detect();

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale) {
  current = locale;
  try {
    localStorage.setItem(LS_KEY, locale);
  } catch {
    // ignore
  }
  document.documentElement.lang = locale;
  subscribers.forEach((s) => s());
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    (cb) => {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
    () => current,
    () => current,
  );
}

function resolve(key: string): TranslationNode | null {
  const parts = key.split(".");
  let node: unknown = translations;
  for (const part of parts) {
    if (node == null || typeof node !== "object") return null;
    node = (node as Record<string, unknown>)[part];
  }
  if (
    node != null &&
    typeof node === "object" &&
    "en" in node &&
    "zh" in node &&
    typeof (node as TranslationNode).en === "string" &&
    typeof (node as TranslationNode).zh === "string"
  ) {
    return node as TranslationNode;
  }
  return null;
}

export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const node = resolve(key);
  if (!node) return key;
  let out = node[current];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}
