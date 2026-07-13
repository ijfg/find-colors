import { t, useLocale } from "../i18n";
import { toggleTheme, useThemePreference } from "../theme";

/** Shared chrome for header chips (theme / language / records). */
export const HEADER_CHIP_CLASS =
  "inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-bg)]";

export function ThemeSwitcher() {
  useLocale();
  const preference = useThemePreference();
  const label =
    preference === "dark" ? t("theme.dark") : t("theme.light");

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={`${HEADER_CHIP_CLASS} px-2`}
      aria-label={`${t("theme.label")}: ${label}`}
      title={`${t("theme.label")}: ${label}`}
    >
      <ThemeGlyph preference={preference} />
    </button>
  );
}

function ThemeGlyph({ preference }: { preference: "light" | "dark" }) {
  if (preference === "dark") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
        aria-hidden
      >
        <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
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
