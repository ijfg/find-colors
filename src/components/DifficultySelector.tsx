import type { Difficulty } from "../types";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

const OPTIONS: { d: Difficulty; label: string }[] = [
  { d: 1, label: "1色" },
  { d: 4, label: "4色" },
  { d: 9, label: "9色" },
  { d: 16, label: "16色" },
];

export function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="mt-5 sm:mt-6">
      <div
        className="grid grid-cols-4 gap-1.5 sm:gap-2"
        role="group"
        aria-label="难度"
      >
        {OPTIONS.map(({ d, label }) => {
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
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
