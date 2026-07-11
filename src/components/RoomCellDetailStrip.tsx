import { useEffect, useRef } from "react";
import type { Position } from "../types";
import { deltaE } from "../utils/scoring";
import { t, useLocale } from "../i18n";
import { ScoreDenom } from "./ScoreResult";
import {
  computePhotoCanvasLayout,
  drawPhotoToCanvas,
} from "../utils/photoCanvas";

interface DetailPlayer {
  playerId: string;
  emoji: string;
  displayName: string;
  userColor: string;
  userPosition: Position;
  cellScore: number;
}

export type DetailStripLayout = "horizontal" | "vertical";

interface RoomCellDetailStripProps {
  photoDataUrl: string;
  cellIndex: number;
  targetColor: string;
  targetPosition: Position;
  players: DetailPlayer[];
  onClose: () => void;
  layout?: DetailStripLayout;
}

const CROP_RADIUS = 22;
const TILE = 52;

function CropTile({
  photoDataUrl,
  position,
  hex,
  size = TILE,
}: {
  photoDataUrl: string;
  position: Position;
  hex: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const layout = computePhotoCanvasLayout(img.width, img.height, 200, 200);
      const off = document.createElement("canvas");
      drawPhotoToCanvas(off, img, layout);

      const cx = position.x * layout.bufferWidth;
      const cy = position.y * layout.bufferHeight;
      const half = CROP_RADIUS;
      const sx = Math.max(0, Math.min(layout.bufferWidth - 1, cx - half));
      const sy = Math.max(0, Math.min(layout.bufferHeight - 1, cy - half));
      const sw = Math.min(half * 2, layout.bufferWidth - sx);
      const sh = Math.min(half * 2, layout.bufferHeight - sy);

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, sx, sy, sw, sh, 0, 0, size, size);

      const center = size / 2;
      ctx.fillStyle = hex;
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center, center, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    img.src = photoDataUrl;
    return () => {
      cancelled = true;
    };
  }, [photoDataUrl, position, hex, size]);

  return (
    <canvas
      ref={canvasRef}
      className="shrink-0 rounded-md ring-1 ring-inset ring-stone-300"
      style={{ width: size, height: size }}
    />
  );
}

function DetailColumn({
  label,
  emoji,
  photoDataUrl,
  position,
  hex,
  score,
  de,
  isTarget,
}: {
  label: string;
  emoji?: string;
  photoDataUrl: string;
  position: Position;
  hex: string;
  score?: number;
  de?: number;
  isTarget?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-1.5 ${
        isTarget ? "bg-stone-50 ring-1 ring-stone-200" : ""
      }`}
    >
      <span
        className="max-w-[5rem] truncate text-center text-[11px] font-medium text-stone-600"
        title={label}
      >
        {emoji ? `${emoji} ` : ""}
        {label}
      </span>
      <CropTile photoDataUrl={photoDataUrl} position={position} hex={hex} />
      <div
        className="h-8 w-8 shrink-0 rounded-md ring-1 ring-inset ring-stone-200"
        style={{ backgroundColor: hex }}
        title={hex}
      />
      <span className="max-w-[5rem] truncate font-mono text-[9px] text-stone-400">
        {hex}
      </span>
      {score !== undefined && de !== undefined && (
        <span className="text-[10px] text-stone-500">
          <span className="font-mono font-semibold text-stone-800">{score}</span>
          <ScoreDenom className="text-[9px]" />
          {" · "}ΔE {de.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function DetailRow({
  label,
  emoji,
  photoDataUrl,
  position,
  hex,
  score,
  de,
  isTarget,
  compact,
}: {
  label: string;
  emoji?: string;
  photoDataUrl: string;
  position: Position;
  hex: string;
  score?: number;
  de?: number;
  isTarget?: boolean;
  compact?: boolean;
}) {
  const tile = compact ? 44 : TILE;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${
        isTarget ? "bg-stone-50 ring-1 ring-stone-200" : "ring-1 ring-stone-100"
      }`}
    >
      <CropTile
        photoDataUrl={photoDataUrl}
        position={position}
        hex={hex}
        size={tile}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-stone-700" title={label}>
          {emoji ? `${emoji} ` : ""}
          {label}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <div
            className="h-7 w-7 shrink-0 rounded-md ring-1 ring-inset ring-stone-200"
            style={{ backgroundColor: hex }}
            title={hex}
          />
          <span className="truncate font-mono text-[10px] text-stone-400">{hex}</span>
        </div>
      </div>
      {score !== undefined && de !== undefined && (
        <div className="shrink-0 text-right text-[10px] text-stone-500">
          <p className="font-mono text-sm font-semibold text-stone-800">
            {score}
            <ScoreDenom className="text-[10px]" />
          </p>
          <p>ΔE {de.toFixed(1)}</p>
        </div>
      )}
    </div>
  );
}

export function RoomCellDetailStrip({
  photoDataUrl,
  cellIndex,
  targetColor,
  targetPosition,
  players,
  onClose,
  layout = "horizontal",
}: RoomCellDetailStripProps) {
  useLocale();
  const targetLabel = t("score.cellLabel", { n: String(cellIndex + 1) });
  const compact = layout === "vertical";

  return (
    <div
      className="relative rounded-xl border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm"
      data-preserve-selection
    >
      {layout === "vertical" ? (
        <div className="flex max-h-[min(70vh,28rem)] w-[min(13rem,42vw)] flex-col gap-1.5 overflow-y-auto overscroll-y-contain">
          <DetailRow
            label={targetLabel}
            photoDataUrl={photoDataUrl}
            position={targetPosition}
            hex={targetColor}
            isTarget
            compact={compact}
          />
          {players.map((player) => {
            const de = deltaE(targetColor, player.userColor);
            return (
              <DetailRow
                key={player.playerId}
                label={player.displayName}
                emoji={player.emoji}
                photoDataUrl={photoDataUrl}
                position={player.userPosition}
                hex={player.userColor}
                score={player.cellScore}
                de={de}
                compact={compact}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="flex max-w-full justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <DetailColumn
              label={targetLabel}
              photoDataUrl={photoDataUrl}
              position={targetPosition}
              hex={targetColor}
              isTarget
            />
            <div className="mx-0.5 w-px shrink-0 self-stretch bg-stone-200" />
            {players.map((player) => {
              const de = deltaE(targetColor, player.userColor);
              return (
                <DetailColumn
                  key={player.playerId}
                  label={player.displayName}
                  emoji={player.emoji}
                  photoDataUrl={photoDataUrl}
                  position={player.userPosition}
                  hex={player.userColor}
                  score={player.cellScore}
                  de={de}
                />
              );
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onClose}
        className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-xs text-white shadow ring-2 ring-white"
        aria-label={t("game.closeCompare")}
      >
        ×
      </button>
    </div>
  );
}
