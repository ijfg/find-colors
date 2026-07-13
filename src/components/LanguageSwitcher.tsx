import { setLocale, t, useLocale, type Locale } from "../i18n";
import { HEADER_CHIP_CLASS } from "./ThemeSwitcher";

const CYCLE: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "zh-Hans", label: "简中" },
  { value: "zh-Hant", label: "繁中" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const index = Math.max(
    0,
    CYCLE.findIndex((o) => o.value === locale),
  );
  const current = CYCLE[index]!;
  const next = CYCLE[(index + 1) % CYCLE.length]!;
  const label = `${t("language.label")}: ${current.label}`;

  return (
    <button
      type="button"
      onClick={() => setLocale(next.value)}
      className={HEADER_CHIP_CLASS}
      aria-label={label}
      title={label}
    >
      <span>{current.label}</span>
    </button>
  );
}
