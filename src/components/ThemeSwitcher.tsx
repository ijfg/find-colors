import { t, useLocale } from "../i18n";
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from "../theme";

/** Shared chrome for header chips (theme / language / records). */
export const HEADER_CHIP_CLASS =
  "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-bg)]";

const CYCLE: ThemePreference[] = ["light", "dark", "system"];

export function ThemeSwitcher() {
  useLocale();
  const preference = useThemePreference();
  const next = CYCLE[(CYCLE.indexOf(preference) + 1) % CYCLE.length]!;
  const label =
    preference === "light"
      ? t("theme.light")
      : preference === "dark"
        ? t("theme.dark")
        : t("theme.system");

  return (
    <button
      type="button"
      onClick={() => setThemePreference(next)}
      className={HEADER_CHIP_CLASS}
      aria-label={`${t("theme.label")}: ${label}`}
      title={`${t("theme.label")}: ${label}`}
    >
      <ThemeGlyph preference={preference} />
      <span>{label}</span>
    </button>
  );
}

function ThemeGlyph({ preference }: { preference: ThemePreference }) {
  if (preference === "dark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="currentColor"
        aria-hidden
      >
        <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" />
      </svg>
    );
  }
  if (preference === "system") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M12 16v4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
