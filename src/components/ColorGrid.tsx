import { t, useLocale } from "../i18n";

interface ColorGridProps {
  colors: string[];
  dim?: 1 | 2 | 3 | 4;
  size?: "sm" | "md" | "lg";
  variant?: "grid" | "toolbar" | "sidebar" | "flank";
  className?: string;
  selectedIndex?: number | null;
  onSelectCell?: (index: number) => void;
  allowEmpty?: boolean;
  label?: string;
  selectedTone?: "stone" | "amber";
}

const sizeClasses = {
  sm: "w-32 h-32 gap-0.5 sm:w-40 sm:h-40",
  md: "w-44 h-44 gap-1 sm:w-56 sm:h-56",
  lg: "w-56 h-56 gap-1 sm:w-72 sm:h-72",
};

const colsRowsClass: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-2",
  3: "grid-cols-3 grid-rows-3",
  4: "grid-cols-4 grid-rows-4",
};

const flankCellSize: Record<number, string> = {
  1: "6rem",
  2: "5rem",
  3: "4rem",
  4: "2.75rem",
};

function renderGridCells(
  total: number,
  colors: string[],
  allowEmpty: boolean,
  selectedIndex: number | null | undefined,
  onSelectCell: ((index: number) => void) | undefined,
  ringColor: string,
  cellClassName: string,
  emptyClassName: string,
) {
  return Array.from({ length: total }, (_, i) => {
    const color = colors[i] ?? "";
    const isEmpty = allowEmpty && !color;
    const isSelected = selectedIndex === i;
    const interactive = !!onSelectCell;

    return (
      <button
        key={i}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-label={
          isEmpty
            ? t("a11y.emptyCell", { n: i + 1 })
            : t("a11y.colorCell", { n: i + 1, hex: color })
        }
        title={isEmpty ? t("a11y.waitingFill") : color}
        onClick={(e) => {
          e.stopPropagation();
          onSelectCell?.(i);
        }}
        disabled={!interactive}
        className={`
          ${cellClassName}
          ${interactive ? "cursor-pointer" : "cursor-default"}
          ${
            interactive && !isSelected
              ? "hover:ring-2 hover:ring-stone-300"
              : ""
          }
          ${isSelected ? `ring-2 ring-inset ${ringColor}` : "ring-1 ring-inset ring-stone-200"}
          ${isEmpty ? emptyClassName : ""}
        `}
        style={isEmpty ? undefined : { backgroundColor: color }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
          {i + 1}
        </span>
      </button>
    );
  });
}

export function ColorGrid({
  colors,
  dim = 4,
  size = "md",
  variant = "grid",
  className = "",
  selectedIndex = null,
  onSelectCell,
  allowEmpty = false,
  label,
  selectedTone = "stone",
}: ColorGridProps) {
  useLocale();
  const ringColor =
    selectedTone === "amber" ? "ring-amber-500" : "ring-stone-800";

  function cellRingClass(isSelected: boolean): string {
    if (isSelected) {
      return `ring-2 ring-inset ${ringColor}`;
    }
    return "ring-1 ring-inset ring-stone-200";
  }

  const total = dim * dim;

  if (variant === "sidebar") {
    return (
      <div
        className={`flex min-h-0 w-full flex-col items-stretch gap-1.5 ${className}`}
        role="listbox"
        aria-label={label ?? t("a11y.colorGrid")}
        data-preserve-selection
      >
        {label && (
          <span className="shrink-0 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-stone-500">
            {label}
          </span>
        )}
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-x-hidden overflow-y-auto overscroll-y-contain p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: total }, (_, i) => {
            const color = colors[i] ?? "";
            const isEmpty = allowEmpty && !color;
            const isSelected = selectedIndex === i;
            const interactive = !!onSelectCell;

            return (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={
                  isEmpty
                    ? t("a11y.emptyCell", { n: i + 1 })
                    : t("a11y.colorCell", { n: i + 1, hex: color })
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCell?.(i);
                }}
                disabled={!interactive}
                className={`
                  relative h-10 w-10 shrink-0 rounded-md transition-all
                  ${interactive ? "cursor-pointer" : "cursor-default"}
                  ${cellRingClass(isSelected)}
                  ${
                    isEmpty
                      ? "border border-dashed border-stone-300 bg-stone-50"
                      : ""
                  }
                `}
                style={isEmpty ? undefined : { backgroundColor: color }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (variant === "flank") {
    const cellSize = flankCellSize[dim] ?? "2rem";

    return (
      <div
        className={`flex flex-col items-center gap-2 ${className}`}
        role="listbox"
        aria-label={label ?? t("a11y.colorGrid")}
        data-preserve-selection
      >
        {label && (
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
            {label}
          </p>
        )}
        <div
          className={`grid gap-1 ${colsRowsClass[dim]}`}
          style={{
            gridTemplateColumns: `repeat(${dim}, ${cellSize})`,
            gridTemplateRows: `repeat(${dim}, ${cellSize})`,
          }}
        >
          {renderGridCells(
            total,
            colors,
            allowEmpty,
            selectedIndex,
            onSelectCell,
            ringColor,
            "relative rounded-sm transition-all",
            "border border-dashed border-stone-300 bg-stone-50",
          )}
        </div>
      </div>
    );
  }

  if (variant === "toolbar") {
    return (
      <div
        className={`flex w-full items-center gap-2 ${className}`}
        role="listbox"
        aria-label={label ?? t("a11y.colorGrid")}
        data-preserve-selection
      >
        {label && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            {label}
          </span>
        )}
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: total }, (_, i) => {
            const color = colors[i] ?? "";
            const isEmpty = allowEmpty && !color;
            const isSelected = selectedIndex === i;
            const interactive = !!onSelectCell;

            return (
              <button
                key={i}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={
                  isEmpty
                    ? t("a11y.emptyCell", { n: i + 1 })
                    : t("a11y.colorCell", { n: i + 1, hex: color })
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCell?.(i);
                }}
                disabled={!interactive}
                className={`
                  relative h-10 w-10 shrink-0 rounded-md transition-all
                  ${interactive ? "cursor-pointer" : "cursor-default"}
                  ${cellRingClass(isSelected)}
                  ${
                    isEmpty
                      ? "border border-dashed border-stone-300 bg-stone-50"
                      : ""
                  }
                `}
                style={isEmpty ? undefined : { backgroundColor: color }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.65)]">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      data-preserve-selection
    >
      {label && (
        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {label}
        </p>
      )}
      <div
        className={`grid ${colsRowsClass[dim]} ${sizeClasses[size]}`}
        role="listbox"
        aria-label={label ?? t("a11y.colorGrid")}
      >
        {Array.from({ length: total }, (_, i) => {
          const color = colors[i] ?? "";
          const isEmpty = allowEmpty && !color;
          const isSelected = selectedIndex === i;
          const interactive = !!onSelectCell;

          return (
            <button
              key={i}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={
                isEmpty
                  ? t("a11y.emptyCell", { n: i + 1 })
                  : t("a11y.colorCell", { n: i + 1, hex: color })
              }
              title={isEmpty ? t("a11y.waitingFill") : color}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCell?.(i);
              }}
              disabled={!interactive}
              className={`
                min-h-[44px] min-w-[44px] rounded-sm transition-all
                ${interactive ? "cursor-pointer" : "cursor-default"}
                ${
                  interactive && !isSelected
                    ? "hover:scale-105 hover:ring-2 hover:ring-stone-400"
                    : ""
                }
                ${isSelected ? `ring-2 ring-inset ${ringColor}` : ""}
                ${
                  isEmpty
                    ? "border-2 border-dashed border-stone-300 bg-stone-50"
                    : ""
                }
              `}
              style={isEmpty ? undefined : { backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}
