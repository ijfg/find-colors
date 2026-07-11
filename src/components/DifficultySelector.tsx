import type { Difficulty } from "../types";
import { t, useLocale } from "../i18n";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  className?: string;
}

const OPTIONS: { d: Difficulty; key: string }[] = [
  { d: 1, key: "difficulty.one" },
  { d: 4, key: "difficulty.four" },
  { d: 9, key: "difficulty.nine" },
  { d: 16, key: "difficulty.sixteen" },
];

export function DifficultySelector({
  value,
  onChange,
  className = "",
}: DifficultySelectorProps) {
  useLocale();

  return (
    <div className={`mt-5 sm:mt-6 ${className}`}>
      <div
        className="grid grid-cols-4 gap-1.5 sm:gap-2"
        role="group"
        aria-label={t("a11y.difficulty")}
      >
        {OPTIONS.map(({ d, key }) => {
          const selected = value === d;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(d)}
              className={`min-h-10 rounded-lg px-2 py-2 text-sm transition-all ${
                selected
                  ? "bg-[var(--color-surface)] font-medium text-[var(--color-ink)] ring-1 ring-[var(--color-border-strong)]"
                  : "bg-transparent text-[var(--color-ink-muted)] ring-1 ring-transparent hover:text-[var(--color-ink-secondary)]"
              }`}
            >
              {t(key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
