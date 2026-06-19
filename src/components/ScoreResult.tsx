import type { GameResult } from "../types";

interface ScoreResultProps {
  result: GameResult;
  onPlayAgain: () => void;
  playAgainBusy?: boolean;
  onNewPhoto: () => void;
  selectedDetailIndex?: number | null;
  onSelectDetailIndex?: (index: number | null) => void;
  compact?: boolean;
}

function rating(score: number): { label: string; tone: string } {
  if (score >= 90) return { label: "色感大师", tone: "text-emerald-600" };
  if (score >= 75) return { label: "眼力不错", tone: "text-teal-600" };
  if (score >= 60) return { label: "还可以", tone: "text-amber-600" };
  if (score >= 40) return { label: "再练练", tone: "text-orange-500" };
  return { label: "差得有点远", tone: "text-rose-500" };
}

export function ScoreResult({
  result,
  onPlayAgain,
  playAgainBusy = false,
  onNewPhoto,
  selectedDetailIndex = null,
  onSelectDetailIndex,
  compact = false,
}: ScoreResultProps) {
  const { total, details } = result;
  const { label, tone } = rating(total);

  function handleSelectDetail(index: number) {
    const next = selectedDetailIndex === index ? null : index;
    onSelectDetailIndex?.(next);
  }

  return (
    <div
      className={`rounded-2xl border border-[var(--color-border-strong)] bg-white ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
      data-preserve-selection
    >
      <div>
        <p className="text-caption text-xs uppercase tracking-wider">总分</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={`text-score ${compact ? "text-4xl" : "text-5xl"} ${tone}`}>
            {total}
          </span>
          <span className="text-caption">/ 100</span>
          <span className={`text-label ml-3 text-sm ${tone}`}>{label}</span>
        </div>
      </div>

      <div
        className={`mt-5 grid grid-cols-2 gap-3 ${
          compact ? "" : "sm:grid-cols-4"
        }`}
      >
        {details.map((d) => {
          const selected = selectedDetailIndex === d.index;
          return (
            <button
              key={d.index}
              type="button"
              onClick={() => handleSelectDetail(d.index)}
              aria-pressed={selected}
              className={`rounded-lg bg-white p-3 text-left transition-all ${
                selected
                  ? "ring-1 ring-inset ring-stone-400"
                  : "ring-1 ring-inset ring-stone-200 hover:ring-stone-300"
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-xs text-stone-400">
                <span>第 {d.index + 1} 格</span>
                <span className="font-mono font-medium text-stone-700">
                  {d.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-10 w-full rounded-sm ring-1 ring-inset ring-stone-200/80"
                    style={{ backgroundColor: d.target }}
                  />
                  <span className="text-[10px] text-stone-400">目标</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-10 w-full rounded-sm ring-1 ring-inset ring-stone-200/80"
                    style={{ backgroundColor: d.guess }}
                  />
                  <span className="text-[10px] text-stone-400">你的</span>
                </div>
              </div>
              <p className="mt-2 text-center font-mono text-[11px] text-stone-400">
                ΔE {d.deltaE.toFixed(1)}
              </p>
            </button>
          );
        })}
      </div>

      {onSelectDetailIndex && selectedDetailIndex === null && (
        <p className="text-caption mt-3 text-center text-xs">
          点击某一格，在照片上查看局部对比
        </p>
      )}

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
          {playAgainBusy ? "生成中…" : "再玩一次"}
        </button>
        <button
          type="button"
          onClick={onNewPhoto}
          className={`text-body min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)] ${
            compact ? "" : "sm:w-auto"
          }`}
        >
          换一张照片
        </button>
      </div>
    </div>
  );
}
