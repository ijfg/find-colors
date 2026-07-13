import { useEffect, useRef, useState } from "react";
import type { Position } from "../types";
import { useCompactWidth } from "../hooks/useMedia";
import { useLocale } from "../i18n";
import {
  computePhotoCanvasLayout,
  drawPhotoToCanvas,
} from "../utils/photoCanvas";
import { RoomCellDetailStrip } from "./RoomCellDetailStrip";

interface DetailPlayer {
  playerId: string;
  emoji: string;
  displayName: string;
  userColor: string;
  userPosition: Position;
  cellScore: number;
}

interface RoomMultiPlayerPhotoProps {
  photoDataUrl: string;
  targetColors: string[];
  targetPositions: Position[];
  players: Array<{
    playerId: string;
    emoji: string;
    userColors: string[];
    userPositions: Position[];
  }>;
  selectedIndex?: number | null;
  onSelectedIndexChange?: (index: number | null) => void;
  /** Fired when the empty photo background is tapped (no cell selected). */
  onEmptyPhotoTap?: () => void;
  detailPlayers?: DetailPlayer[];
  fillContainer?: boolean;
}

const MAX_VIEWPORT_HEIGHT_RATIO = 0.72;

export function RoomMultiPlayerPhoto({
  photoDataUrl,
  targetColors,
  targetPositions,
  players,
  selectedIndex = null,
  onSelectedIndexChange,
  onEmptyPhotoTap,
  detailPlayers = [],
  fillContainer = false,
}: RoomMultiPlayerPhotoProps) {
  useLocale();
  const compact = useCompactWidth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setContainerWidth(el.getBoundingClientRect().width);
      setMaxHeight(
        fillContainer
          ? el.getBoundingClientRect().height
          : window.innerHeight * MAX_VIEWPORT_HEIGHT_RATIO,
      );
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [fillContainer]);

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
      drawPhotoToCanvas(canvas, img, layout);
      setCanvasSize({ w: layout.cssWidth, h: layout.cssHeight });
    };
    img.src = photoDataUrl;

    return () => {
      cancelled = true;
    };
  }, [photoDataUrl, containerWidth, maxHeight]);

  const { w, h } = canvasSize;
  const count = targetColors.length;
  const isLandscapePhoto = w > 0 && h > 0 && w >= h;
  const showDetail = selectedIndex !== null && detailPlayers.length > 0;

  // Mobile: always horizontal + swipe, matching landscape results detail.
  // Desktop portrait photos keep a vertical stack beside the photo.
  const detailLayout = compact || isLandscapePhoto ? "horizontal" : "vertical";

  const detailStrip =
    showDetail && selectedIndex !== null ? (
      <RoomCellDetailStrip
        photoDataUrl={photoDataUrl}
        cellIndex={selectedIndex}
        targetColor={targetColors[selectedIndex] ?? "#000"}
        targetPosition={
          targetPositions[selectedIndex] ?? { x: 0.5, y: 0.5 }
        }
        players={detailPlayers}
        onClose={() => onSelectedIndexChange?.(null)}
        layout={detailLayout}
      />
    ) : null;

  const photoBlock = (
    <div
      className={`relative ${fillContainer ? "max-h-full max-w-full" : "inline-block"}`}
      data-preserve-selection
    >
      <canvas
        ref={canvasRef}
        className={`block ring-1 ring-stone-200 ${
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
            onPointerUp={() => {
              if (selectedIndex !== null) {
                onSelectedIndexChange?.(null);
                return;
              }
              onEmptyPhotoTap?.();
            }}
          />
          {Array.from({ length: count }, (_, cellIndex) => {
            const targetPos = targetPositions[cellIndex] ?? { x: 0.5, y: 0.5 };
            const tx = targetPos.x * w;
            const ty = targetPos.y * h;
            const active = selectedIndex === cellIndex;
            const dim = selectedIndex !== null && !active;

            return (
              <g
                key={cellIndex}
                opacity={dim ? 0.18 : 1}
                style={{ transition: "opacity 0.2s ease" }}
              >
                {players.map((player) => {
                  const guess = player.userColors[cellIndex];
                  const guessPos = player.userPositions[cellIndex];
                  if (!guess || !guessPos) return null;
                  const ux = guessPos.x * w;
                  const uy = guessPos.y * h;

                  return (
                    <g key={player.playerId}>
                      <line
                        x1={tx}
                        y1={ty}
                        x2={ux}
                        y2={uy}
                        stroke={active ? "#57534e" : "#78716c"}
                        strokeWidth={active ? 2.5 : 1.2}
                        strokeDasharray="4 3"
                        strokeOpacity={active ? 0.85 : 0.4}
                      />
                      <text
                        x={ux}
                        y={uy + (active ? 5 : 4)}
                        textAnchor="middle"
                        fontSize={active ? 18 : 15}
                        stroke="#fff"
                        strokeWidth={active ? 3 : 2.5}
                        paintOrder="stroke"
                        pointerEvents="none"
                        style={{
                          filter: active
                            ? "drop-shadow(0 1px 2px rgba(0,0,0,0.35))"
                            : undefined,
                        }}
                      >
                        {player.emoji}
                      </text>
                    </g>
                  );
                })}
                <circle
                  cx={tx}
                  cy={ty}
                  r={active ? 12 : 9}
                  fill={targetColors[cellIndex]}
                  stroke="#1c1917"
                  strokeWidth={active ? 3 : 2.5}
                  pointerEvents="all"
                  style={{
                    cursor: "pointer",
                    transition: "r 0.15s ease",
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    onSelectedIndexChange?.(
                      selectedIndex === cellIndex ? null : cellIndex,
                    );
                  }}
                />
                <text
                  x={tx}
                  y={ty + 4}
                  textAnchor="middle"
                  fontSize={active ? 11 : 10}
                  fontWeight={700}
                  fill="#fff"
                  stroke="#1c1917"
                  strokeWidth={0.6}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {cellIndex + 1}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );

  const useBottomStrip = compact || isLandscapePhoto;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full min-h-0 flex-1 items-center justify-center overflow-hidden"
    >
      {photoBlock}

      {showDetail && detailStrip && (
        <div
          className={`pointer-events-none absolute z-10 ${
            useBottomStrip
              ? "inset-x-0 bottom-0 flex justify-center px-2 pb-2 pt-4"
              : "left-2 top-1/2 max-h-[88%] -translate-y-1/2 overflow-y-auto"
          }`}
        >
          <div
            className={`pointer-events-auto max-h-full ${
              useBottomStrip ? "w-full max-w-full" : ""
            }`}
          >
            {detailStrip}
          </div>
        </div>
      )}
    </div>
  );
}
