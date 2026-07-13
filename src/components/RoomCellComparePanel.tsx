import { useEffect, useRef } from "react";
import type { Position } from "../types";
import { getPlayerColor } from "../lib/playerColors";
import { deltaE } from "../utils/scoring";
import { t, useLocale } from "../i18n";
import {
  computePhotoCanvasLayout,
  drawCenteredCrop,
  drawCropCrosshair,
  drawPhotoToCanvas,
} from "../utils/photoCanvas";

interface PlayerCell {
  playerId: string;
  displayName: string;
  colorIndex: number;
  userColor: string;
  userPosition: Position;
  cellScore: number;
}

interface RoomCellComparePanelProps {
  photoDataUrl: string;
  cellIndex: number;
  targetColor: string;
  targetPosition: Position;
  players: PlayerCell[];
}

const TILE = 56;

function CropCanvas({
  photoDataUrl,
  position,
  hex,
}: {
  photoDataUrl: string;
  position: Position;
  hex: string;
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
      const radius = Math.max(
        14,
        Math.round(Math.min(layout.bufferWidth, layout.bufferHeight) * 0.07),
      );

      const ctx = drawCenteredCrop(canvas, off, cx, cy, radius, TILE);
      if (!ctx) return;
      drawCropCrosshair(ctx, TILE, hex, "#1c1917");
    };
    img.src = photoDataUrl;
    return () => {
      cancelled = true;
    };
  }, [photoDataUrl, position, hex]);

  return (
    <canvas
      ref={canvasRef}
      className="shrink-0 rounded-md ring-1 ring-inset ring-[var(--color-border-strong)]"
      style={{ width: TILE, height: TILE }}
    />
  );
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <div
      className="shrink-0 rounded-md ring-1 ring-inset ring-[var(--color-border)]"
      style={{ width: TILE, height: TILE, backgroundColor: hex }}
      title={hex}
    />
  );
}

function CompareBlock({
  label,
  photoDataUrl,
  position,
  hex,
  accent,
  score,
  de,
  showStats,
}: {
  label: string;
  photoDataUrl: string;
  position: Position;
  hex: string;
  accent?: string;
  score?: number;
  de?: number;
  showStats?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="max-w-full truncate text-center text-[11px] font-medium text-[var(--color-ink-secondary)]"
        style={accent ? { color: accent } : undefined}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <CropCanvas photoDataUrl={photoDataUrl} position={position} hex={hex} />
        <ColorSwatch hex={hex} />
      </div>
      <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{hex}</span>
      {showStats && score !== undefined && de !== undefined && (
        <div className="text-center text-[11px] leading-tight text-[var(--color-ink-muted)]">
          <div className="font-mono font-semibold text-[var(--color-ink)]">{score}</div>
          <div>ΔE {de.toFixed(1)}</div>
        </div>
      )}
    </div>
  );
}

export function RoomCellComparePanel({
  photoDataUrl,
  cellIndex,
  targetColor,
  targetPosition,
  players,
}: RoomCellComparePanelProps) {
  useLocale();

  if (players.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-caption mb-4 text-xs font-medium">
        {t("room.cellCompareTitle", { n: String(cellIndex + 1) })}
      </p>

      <div className="flex flex-col items-center border-b border-dashed border-[var(--color-border)] pb-5">
        <CompareBlock
          label={t("score.targetSmall")}
          photoDataUrl={photoDataUrl}
          position={targetPosition}
          hex={targetColor}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-2">
        {players.map((player) => {
          const de = deltaE(targetColor, player.userColor);
          return (
            <CompareBlock
              key={player.playerId}
              label={player.displayName}
              photoDataUrl={photoDataUrl}
              position={player.userPosition}
              hex={player.userColor}
              accent={getPlayerColor(player.colorIndex)}
              score={player.cellScore}
              de={de}
              showStats
            />
          );
        })}
      </div>
    </div>
  );
}
