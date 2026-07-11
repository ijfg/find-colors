import type { GameResult } from "../types";
import { t, useLocale } from "../i18n";

interface ScoreResultProps {
  result: GameResult;
  onPlayAgain: () => void;
  playAgainBusy?: boolean;
  onNewPhoto: () => void;
  selectedDetailIndex?: number | null;
  onSelectDetailIndex?: (index: number | null) => void;
  compact?: boolean;
  hideActions?: boolean;
  rank?: number;
  rankTotal?: number;
  hideScoreDenom?: boolean;
  hideTotalLabel?: boolean;
  playerName?: string;
  playerEmoji?: string;
  pairedLayout?: boolean;
  tight?: boolean;
}

function rating(score: number): { labelKey: string; tone: string } {
  if (score >= 90) return { labelKey: "score.ratings.master", tone: "text-emerald-600" };
  if (score >= 75) return { labelKey: "score.ratings.sharp", tone: "text-teal-600" };
  if (score >= 60) return { labelKey: "score.ratings.okay", tone: "text-amber-600" };
  if (score >= 40) return { labelKey: "score.ratings.practice", tone: "text-orange-500" };
  return { labelKey: "score.ratings.farOff", tone: "text-rose-500" };
}

function ScoreDenom({ className = "text-caption" }: { className?: string }) {
  return <span className={className}>/ 100</span>;
}

export function ScoreResult({
  result,
  onPlayAgain,
  playAgainBusy = false,
  onNewPhoto,
  selectedDetailIndex = null,
  onSelectDetailIndex,
  compact = false,
  hideActions = false,
  rank,
  rankTotal,
  hideScoreDenom = false,
  hideTotalLabel = false,
  playerName,
  playerEmoji,
  pairedLayout = false,
  tight = false,
}: ScoreResultProps) {
  useLocale();
  const { total, details } = result;
  const { labelKey, tone } = rating(total);
  const swatchSize = tight
    ? "h-7 w-7"
    : pairedLayout
      ? "h-10 w-10"
      : "h-11 w-11";
  const cellCount = details.length;
  const cellGridClass = tight
    ? cellCount <= 1
      ? "grid-cols-1"
      : "grid-cols-2"
    : pairedLayout
      ? "grid-cols-2"
      : compact
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-4";

  function handleSelectDetail(index: number) {
    const next = selectedDetailIndex === index ? null : index;
    onSelectDetailIndex?.(next);
  }

  return (
    <div
      className={`min-w-0 rounded-2xl border border-[var(--color-border-strong)] bg-white ${
        tight ? "p-2.5" : compact ? "p-3" : "p-4 sm:p-5"
      }`}
      data-preserve-selection
    >
      <div>
        {playerName && (
          <p className="mb-1 truncate text-sm font-semibold text-stone-800">
            {playerEmoji && <span className="mr-1">{playerEmoji}</span>}
            {playerName}
          </p>
        )}
        {!hideTotalLabel && (
          <p className="text-caption text-xs uppercase tracking-wider">
            {t("score.total")}
          </p>
        )}
        <div
          className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${hideTotalLabel ? "" : "mt-1"}`}
        >
          <span
            className={`text-score ${tight ? "text-3xl" : compact ? "text-3xl" : "text-5xl"} ${tone}`}
          >
            {total}
          </span>
          {!hideScoreDenom && (
            <ScoreDenom className={tight ? "text-caption text-xs" : "text-caption"} />
          )}
          {rank != null && rankTotal != null && (
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
              {t("records.roomRank", {
                rank: String(rank),
                total: String(rankTotal),
              })}
            </span>
          )}
          <span className={`text-label text-sm ${tone}`}>{t(labelKey)}</span>
        </div>
      </div>

      <div className={`mt-3 grid gap-1.5 ${cellGridClass}`}>
        {details.map((d) => {
          const selected = selectedDetailIndex === d.index;
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => handleSelectDetail(d.index)}
              aria-pressed={selected}
              className={`min-w-0 rounded-lg bg-stone-50 text-left transition-all ${
                tight ? "p-1.5" : pairedLayout ? "p-2" : "p-3"
              } ${
                selected
                  ? "ring-1 ring-inset ring-stone-400"
                  : "ring-1 ring-inset ring-stone-200 hover:ring-stone-300"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-1 text-[10px] text-stone-500">
                <span className="truncate">{t("score.cellLabel", { n: d.index + 1 })}</span>
                <span className="shrink-0 font-mono font-medium text-stone-800">
                  {d.score}
                  {!hideScoreDenom && (
                    <span className="font-normal text-stone-500">/100</span>
                  )}
                </span>
              </div>
              <div className={`flex items-center justify-center ${tight ? "gap-1" : "gap-1.5 sm:gap-2"}`}>
                <div className="flex min-w-0 flex-col items-center gap-0.5">
                  <div
                    className={`rounded-sm ring-1 ring-inset ring-stone-300/90 ${swatchSize}`}
                    style={{ backgroundColor: d.target }}
                  />
                  <span className="whitespace-nowrap text-[9px] font-medium text-stone-500">
                    {t("score.targetSmall")}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col items-center gap-0.5">
                  <div
                    className={`rounded-sm ring-1 ring-inset ring-stone-300/90 ${swatchSize}`}
                    style={{ backgroundColor: d.guess }}
                  />
                  <span className="whitespace-nowrap text-[9px] font-medium text-stone-500">
                    {t("score.yoursSmall")}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-center font-mono text-[10px] text-stone-500">
                ΔE {d.deltaE.toFixed(1)}
              </p>
            </button>
          );
        })}
      </div>

      {onSelectDetailIndex && selectedDetailIndex === null && (
        <p className="text-caption mt-3 text-center text-xs">
          {t("score.tapToInspect")}
        </p>
      )}

      {!hideActions && (
        <div
          className={`mt-6 flex flex-col gap-2 ${
            compact
              ? ""
              : "sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3"
          }`}
        >
          <button
            type="button"
            onClick={onPlayAgain}
            disabled={playAgainBusy}
            className={`min-h-11 w-full rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1f1d1b] disabled:cursor-wait disabled:opacity-70 ${
              compact ? "" : "sm:w-auto"
            }`}
          >
            {playAgainBusy ? t("score.playAgainBusy") : t("score.playAgain")}
          </button>
          <button
            type="button"
            onClick={onNewPhoto}
            className={`text-body min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)] ${
              compact ? "" : "sm:w-auto"
            }`}
          >
            {t("score.newPhoto")}
          </button>
        </div>
      )}
    </div>
  );
}

export { ScoreDenom };
