import { useEffect, useRef, useState } from "react";
import type { Position } from "../types";
import { useCoarsePointer } from "../hooks/useMedia";
import { t, useLocale } from "../i18n";
import { hexToRgb } from "../utils/colorExtract";
import {
  computePhotoCanvasLayout,
  drawCenteredCrop,
  drawCropCrosshair,
  drawPhotoToCanvas,
} from "../utils/photoCanvas";

interface PhotoCanvasWithMarkersProps {
  photoDataUrl: string;
  targetColors: string[];
  userColors: string[];
  targetPositions: Position[];
  userPositions: Position[];
  maxHeightLimit?: number;
  fillContainer?: boolean;
  compact?: boolean;
  selectedIndex?: number | null;
  onSelectedIndexChange?: (index: number | null) => void;
  ghostPlayers?: Array<{
    playerId: string;
    colorIndex: number;
    userColors: string[];
    userPositions: Position[];
  }>;
}

const MAX_VIEWPORT_HEIGHT_RATIO = 0.72;
const CROP_RADIUS = 22;
const CROP_DISPLAY = 96;
const COMPACT_CROP_DISPLAY = 88;
const HIT_LINE_WIDTH = 14;
const HIT_CIRCLE_R = 22;
const LIGHT_LUM_THRESHOLD = 140;
const DARK_STROKE = "#1c1917";
const LIGHT_STROKE = "#ffffff";
const COLOR_SIMILAR_LUM_DELTA = 28;
const PHOTO_LUM_UNIFY_DELTA = 30;
const STROKE_VISIBILITY_MARGIN = 18;

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function strokeForLuminance(lum: number): string {
  return lum > LIGHT_LUM_THRESHOLD ? DARK_STROKE : LIGHT_STROKE;
}

function contrastStroke(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return strokeForLuminance(relativeLuminance(r, g, b));
}

function colorLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return relativeLuminance(r, g, b);
}

function colorsAreSimilar(a: string, b: string): boolean {
  return Math.abs(colorLuminance(a) - colorLuminance(b)) < COLOR_SIMILAR_LUM_DELTA;
}

function strokeWorksOnBackground(stroke: string, bgLum: number): boolean {
  if (stroke === DARK_STROKE) {
    return bgLum >= LIGHT_LUM_THRESHOLD - STROKE_VISIBILITY_MARGIN;
  }
  return bgLum <= LIGHT_LUM_THRESHOLD + STROKE_VISIBILITY_MARGIN;
}

function resolvePairStrokes(
  targetLum: number | null,
  guessLum: number | null,
  targetColor: string,
  userColor: string,
): { targetStroke: string; guessStroke: string; linkStroke: string } {
  const tLum = targetLum ?? colorLuminance(targetColor);
  const gLum = guessLum ?? colorLuminance(userColor);
  const avgLum = (tLum + gLum) / 2;
  const unified = strokeForLuminance(avgLum);

  if (
    colorsAreSimilar(targetColor, userColor) ||
    Math.abs(tLum - gLum) < PHOTO_LUM_UNIFY_DELTA
  ) {
    return {
      targetStroke: unified,
      guessStroke: unified,
      linkStroke: unified,
    };
  }

  const targetStroke = strokeForLuminance(tLum);
  const guessStroke = strokeForLuminance(gLum);

  if (targetStroke === guessStroke) {
    return { targetStroke, guessStroke, linkStroke: unified };
  }

  const targetOk = strokeWorksOnBackground(unified, tLum);
  const guessOk = strokeWorksOnBackground(unified, gLum);
  if (targetOk && guessOk) {
    return {
      targetStroke: unified,
      guessStroke: unified,
      linkStroke: unified,
    };
  }

  return {
    targetStroke: targetOk ? unified : targetStroke,
    guessStroke: guessOk ? unified : guessStroke,
    linkStroke: unified,
  };
}

function samplePhotoLuminance(
  source: HTMLCanvasElement,
  cx: number,
  cy: number,
): number | null {
  const ctx = source.getContext("2d");
  if (!ctx) return null;
  const x = Math.max(0, Math.min(source.width - 1, Math.round(cx)));
  const y = Math.max(0, Math.min(source.height - 1, Math.round(cy)));
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  return relativeLuminance(r, g, b);
}

function readableText(hex: string): string {
  return contrastStroke(hex) === DARK_STROKE ? DARK_STROKE : LIGHT_STROKE;
}

import { getPlayerColor } from "../lib/playerColors";

function drawCropCanvas(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  cx: number,
  cy: number,
  hex: string,
  overlayStroke: string,
  displaySize = CROP_DISPLAY,
) {
  const radius = Math.max(
    14,
    Math.round(Math.min(source.width, source.height) * 0.035),
    CROP_RADIUS,
  );
  const ctx = drawCenteredCrop(canvas, source, cx, cy, radius, displaySize);
  if (!ctx) return;
  drawCropCrosshair(ctx, displaySize, hex, overlayStroke);
}

interface MarkerPairProps {
  index: number;
  w: number;
  h: number;
  targetPos: Position;
  guessPos: Position;
  targetColor: string;
  userColor: string;
  targetStroke: string;
  guessStroke: string;
  linkStroke: string;
  active: boolean;
  dim: boolean;
  hitRadius: number;
  hitLineWidth: number;
  onTap: (index: number) => void;
}

function MarkerPair({
  index,
  w,
  h,
  targetPos,
  guessPos,
  targetColor,
  userColor,
  targetStroke,
  guessStroke,
  linkStroke,
  active,
  dim,
  hitRadius,
  hitLineWidth,
  onTap,
}: MarkerPairProps) {
  const tx = targetPos.x * w;
  const ty = targetPos.y * h;
  const ux = guessPos.x * w;
  const uy = guessPos.y * h;

  const targetR = active ? 12 : 9;
  const guessR = active ? 11 : 8;

  return (
    <g
      opacity={dim ? 0.14 : 1}
      onPointerUp={(e) => {
        e.stopPropagation();
        onTap(index);
      }}
      style={{ cursor: "pointer", touchAction: "manipulation" }}
    >
      <line
        x1={tx}
        y1={ty}
        x2={ux}
        y2={uy}
        stroke="transparent"
        strokeWidth={hitLineWidth}
        pointerEvents="stroke"
      />
      <circle
        cx={tx}
        cy={ty}
        r={hitRadius}
        fill="transparent"
        pointerEvents="all"
      />
      <circle
        cx={ux}
        cy={uy}
        r={hitRadius}
        fill="transparent"
        pointerEvents="all"
      />

      <line
        x1={tx}
        y1={ty}
        x2={ux}
        y2={uy}
        stroke={linkStroke}
        strokeOpacity={active ? 0.95 : 0.55}
        strokeWidth={active ? 2.5 : 1.5}
        strokeDasharray={active ? undefined : "4 3"}
        pointerEvents="none"
      />
      <circle
        cx={tx}
        cy={ty}
        r={targetR}
        fill={targetColor}
        stroke={targetStroke}
        strokeWidth={active ? 3 : 2.5}
        pointerEvents="none"
      />
      <text
        x={tx}
        y={ty + 4}
        textAnchor="middle"
        fontSize={active ? 12 : 10}
        fontWeight={700}
        fill={readableText(targetColor)}
        stroke={targetStroke === DARK_STROKE ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}
        strokeWidth={0.5}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {index + 1}
      </text>
      <circle
        cx={ux}
        cy={uy}
        r={guessR}
        fill={userColor}
        stroke={guessStroke}
        strokeWidth={active ? 3 : 2.5}
        strokeDasharray="4 3"
        pointerEvents="none"
      />
      <text
        x={ux}
        y={uy + 4}
        textAnchor="middle"
        fontSize={active ? 12 : 10}
        fontWeight={700}
        fill={readableText(userColor)}
        stroke={guessStroke === DARK_STROKE ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)"}
        strokeWidth={0.5}
        paintOrder="stroke"
        pointerEvents="none"
      >
        {index + 1}
      </text>
    </g>
  );
}

export function PhotoCanvasWithMarkers({
  photoDataUrl,
  targetColors,
  userColors,
  targetPositions,
  userPositions,
  maxHeightLimit,
  fillContainer = false,
  compact = false,
  selectedIndex,
  onSelectedIndexChange,
  ghostPlayers,
}: PhotoCanvasWithMarkersProps) {
  useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCropRef = useRef<HTMLCanvasElement>(null);
  const guessCropRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [internalIndex, setInternalIndex] = useState<number | null>(null);
  const coarsePointer = useCoarsePointer();
  const hitRadius = coarsePointer ? 30 : HIT_CIRCLE_R;
  const hitLineWidth = coarsePointer ? 24 : HIT_LINE_WIDTH;

  const isControlled = onSelectedIndexChange !== undefined;
  const activeIndex = isControlled ? (selectedIndex ?? null) : internalIndex;

  function setActiveIndex(index: number | null) {
    if (isControlled) {
      onSelectedIndexChange(index);
    } else {
      setInternalIndex(index);
    }
  }

  function handleTapMarker(index: number) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setContainerWidth(el.getBoundingClientRect().width);
      setMaxHeight(
        maxHeightLimit ??
          window.innerHeight * MAX_VIEWPORT_HEIGHT_RATIO,
      );
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [maxHeightLimit]);

  useEffect(() => {
    if (containerWidth === 0 || maxHeight === 0) return;
    let cancelled = false;

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = computePhotoCanvasLayout(
        img.width,
        img.height,
        containerWidth,
        maxHeight,
      );
      const ctx = drawPhotoToCanvas(canvas, img, layout);
      if (!ctx) return;
      setCanvasSize({ w: layout.cssWidth, h: layout.cssHeight });
    };
    img.src = photoDataUrl;

    return () => {
      cancelled = true;
    };
  }, [photoDataUrl, containerWidth, maxHeight]);

  useEffect(() => {
    if (activeIndex === null) return;
    const source = canvasRef.current;
    const targetCanvas = targetCropRef.current;
    const guessCanvas = guessCropRef.current;
    if (!source || !targetCanvas || !guessCanvas || canvasSize.w === 0) return;

    const targetPos = targetPositions[activeIndex] ?? { x: 0.5, y: 0.5 };
    const guessPos = userPositions[activeIndex] ?? { x: 0.5, y: 0.5 };
    const tx = targetPos.x * source.width;
    const ty = targetPos.y * source.height;
    const ux = guessPos.x * source.width;
    const uy = guessPos.y * source.height;
    const cropPx = compact ? COMPACT_CROP_DISPLAY : CROP_DISPLAY;

    const strokes = resolvePairStrokes(
      samplePhotoLuminance(source, tx, ty),
      samplePhotoLuminance(source, ux, uy),
      targetColors[activeIndex],
      userColors[activeIndex],
    );

    drawCropCanvas(
      targetCanvas,
      source,
      tx,
      ty,
      targetColors[activeIndex],
      strokes.targetStroke,
      cropPx,
    );
    drawCropCanvas(
      guessCanvas,
      source,
      ux,
      uy,
      userColors[activeIndex],
      strokes.guessStroke,
      cropPx,
    );
  }, [
    activeIndex,
    canvasSize,
    compact,
    targetPositions,
    userPositions,
    targetColors,
    userColors,
  ]);

  const { w, h } = canvasSize;
  const count = targetColors.length;
  const photoCanvas = canvasRef.current;

  const markerStrokes = Array.from({ length: count }, (_, i) => {
    const targetPos = targetPositions[i] ?? { x: 0.5, y: 0.5 };
    const guessPos = userPositions[i] ?? { x: 0.5, y: 0.5 };
    const tx = photoCanvas ? targetPos.x * photoCanvas.width : targetPos.x * w;
    const ty = photoCanvas ? targetPos.y * photoCanvas.height : targetPos.y * h;
    const ux = photoCanvas ? guessPos.x * photoCanvas.width : guessPos.x * w;
    const uy = photoCanvas ? guessPos.y * photoCanvas.height : guessPos.y * h;

    return resolvePairStrokes(
      photoCanvas && w > 0 ? samplePhotoLuminance(photoCanvas, tx, ty) : null,
      photoCanvas && w > 0 ? samplePhotoLuminance(photoCanvas, ux, uy) : null,
      targetColors[i],
      userColors[i],
    );
  });

  const renderOrder = Array.from({ length: count }, (_, i) => i).sort(
    (a, b) => {
      const aActive = activeIndex === a;
      const bActive = activeIndex === b;
      if (aActive && !bActive) return 1;
      if (!aActive && bActive) return -1;
      return a - b;
    },
  );

  const cropSize = compact ? COMPACT_CROP_DISPLAY : CROP_DISPLAY;
  const targetLabel = compact
    ? t("game.target")
    : t("game.cellTarget", { n: (activeIndex ?? 0) + 1 });
  const yoursLabel = compact
    ? t("game.yours")
    : t("game.cellYours", { n: (activeIndex ?? 0) + 1 });

  const comparisonPanel = activeIndex !== null && (
    <div
      className={`relative rounded-xl bg-[var(--color-overlay)] shadow-lg ring-1 ring-[var(--color-border)] backdrop-blur-sm pointer-events-auto ${
        compact ? "w-max max-w-full p-2.5 pt-3" : "px-3 py-2.5"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`grid grid-cols-2 ${compact ? "gap-2.5" : "gap-3"}`}
      >
        <div
          className={`flex flex-col items-center gap-1.5 ${
            compact
              ? "rounded-lg bg-[var(--color-surface-muted)] px-2 py-2 ring-1 ring-[var(--color-border)]"
              : ""
          }`}
        >
          <span className="text-center text-[11px] font-medium leading-none text-[var(--color-ink-muted)]">
            {targetLabel}
          </span>
          <canvas
            ref={targetCropRef}
            className="block shrink-0 rounded-md ring-1 ring-inset ring-[var(--color-border-strong)]"
            style={{ width: cropSize, height: cropSize }}
            width={cropSize}
            height={cropSize}
          />
          <span className="font-mono text-[10px] leading-none text-[var(--color-ink-secondary)]">
            {targetColors[activeIndex]}
          </span>
        </div>
        <div
          className={`flex flex-col items-center gap-1.5 ${
            compact
              ? "rounded-lg bg-[var(--color-surface-muted)] px-2 py-2 ring-1 ring-[var(--color-border)]"
              : ""
          }`}
        >
          <span className="text-center text-[11px] font-medium leading-none text-[var(--color-ink-muted)]">
            {yoursLabel}
          </span>
          <canvas
            ref={guessCropRef}
            className="block shrink-0 rounded-md ring-1 ring-inset ring-amber-400/80"
            style={{ width: cropSize, height: cropSize }}
            width={cropSize}
            height={cropSize}
          />
          <span className="font-mono text-[10px] leading-none text-[var(--color-ink-secondary)]">
            {userColors[activeIndex]}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setActiveIndex(null)}
        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-sm text-white shadow ring-2 ring-[var(--color-surface)]"
        aria-label={t("game.closeCompare")}
      >
        ×
      </button>
    </div>
  );

  return (
    <div
      className={`flex w-full flex-col items-center gap-3 ${
        fillContainer ? "h-full min-h-0" : ""
      }`}
    >
      <div
        ref={containerRef}
        className={`relative flex w-full justify-center ${
          fillContainer ? "min-h-0 flex-1 items-center" : ""
        }`}
      >
        <div
          className={`relative ${fillContainer ? "max-h-full max-w-full" : "inline-block"}`}
          data-preserve-selection
        >
          <canvas
            ref={canvasRef}
            className={`block ring-1 ring-[var(--color-border)] ${
              fillContainer ? "rounded-none" : "rounded-xl"
            }`}
          />
          {w > 0 && h > 0 && (
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="absolute inset-0 h-full w-full touch-manipulation"
            >
              <rect
                width={w}
                height={h}
                fill="transparent"
                pointerEvents="all"
                onPointerUp={() => setActiveIndex(null)}
              />
              {renderOrder.map((i) => (
                <MarkerPair
                  key={i}
                  index={i}
                  w={w}
                  h={h}
                  targetPos={targetPositions[i] ?? { x: 0.5, y: 0.5 }}
                  guessPos={userPositions[i] ?? { x: 0.5, y: 0.5 }}
                  targetColor={targetColors[i]}
                  userColor={userColors[i]}
                  targetStroke={markerStrokes[i].targetStroke}
                  guessStroke={markerStrokes[i].guessStroke}
                  linkStroke={markerStrokes[i].linkStroke}
                  active={activeIndex === i}
                  dim={activeIndex !== null && activeIndex !== i}
                  hitRadius={hitRadius}
                  hitLineWidth={hitLineWidth}
                  onTap={handleTapMarker}
                />
              ))}
              {ghostPlayers?.map((ghost) =>
                ghost.userColors.map((color, i) => {
                  if (!color) return null;
                  const pos = ghost.userPositions[i] ?? { x: 0.5, y: 0.5 };
                  const ux = pos.x * w;
                  const uy = pos.y * h;
                  const accent = getPlayerColor(ghost.colorIndex);
                  const dimGhost = activeIndex !== null && activeIndex !== i;
                  return (
                    <g key={`${ghost.playerId}-${i}`} opacity={dimGhost ? 0.35 : 0.85}>
                      <circle
                        cx={ux}
                        cy={uy}
                        r={7}
                        fill={color}
                        stroke={accent}
                        strokeWidth={2}
                        pointerEvents="none"
                      />
                    </g>
                  );
                }),
              )}
            </svg>
          )}
        </div>
        {comparisonPanel && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-3 py-2">
            {comparisonPanel}
          </div>
        )}
      </div>
    </div>
  );
}
