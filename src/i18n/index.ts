import { useSyncExternalStore } from "react";
import { translations, type TranslationNode } from "./translations";

export type Locale = "en" | "zh-Hans" | "zh-Hant";

const LS_KEY = "color-game-locale";
const subscribers = new Set<() => void>();

function detectChineseVariant(): "zh-Hans" | "zh-Hant" {
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const lang of langs) {
    const l = lang.toLowerCase();
    if (
      l.startsWith("zh-tw") ||
      l.startsWith("zh-hk") ||
      l.startsWith("zh-mo") ||
      l.includes("hant")
    ) {
      return "zh-Hant";
    }
    if (
      l.startsWith("zh-cn") ||
      l.startsWith("zh-sg") ||
      l.includes("hans") ||
      l.startsWith("zh")
    ) {
      return "zh-Hans";
    }
  }
  return "zh-Hans";
}

function detectFromSystem(): Locale {
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const lang of langs) {
    if (lang.toLowerCase().startsWith("zh")) {
      return detectChineseVariant();
    }
  }
  return "en";
}

function detect(): Locale {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === "en" || saved === "zh-Hans" || saved === "zh-Hant") {
      return saved;
    }
    if (saved === "zh") {
      const migrated = detectChineseVariant();
      localStorage.setItem(LS_KEY, migrated);
      return migrated;
    }
  } catch {
    // ignore
  }
  return detectFromSystem();
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
    "zh-Hans" in node &&
    "zh-Hant" in node &&
    typeof (node as TranslationNode).en === "string" &&
    typeof (node as TranslationNode)["zh-Hans"] === "string" &&
    typeof (node as TranslationNode)["zh-Hant"] === "string"
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
