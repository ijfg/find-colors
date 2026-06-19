import { useState } from "react";
import type { Difficulty, GameRecord } from "../types";
import { t, useLocale } from "../i18n";
import { ColorGrid } from "./ColorGrid";
import { PhotoCanvasWithMarkers } from "./PhotoCanvasWithMarkers";

interface RecordsViewProps {
  records: GameRecord[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function difficultyLabel(d: Difficulty): string {
  if (d === 1) return t("difficulty.one");
  if (d === 4) return t("difficulty.four");
  if (d === 9) return t("difficulty.nine");
  return t("difficulty.sixteen");
}

function dimFromDifficulty(d: Difficulty): 1 | 2 | 3 | 4 {
  if (d === 1) return 1;
  if (d === 4) return 2;
  if (d === 9) return 3;
  return 4;
}

function scoreTone(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-teal-600";
  if (score >= 60) return "text-amber-600";
  return "text-stone-700";
}

export function RecordsView({
  records,
  onBack,
  onDelete,
  onClearAll,
}: RecordsViewProps) {
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortByScore, setSortByScore] = useState(false);

  const sorted = sortByScore
    ? [...records].sort((a, b) => b.totalScore - a.totalScore)
    : records;

  const dateLocale =
    locale === "zh-Hant" ? "zh-TW" : locale === "zh-Hans" ? "zh-CN" : "en-US";

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(t("records.confirmDelete"))) {
      onDelete(id);
      if (expandedId === id) setExpandedId(null);
    }
  }

  function handleClearAll() {
    if (confirm(t("records.confirmClearAll"))) {
      onClearAll();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-stone-600 hover:text-stone-800"
        >
          ← {t("records.back")}
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSortByScore((v) => !v)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-300 hover:bg-stone-50"
          >
            {sortByScore ? t("records.sortByTime") : t("records.sortByScore")}
          </button>
          {records.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-rose-500 ring-1 ring-rose-200 hover:bg-rose-50"
            >
              {t("records.clearAll")}
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <p className="py-12 text-center text-stone-400">{t("records.empty")}</p>
      ) : (
        <div className="mx-auto max-w-2xl space-y-3">
          {sorted.map((rec) => {
            const expanded = expandedId === rec.id;
            const dim = dimFromDifficulty(rec.difficulty);

            return (
              <div
                key={rec.id}
                className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-stone-200"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedId(expanded ? null : rec.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedId(expanded ? null : rec.id);
                    }
                  }}
                  className="flex w-full cursor-pointer items-center gap-4 p-4 text-left hover:bg-stone-50/80"
                >
                  <img
                    src={rec.thumbnailDataUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-score text-3xl ${scoreTone(rec.totalScore)}`}
                      >
                        {rec.totalScore}
                      </span>
                      <span className="text-sm text-stone-400">/ 100</span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                        {difficultyLabel(rec.difficulty)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-400">
                      {new Date(rec.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(rec.id, e)}
                    className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-rose-500"
                    aria-label={t("records.deleteAria")}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {expanded && (
                  <div className="border-t border-stone-100 p-4">
                    <div className="space-y-4">
                      <PhotoCanvasWithMarkers
                        photoDataUrl={rec.thumbnailDataUrl}
                        targetColors={rec.targetColors}
                        userColors={rec.userColors}
                        targetPositions={rec.targetPositions}
                        userPositions={rec.userPositions}
                      />
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
                        <ColorGrid
                          colors={rec.targetColors}
                          dim={dim}
                          size="md"
                          label={t(
                            rec.difficulty === 1
                              ? "records.targetColor"
                              : "records.targetColors",
                          )}
                        />
                        <ColorGrid
                          colors={rec.userColors}
                          dim={dim}
                          size="md"
                          label={t(
                            rec.difficulty === 1
                              ? "records.yourColor"
                              : "records.yourColors",
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {rec.perCellScores.map((score, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-stone-50 p-2 text-center text-xs ring-1 ring-stone-200"
                          >
                            <span className="text-stone-400">
                              {t("records.cellLabel", { n: i + 1 })}
                            </span>
                            <span className="ml-2 font-mono font-medium text-stone-700">
                              {score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
