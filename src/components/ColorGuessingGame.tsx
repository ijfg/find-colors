import { useEffect, useMemo, useRef, useState } from "react";
import type { Difficulty, GameResult, Position } from "../types";
import { useMediaQuery, useMobileImmersive } from "../hooks/useMedia";
import { ColorGrid } from "./ColorGrid";
import { PhotoCanvasPicker } from "./PhotoCanvasPicker";
import { PhotoCanvasWithMarkers } from "./PhotoCanvasWithMarkers";
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
  onPlayAgain: () => void;
  playAgainBusy?: boolean;
  onSaved?: () => void;
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

function gridSizeForDifficulty(d: Difficulty): "sm" | "md" {
  return d === 1 || d === 4 ? "sm" : "md";
}

const ZOOM_CONTROLS_HEIGHT = 44;
const ZOOM_CONTROLS_HEIGHT_COMPACT = 52;
const PHOTO_BOTTOM_GAP = 8;
const PORTRAIT_MIN_HEIGHT_RATIO = 0.72;
const LANDSCAPE_MIN_HEIGHT_RATIO = 0.58;

export function ColorGuessingGame({
  photoDataUrl,
  difficulty,
  targetColors,
  targetPositions,
  initialGameState,
  onGameStateChange,
  onNewPhoto,
  onPlayAgain,
  playAgainBusy = false,
  onSaved,
}: ColorGuessingGameProps) {
  const count = difficulty;
  const dim = dimFromDifficulty(difficulty);
  const gridSize = gridSizeForDifficulty(difficulty);

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
  const [imageAspect, setImageAspect] = useState<number | null>(null);
  const mobileImmersive = useMobileImmersive();
  const landscapePhone = useMediaQuery("(max-height: 520px)");
  const mobileLandscape = mobileImmersive && landscapePhone;

  useEffect(() => {
    onGameStateChange?.({
      userColors,
      userPositions,
      activeIndex,
      result,
    });
  }, [userColors, userPositions, activeIndex, result, onGameStateChange]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageAspect(img.naturalWidth / img.naturalHeight);
    };
    img.src = photoDataUrl;
  }, [photoDataUrl]);

  const allFilled = userColors.every((c) => c);
  const submitted = result !== null;
  const pickEnabled = !submitted;
  const filledCount = userColors.filter((c) => c).length;

  useEffect(() => {
    if (!submitted) {
      setResultDetailIndex(null);
    }
  }, [submitted, result]);

  useEffect(() => {
    const update = () => {
      if (mobileImmersive) {
        const slot = photoSlotRef.current;
        if (!slot) return;
        const zoomBar =
          submitted || mobileImmersive ? 0 : ZOOM_CONTROLS_HEIGHT_COMPACT;
        setPhotoMaxHeight(Math.max(120, slot.clientHeight - zoomBar));
        return;
      }

      const top = photoSlotRef.current?.getBoundingClientRect().top ?? 120;
      const bottomH = bottomChromeRef.current?.offsetHeight ?? 0;
      const zoomBar = submitted ? 0 : ZOOM_CONTROLS_HEIGHT;
      const dynamicMax =
        window.innerHeight - top - bottomH - zoomBar - PHOTO_BOTTOM_GAP;

      const isPortrait = imageAspect !== null && imageAspect < 0.92;
      const ratioMax =
        window.innerHeight *
        (isPortrait ? PORTRAIT_MIN_HEIGHT_RATIO : LANDSCAPE_MIN_HEIGHT_RATIO);

      setPhotoMaxHeight(Math.max(160, ratioMax, dynamicMax));
    };

    update();
    const ro = new ResizeObserver(update);
    if (photoSlotRef.current) ro.observe(photoSlotRef.current);
    if (bottomChromeRef.current) ro.observe(bottomChromeRef.current);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [
    submitted,
    result,
    filledCount,
    activeIndex,
    count,
    allFilled,
    imageAspect,
    mobileImmersive,
    mobileLandscape,
  ]);

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
          fillContainer={mobileImmersive}
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
        onPreviewPick={handlePick}
        maxHeightLimit={photoMaxHeight}
        fillContainer={mobileImmersive}
        overlayControls={mobileImmersive}
      />
    );
  }

  function renderActionButtons(mobile = false, vertical = false) {
    return (
      <div
        className={`flex w-full gap-2 ${
          vertical
            ? "flex-col overflow-x-hidden"
            : mobile
              ? "flex-row"
              : "max-w-lg flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allFilled || saving}
          className={`min-h-11 rounded-lg font-medium shadow-sm transition-colors ${
            vertical
              ? "flex w-full flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs"
              : mobile
                ? "flex-1 px-4 py-2.5 text-sm"
                : "w-full px-4 py-2.5 text-sm sm:w-auto"
          } ${
            allFilled && !saving
              ? "bg-stone-800 text-white hover:bg-stone-700"
              : "cursor-not-allowed bg-stone-200 text-stone-400"
          }`}
        >
          <span>提交</span>
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
              ? "w-full px-2 py-2 text-xs"
              : mobile
                ? "shrink-0"
                : "w-full sm:w-auto"
          }`}
          disabled={filledCount === 0}
        >
          {mobile || vertical ? "清空" : "清空重填"}
        </button>
        <button
          type="button"
          onClick={onNewPhoto}
          className={`min-h-11 rounded-lg bg-white px-3 py-2 text-sm font-medium text-stone-600 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 ${
            vertical
              ? "w-full px-2 py-2 text-xs"
              : mobile
                ? "shrink-0"
                : "w-full sm:w-auto"
          }`}
        >
          {mobile || vertical ? "换图" : "换一张照片"}
        </button>
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
  }

  function handleClearSelection() {
    if (submitted) return;
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
        setSaveError("得分已显示，但记录未能写入（可能是浏览器存储空间不足）。");
      }
    } catch {
      setSaveError("得分已显示，但保存记录时出错。");
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

  if (mobileImmersive) {
    const sidebarStyle = {
      flex: "0 0 7rem",
      width: "7rem",
      minWidth: "7rem",
      maxWidth: "7rem",
    } as const;

    if (mobileLandscape) {
      return (
        <div
          className="fixed inset-0 z-40 flex flex-row overflow-hidden bg-[#f7f5f2]"
          onClick={handleClearSelection}
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
                label="目标"
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
              {renderPhotoCanvas()}
            </div>
            {submitted && result && (
              <div className="max-h-[42vh] shrink-0 overflow-y-auto overscroll-y-contain border-t border-stone-200/80 bg-white/95 p-2 touch-pan-y">
                {saveError && (
                  <p className="mb-2 rounded-lg bg-amber-50 px-2 py-1.5 text-center text-[10px] leading-snug text-amber-800 ring-1 ring-amber-200">
                    {saveError}
                  </p>
                )}
                <div className="[&_.text-score]:text-3xl [&_.rounded-2xl]:rounded-xl [&_button]:text-xs">
                  <ScoreResult
                    result={result}
                    onPlayAgain={onPlayAgain}
                    playAgainBusy={playAgainBusy}
                    onNewPhoto={onNewPhoto}
                    selectedDetailIndex={resultDetailIndex}
                    onSelectDetailIndex={setResultDetailIndex}
                  />
                </div>
              </div>
            )}
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
                label={`你的 (${filledCount}/${count})`}
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

    return (
      <div
        className="fixed inset-0 z-40 flex flex-col bg-[#f7f5f2]"
        onClick={handleClearSelection}
      >
        <div className="shrink-0 border-b border-stone-200/80 bg-white/95 px-[max(0.75rem,env(safe-area-inset-left))] py-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-sm pr-[max(0.75rem,env(safe-area-inset-right))]">
          <ColorGrid
            colors={targetColors}
            dim={dim}
            variant="toolbar"
            label="目标"
            selectedIndex={activeIndex}
            onSelectCell={submitted ? undefined : handleSelectTarget}
          />
          {!submitted && activeIndex !== null && !landscapePhone && (
            <p className="mt-1.5 text-[11px] text-stone-500">
              正在填第 {activeIndex + 1} 格 · 在照片里点击取色
              {userColors[activeIndex] && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearCell(activeIndex);
                  }}
                  className="ml-2 text-stone-400 underline"
                >
                  清除
                </button>
              )}
            </p>
          )}
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
            label={`你的 (${filledCount}/${count})`}
            selectedIndex={activeIndex}
            onSelectCell={submitted ? undefined : handleSelectUserCell}
            allowEmpty
            selectedTone="amber"
          />

          {!submitted && renderActionButtons(true)}

          {submitted && result && (
            <div className="max-h-[32vh] space-y-2 overflow-y-auto overscroll-y-contain p-1">
              {saveError && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 ring-1 ring-amber-200">
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
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col gap-3"
      onClick={handleClearSelection}
    >
      <div ref={photoSlotRef}>{renderPhotoCanvas()}</div>

      <div ref={bottomChromeRef} className="flex flex-col gap-3">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-6">
          <ColorGrid
            colors={targetColors}
            dim={dim}
            size={gridSize}
            label="目标色"
            selectedIndex={activeIndex}
            onSelectCell={submitted ? undefined : handleSelectTarget}
          />
          <ColorGrid
            colors={userColors}
            dim={dim}
            size={gridSize}
            label={`你的色 (${filledCount}/${count})`}
            selectedIndex={activeIndex}
            onSelectCell={submitted ? undefined : handleSelectUserCell}
            allowEmpty
            selectedTone="amber"
          />
        </div>

        {!submitted && (
          <div className="flex flex-col items-center gap-3">
            {activeIndex !== null ? (
              <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-stone-600 shadow-sm ring-1 ring-stone-200 backdrop-blur-sm">
                <span>正在填第</span>
                <span className="font-mono text-stone-800">
                  {activeIndex + 1}
                </span>
                <span>格</span>
                <span
                  className="inline-block h-5 w-5 rounded ring-1 ring-stone-300"
                  style={{ backgroundColor: targetColors[activeIndex] }}
                />
                {userColors[activeIndex] && (
                  <button
                    type="button"
                    onClick={() => handleClearCell(activeIndex)}
                    className="min-h-11 rounded-full px-3 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700"
                  >
                    清除此格
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">
                点击色块选择要填的格子 · 在照片里点击取色
              </p>
            )}

            {renderActionButtons(false)}
          </div>
        )}

        {submitted && result && (
          <>
            {saveError && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800 ring-1 ring-amber-200">
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
            />
          </>
        )}
      </div>
    </div>
  );
}
