import { useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, GameResult, Position } from "../types";
import type { RoomPublicView } from "../lib/roomTypes";
import { t, useLocale } from "../i18n";
import { useMobileImmersive, useMobileLandscapeLayout } from "../hooks/useMedia";
import { ColorGrid } from "./ColorGrid";
import { PhotoCanvasPicker } from "./PhotoCanvasPicker";
import { PhotoCanvasWithMarkers } from "./PhotoCanvasWithMarkers";
import { RoomPlayerStatus } from "./RoomPlayerStatus";
import { ScoreResult } from "./ScoreResult";
import { computeResult } from "../utils/scoring";
import { compressToThumbnail, createRecordId, saveRecord } from "../utils/storage";
import type { PersistedGameState } from "../utils/storage";

interface ColorGuessingGameProps {
  photoDataUrl: string;
  difficulty: Difficulty;
  targetColors: string[];
  targetPositions: Position[];
  initialGameState?: PersistedGameState;
  onGameStateChange?: (state: PersistedGameState) => void;
  onNewPhoto: () => void;
  onBackHome?: () => void;
  onPlayAgain: () => void;
  playAgainBusy?: boolean;
  onSaved?: () => void;
  mode?: "solo" | "room";
  hideScoreUntilReveal?: boolean;
  onRoomSubmit?: (payload: {
    userColors: string[];
    userPositions: Position[];
    totalScore: number;
    perCellScores: number[];
  }) => Promise<void>;
  onRoomProgress?: (filledCount: number) => void;
  roomStatus?: RoomPublicView;
}

function emptyPalette(count: number): string[] {
  return Array.from({ length: count }, () => "");
}

function emptyPositions(count: number): Position[] {
  return Array.from({ length: count }, () => ({ x: 0, y: 0 }));
}

function dimFromDifficulty(d: Difficulty): 1 | 2 | 3 | 4 {
  if (d === 1) return 1;
  if (d === 4) return 2;
  if (d === 9) return 3;
  return 4;
}

function nextEmptyIndex(colors: string[], after: number): number | null {
  for (let offset = 1; offset <= colors.length; offset++) {
    const index = (after + offset) % colors.length;
    if (!colors[index]) return index;
  }
  return null;
}

const DESKTOP_ZOOM_BAR = 60;
const MOBILE_SHELL = "fixed inset-0 z-40 overflow-hidden bg-[#f7f5f2]";
const DESKTOP_SHELL =
  "fixed inset-0 z-40 flex flex-row overflow-hidden bg-[#f7f5f2]";

export function ColorGuessingGame({
  photoDataUrl,
  difficulty,
  targetColors,
  targetPositions,
  initialGameState,
  onGameStateChange,
  onNewPhoto,
  onBackHome,
  onPlayAgain,
  playAgainBusy = false,
  onSaved,
  mode = "solo",
  hideScoreUntilReveal = false,
  onRoomSubmit,
  onRoomProgress,
  roomStatus,
}: ColorGuessingGameProps) {
  useLocale();
  const count = difficulty;
  const dim = dimFromDifficulty(difficulty);

  const initialPalette = useMemo(() => emptyPalette(count), [count]);
  const initialPositions = useMemo(() => emptyPositions(count), [count]);

  const [userColors, setUserColors] = useState<string[]>(
    () => initialGameState?.userColors ?? initialPalette,
  );
  const [userPositions, setUserPositions] = useState<Position[]>(
    () => initialGameState?.userPositions ?? initialPositions,
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(
    () => initialGameState?.activeIndex ?? 0,
  );
  const [result, setResult] = useState<GameResult | null>(
    () => initialGameState?.result ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resultDetailIndex, setResultDetailIndex] = useState<number | null>(
    null,
  );
  const photoSlotRef = useRef<HTMLDivElement>(null);
  const bottomChromeRef = useRef<HTMLDivElement>(null);
  const [photoMaxHeight, setPhotoMaxHeight] = useState<number | undefined>(
    undefined,
  );
  const mobileImmersive = useMobileImmersive();
  const mobileLandscapeLayout = useMobileLandscapeLayout();
  const mobileLandscape = mobileImmersive && mobileLandscapeLayout;
  const desktopLayout = !mobileImmersive;

  function renderRoomStatus(mode: "sidebar" | "overlay") {
    if (!roomStatus || submitted) return null;
    return <RoomPlayerStatus room={roomStatus} mode={mode} />;
  }

  function renderResultsHeader(compact = false) {
    return (
      <div
        className={`sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-stone-200/80 bg-[#f7f5f2]/95 backdrop-blur-sm ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        <div className="min-w-0">
          <h2 className={`text-title ${compact ? "text-base" : "text-lg"}`}>
            {t("score.resultsTitle")}
          </h2>
        </div>
        {onBackHome && (
          <button
            type="button"
            onClick={onBackHome}
            className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 sm:px-3 sm:text-sm"
          >
            {t("room.backHome")}
          </button>
        )}
      </div>
    );
  }

  function renderSoloScorePanel(opts?: { compactScore?: boolean; tightHeader?: boolean }) {
    if (!result) return null;
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderResultsHeader(opts?.tightHeader)}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 sm:px-4">
          {saveError && (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 ring-1 ring-amber-200">
              {saveError}
            </p>
          )}
          <ScoreResult
            result={result}
            onPlayAgain={onPlayAgain}
            playAgainBusy={playAgainBusy}
            onNewPhoto={onNewPhoto}
            selectedDetailIndex={resultDetailIndex}
            onSelectDetailIndex={setResultDetailIndex}
            compact={opts?.compactScore}
          />
        </div>
      </div>
    );
  }

  useEffect(() => {
    onGameStateChange?.({
      userColors,
      userPositions,
      activeIndex,
      result,
    });
  }, [userColors, userPositions, activeIndex, result, onGameStateChange]);

  const allFilled = userColors.every((c) => c);
  const submitted = result !== null;
  const pickEnabled = !submitted;
  const filledCount = userColors.filter((c) => c).length;

  useEffect(() => {
    if (mode !== "room" || submitted || !onRoomProgress) return;
    onRoomProgress(filledCount);
  }, [mode, submitted, filledCount, onRoomProgress]);

  useEffect(() => {
    if (!submitted) {
      setResultDetailIndex(null);
    }
  }, [submitted, result]);

  useEffect(() => {
    const update = () => {
      const slot = photoSlotRef.current;
      if (!slot) return;

      if (desktopLayout) {
        const slot = photoSlotRef.current;
        if (!slot) return;
        const bottomChrome = DESKTOP_ZOOM_BAR + 12;
        const next = Math.floor(slot.clientHeight - bottomChrome);
        setPhotoMaxHeight(Math.max(120, next));
        return;
      }

      setPhotoMaxHeight(Math.max(120, slot.clientHeight));
    };

    update();

    let ro: ResizeObserver | undefined;
    if (photoSlotRef.current) {
      ro = new ResizeObserver(update);
      ro.observe(photoSlotRef.current);
    }

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [submitted, desktopLayout, mobileLandscape]);

  function renderPhotoCanvas() {
    if (submitted) {
      return (
        <PhotoCanvasWithMarkers
          photoDataUrl={photoDataUrl}
          targetColors={targetColors}
          userColors={userColors}
          targetPositions={targetPositions}
          userPositions={userPositions}
          maxHeightLimit={photoMaxHeight}
          fillContainer
          compact={mobileImmersive}
          selectedIndex={resultDetailIndex}
          onSelectedIndexChange={setResultDetailIndex}
        />
      );
    }

    return (
      <PhotoCanvasPicker
        photoDataUrl={photoDataUrl}
        enabled={pickEnabled}
        onPick={handlePick}
        maxHeightLimit={photoMaxHeight}
        fillContainer
        overlayControls={mobileImmersive}
      />
    );
  }

  function renderActionButtons(mobile = false, vertical = false) {
    return (
      <div
        className={`flex w-full gap-2 ${
          vertical
            ? "mx-auto max-w-44 flex-col"
            : mobile
              ? "flex-row"
              : "max-w-lg flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
        }`}
        onClick={(e) => e.stopPropagation()}
        data-preserve-selection
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allFilled || saving}
          className={`min-h-11 rounded-lg font-medium shadow-sm transition-colors ${
            vertical
              ? "flex w-full flex-col items-center justify-center gap-0.5 px-3 py-2 text-sm"
              : mobile
                ? "flex-1 px-4 py-2.5 text-sm"
                : "w-full px-4 py-2.5 text-sm sm:w-auto"
          } ${
            allFilled && !saving
              ? "bg-stone-800 text-white hover:bg-stone-700"
              : "cursor-not-allowed bg-stone-200 text-stone-400"
          }`}
        >
          <span>{t("game.submit")}</span>
          {!allFilled && (
            <span className={vertical ? "text-[10px] font-normal opacity-90" : ""}>
              ({filledCount}/{count})
            </span>
          )}
          {allFilled && saving && <span>…</span>}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className={`min-h-11 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 ${
            vertical
              ? "w-full px-3 py-2 text-sm"
              : mobile
                ? "shrink-0"
                : "w-full sm:w-auto"
          }`}
          disabled={filledCount === 0}
        >
          {mobile || vertical ? t("game.clear") : t("game.clearLong")}
        </button>
        {mode === "solo" && (
        <button
          type="button"
          onClick={onNewPhoto}
          className={`min-h-11 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 ${
            vertical
              ? "w-full px-3 py-2 text-sm"
              : mobile
                ? "shrink-0"
                : "w-full sm:w-auto"
          }`}
        >
          {mobile || vertical ? t("game.newPhoto") : t("game.newPhotoLong")}
        </button>
        )}
      </div>
    );
  }

  function handlePick(hex: string, pos: Position) {
    if (submitted) return;
    if (activeIndex === null) return;

    const updatedColors = [...userColors];
    updatedColors[activeIndex] = hex;
    setUserColors(updatedColors);

    const updatedPositions = [...userPositions];
    updatedPositions[activeIndex] = pos;
    setUserPositions(updatedPositions);

    const next = nextEmptyIndex(updatedColors, activeIndex);
    if (next !== null) {
      setActiveIndex(next);
    }
  }

  function handleBackgroundPointerDown(e: React.PointerEvent) {
    if (submitted) return;
    if ((e.target as HTMLElement).closest("[data-preserve-selection]")) return;
    setActiveIndex(null);
  }

  function handleSelectTarget(index: number) {
    if (submitted) return;
    setActiveIndex(index);
  }

  function handleSelectUserCell(index: number) {
    if (submitted) return;
    setActiveIndex(index);
  }

  function handleClearCell(index: number) {
    if (submitted) return;
    const updatedColors = [...userColors];
    updatedColors[index] = "";
    setUserColors(updatedColors);

    const updatedPositions = [...userPositions];
    updatedPositions[index] = { x: 0, y: 0 };
    setUserPositions(updatedPositions);

    setActiveIndex(index);
  }

  async function handleSubmit() {
    if (!allFilled || submitted || saving) return;

    const gameResult = computeResult(
      targetColors,
      userColors,
      targetPositions,
      userPositions,
    );

    if (mode === "room" && onRoomSubmit) {
      setSaving(true);
      setSaveError(null);
      try {
        await onRoomSubmit({
          userColors,
          userPositions,
          totalScore: gameResult.total,
          perCellScores: gameResult.details.map((d) => d.score),
        });
      } catch {
        setSaveError(t("game.saveErrorGeneric"));
      } finally {
        setSaving(false);
      }
      return;
    }

    setResult(gameResult);
    setSaving(true);
    setSaveError(null);

    try {
      const thumb = await compressToThumbnail(photoDataUrl);
      const { ok } = saveRecord({
        id: createRecordId(),
        createdAt: Date.now(),
        difficulty,
        thumbnailDataUrl: thumb,
        targetColors,
        userColors,
        targetPositions,
        userPositions,
        totalScore: gameResult.total,
        perCellScores: gameResult.details.map((d) => d.score),
      });
      if (ok) {
        onSaved?.();
      } else {
        setSaveError(t("game.saveErrorWrite"));
      }
    } catch {
      setSaveError(t("game.saveErrorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setUserColors(emptyPalette(count));
    setUserPositions(emptyPositions(count));
    setActiveIndex(0);
    setResult(null);
    setSaveError(null);
  }

  function renderPickingHint(className = "text-center text-[11px] leading-snug text-stone-500") {
    if (submitted) return null;

    return (
      <p
        className={className}
        style={{ visibility: activeIndex === null ? "hidden" : "visible" }}
        aria-hidden={activeIndex === null}
      >
        {t("game.fillingHint", { n: (activeIndex ?? 0) + 1 })}
        {activeIndex !== null && userColors[activeIndex] && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearCell(activeIndex);
            }}
            className="ml-2 text-stone-400 underline"
          >
            {t("game.clearCell")}
          </button>
        )}
      </p>
    );
  }

  function renderSidebarGameLayout(
    sidebarWidth: string,
    rootClassName: string,
  ) {
    const showResults = submitted && result && !hideScoreUntilReveal;

    if (showResults) {
      return (
        <div
          className={rootClassName}
          onPointerDownCapture={handleBackgroundPointerDown}
        >
          <div
            ref={photoSlotRef}
            className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-stone-900/5"
          >
            {renderPhotoCanvas()}
          </div>
          <div className="flex h-full w-[min(48%,20rem)] shrink-0 flex-col overflow-hidden border-l border-stone-200/80 bg-[#f7f5f2]">
            {renderSoloScorePanel({ compactScore: true, tightHeader: true })}
          </div>
        </div>
      );
    }

    const sidebarStyle = {
      flex: `0 0 ${sidebarWidth}`,
      width: sidebarWidth,
      minWidth: sidebarWidth,
      maxWidth: sidebarWidth,
    } as const;

    return (
      <div
        className={rootClassName}
        onPointerDownCapture={handleBackgroundPointerDown}
      >
        <div
          style={sidebarStyle}
          className="flex h-full shrink-0 grow-0 flex-col overflow-hidden border-r border-stone-200/80 bg-white/95 backdrop-blur-sm"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden py-1.5 pl-[max(0.5rem,env(safe-area-inset-left))] pr-1.5 pt-[max(0.35rem,env(safe-area-inset-top))]">
            <ColorGrid
              colors={targetColors}
              dim={dim}
              variant="sidebar"
              label={t("game.target")}
              selectedIndex={activeIndex}
              onSelectCell={submitted ? undefined : handleSelectTarget}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-stone-900/5">
          <div
            ref={photoSlotRef}
            className="relative min-h-0 flex-1 overflow-hidden"
          >
            {renderRoomStatus("overlay")}
            {renderPhotoCanvas()}
          </div>
        </div>

        <div
          ref={bottomChromeRef}
          style={sidebarStyle}
          className="flex h-full shrink-0 grow-0 flex-col overflow-hidden border-l border-stone-200/80 bg-white/95 backdrop-blur-sm"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-x-hidden py-1.5 pl-1.5 pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.35rem,env(safe-area-inset-top))]">
            <ColorGrid
              colors={userColors}
              dim={dim}
              variant="sidebar"
              label={t("game.yoursCount", { filled: filledCount, count })}
              selectedIndex={activeIndex}
              onSelectCell={submitted ? undefined : handleSelectUserCell}
              allowEmpty
              selectedTone="amber"
              className="min-h-0 flex-1"
            />

            {!submitted && renderActionButtons(true, true)}
          </div>
        </div>
      </div>
    );
  }

  function renderDesktopMarkerLegend() {
    if (!submitted) return null;

    return (
      <p className="shrink-0 px-4 pt-2 pb-4 text-center text-xs text-stone-500">
        {t("game.legend")}
      </p>
    );
  }

  function renderDesktopLayout() {
    return (
      <div
        className={DESKTOP_SHELL}
        onPointerDownCapture={handleBackgroundPointerDown}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-stone-900/5 pt-3">
          <div
            ref={photoSlotRef}
            className="relative min-h-0 flex-1 overflow-hidden"
          >
            {renderPhotoCanvas()}
          </div>
          {renderDesktopMarkerLegend()}
        </div>

        <div className="flex w-[clamp(18rem,32vw,24rem)] shrink-0 flex-col border-l border-stone-200/50 bg-[#f7f5f2]">
          {submitted && result && !hideScoreUntilReveal ? (
            renderSoloScorePanel({ compactScore: true })
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-2 px-4 py-6">
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                <ColorGrid
                  colors={targetColors}
                  dim={dim}
                  variant="flank"
                  label={t("game.target")}
                  selectedIndex={activeIndex}
                  onSelectCell={handleSelectTarget}
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
                <ColorGrid
                  colors={userColors}
                  dim={dim}
                  variant="flank"
                  label={t("game.yoursCount", { filled: filledCount, count })}
                  selectedIndex={activeIndex}
                  onSelectCell={handleSelectUserCell}
                  allowEmpty
                  selectedTone="amber"
                />
                {renderPickingHint("text-center text-xs leading-snug text-stone-500")}
              </div>

              {roomStatus && (
                <div className="shrink-0 px-1">{renderRoomStatus("sidebar")}</div>
              )}

              <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                {renderActionButtons(true, true)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mobileImmersive) {
    if (mobileLandscape) {
      return renderSidebarGameLayout("7rem", `${MOBILE_SHELL} flex flex-row`);
    }

    const showResults = submitted && result && !hideScoreUntilReveal;

    if (showResults) {
      return (
        <div
          className={`${MOBILE_SHELL} flex flex-col`}
          onPointerDownCapture={handleBackgroundPointerDown}
        >
          <div
            ref={photoSlotRef}
            className="relative min-h-0 w-full flex-1 overflow-hidden bg-stone-900/5"
          >
            {renderPhotoCanvas()}
          </div>
          <div
            ref={bottomChromeRef}
            className="flex max-h-[55vh] min-h-0 shrink-0 flex-col overflow-hidden border-t border-stone-200/80 bg-[#f7f5f2]"
          >
            {renderSoloScorePanel({ compactScore: true, tightHeader: true })}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${MOBILE_SHELL} flex flex-col`}
        onPointerDownCapture={handleBackgroundPointerDown}
      >
        <div className="shrink-0 border-b border-stone-200/80 bg-white/95 px-[max(0.75rem,env(safe-area-inset-left))] py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-sm pr-[max(0.75rem,env(safe-area-inset-right))]">
          <ColorGrid
            colors={targetColors}
            dim={dim}
            variant="toolbar"
            label={t("game.target")}
            selectedIndex={activeIndex}
            onSelectCell={handleSelectTarget}
          />
          {!mobileLandscapeLayout && renderPickingHint("mt-1.5 text-[11px] text-stone-500")}
        </div>

        <div
          ref={photoSlotRef}
          className="relative min-h-0 w-full flex-1 overflow-hidden bg-stone-900/5"
        >
          {renderPhotoCanvas()}
        </div>

        <div
          ref={bottomChromeRef}
          className="shrink-0 space-y-1.5 border-t border-stone-200/80 bg-white/95 px-[max(0.75rem,env(safe-area-inset-left))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-sm pr-[max(0.75rem,env(safe-area-inset-right))]"
        >
          <ColorGrid
            colors={userColors}
            dim={dim}
            variant="toolbar"
            label={t("game.yoursCount", { filled: filledCount, count })}
            selectedIndex={activeIndex}
            onSelectCell={handleSelectUserCell}
            allowEmpty
            selectedTone="amber"
          />

          {roomStatus && (
            <div className="shrink-0">{renderRoomStatus("sidebar")}</div>
          )}

          {renderActionButtons(true)}
        </div>
      </div>
    );
  }

  return renderDesktopLayout();
}
