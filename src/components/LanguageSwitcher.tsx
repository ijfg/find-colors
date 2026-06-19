import { setLocale, useLocale, type Locale } from "../i18n";

const options: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "zh-Hans", label: "简中" },
  { value: "zh-Hant", label: "繁中" },
];

const SEP = "·";

export function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <div
      className="flex min-h-11 items-center text-xs text-stone-500"
      role="group"
      aria-label="Language"
    >
      {options.map(({ value, label }, index) => (
        <span key={value} className="inline-flex items-center">
          {index > 0 && (
            <span className="px-1 text-stone-300 select-none" aria-hidden>
              {SEP}
            </span>
          )}
          <button
            type="button"
            onClick={() => setLocale(value)}
            className={`border-b py-2 transition-colors hover:text-stone-700 ${
              locale === value
                ? "border-stone-800 text-stone-800"
                : "border-transparent text-stone-500"
            }`}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
