import { useCallback, useEffect, useRef, useState } from "react";
import type { Position } from "../types";
import { useCoarsePointer } from "../hooks/useMedia";
import { rgbToHex } from "../utils/colorExtract";
import {
  computePhotoCanvasLayout,
  drawPhotoToCanvas,
} from "../utils/photoCanvas";

interface PhotoCanvasPickerProps {
  photoDataUrl: string;
  enabled: boolean;
  onPick: (hex: string, pos: Position) => void;
  /** Live update while dragging the loupe (mobile). */
  onPreviewPick?: (hex: string, pos: Position) => void;
  /** Max canvas height in px; when omitted, uses 72% of viewport. */
  maxHeightLimit?: number;
  /** Fill parent height (mobile immersive layout). */
  fillContainer?: boolean;
  /** Float zoom controls over the photo (landscape sidebars). */
  overlayControls?: boolean;
}

interface ImageInfo {
  img: HTMLImageElement;
  pixels: Uint8ClampedArray;
  naturalWidth: number;
  naturalHeight: number;
}

interface HoverState {
  canvasX: number;
  canvasY: number;
  cssX: number;
  cssY: number;
  hex: string;
}

const LOUPE_SIZE = 120;
const LOUPE_ZOOM = 5;
const LOUPE_HALF = LOUPE_SIZE / 2;
const HEX_LABEL_HEIGHT = 22;
const HEX_LOUPE_GAP = 8;
const MAX_VIEWPORT_HEIGHT_RATIO = 0.72;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const TAP_MOVE_THRESHOLD = 8;
const PAN_START_THRESHOLD = 4;
const LOUPE_GAP = 14;
const HEX_AVOID_FINGER = 64;

function clampPan(
  zoom: number,
  pan: { x: number; y: number },
  w: number,
  h: number,
): { x: number; y: number } {
  if (zoom <= 1) return { x: 0, y: 0 };
  const minX = w - w * zoom;
  const minY = h - h * zoom;
  return {
    x: Math.min(0, Math.max(minX, pan.x)),
    y: Math.min(0, Math.max(minY, pan.y)),
  };
}

function placeHexLabel(
  loupeX: number,
  loupeY: number,
  anchorX: number,
  anchorY: number,
  viewportW: number,
  viewportH: number,
): { hexLeft: number; hexTop: number; hexAnchor: "top" | "bottom" } {
  const loupeAboveFinger = loupeY < anchorY - 4;
  const preferredAnchor: "top" | "bottom" = loupeAboveFinger ? "bottom" : "top";

  const candidates: {
    left: number;
    top: number;
    hexAnchor: "top" | "bottom";
  }[] = [
    {
      left: loupeX,
      top: loupeY - LOUPE_HALF - HEX_LOUPE_GAP,
      hexAnchor: "bottom",
    },
    {
      left: loupeX,
      top: loupeY + LOUPE_HALF + HEX_LOUPE_GAP,
      hexAnchor: "top",
    },
  ];

  let best = candidates[0];
  let bestScore = -Infinity;

  const scoreCandidate = (
    c: (typeof candidates)[number],
    minDist: number,
  ): { left: number; top: number; hexAnchor: "top" | "bottom"; score: number } | null => {
    const labelTop =
      c.hexAnchor === "bottom" ? c.top - HEX_LABEL_HEIGHT : c.top;
    const labelBottom =
      c.hexAnchor === "bottom" ? c.top : c.top + HEX_LABEL_HEIGHT;

    if (labelTop < 4 || labelBottom > viewportH - 4) return null;

    const left = Math.max(44, Math.min(viewportW - 44, c.left));
    const cy = (labelTop + labelBottom) / 2;
    const dist = Math.hypot(left - anchorX, cy - anchorY);
    if (dist < minDist) return null;

    const resolvedTop = c.hexAnchor === "bottom" ? labelBottom : labelTop;
    const preferBonus = c.hexAnchor === preferredAnchor ? 500 : 0;
    return {
      left,
      top: resolvedTop,
      hexAnchor: c.hexAnchor,
      score: dist + preferBonus,
    };
  };

  for (const minDist of [HEX_AVOID_FINGER, 0]) {
    for (const c of candidates) {
      const scored = scoreCandidate(c, minDist);
      if (scored && scored.score > bestScore) {
        bestScore = scored.score;
        best = {
          left: scored.left,
          top: scored.top,
          hexAnchor: scored.hexAnchor,
        };
      }
    }
    if (bestScore > -Infinity) break;
  }

  return {
    hexLeft: best.left,
    hexTop: best.top,
    hexAnchor: best.hexAnchor,
  };
}

/** Place loupe beside the anchor so the finger can stay on the pick point. */
function placeLoupe(
  anchorX: number,
  anchorY: number,
  viewportW: number,
  viewportH: number,
  offsetLoupe: boolean,
) {
  if (!offsetLoupe) {
    return { loupeX: anchorX, loupeY: anchorY };
  }

  let loupeX = anchorX + LOUPE_HALF * 0.35;
  let loupeY = anchorY - LOUPE_HALF - LOUPE_GAP;

  if (loupeY - LOUPE_HALF < 6) {
    loupeY = anchorY + LOUPE_HALF + LOUPE_GAP;
  }
  if (loupeX + LOUPE_HALF > viewportW - 6) {
    loupeX = anchorX - LOUPE_HALF - LOUPE_GAP;
  }
  if (loupeX - LOUPE_HALF < 6) {
    loupeX = anchorX + LOUPE_HALF + LOUPE_GAP;
  }

  loupeX = Math.max(
    LOUPE_HALF + 6,
    Math.min(viewportW - LOUPE_HALF - 6, loupeX),
  );
  loupeY = Math.max(
    LOUPE_HALF + 6,
    Math.min(viewportH - LOUPE_HALF - 6, loupeY),
  );

  return { loupeX, loupeY };
}

function drawLoupeCanvas(
  canvas: HTMLCanvasElement,
  info: ImageInfo,
  cx: number,
  cy: number,
) {
  canvas.width = LOUPE_SIZE;
  canvas.height = LOUPE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.createImageData(LOUPE_SIZE, LOUPE_SIZE);
  const { pixels, naturalWidth, naturalHeight } = info;

  for (let ly = 0; ly < LOUPE_SIZE; ly++) {
    for (let lx = 0; lx < LOUPE_SIZE; lx++) {
      const sx = cx + (lx - LOUPE_HALF) / LOUPE_ZOOM;
      const sy = cy + (ly - LOUPE_HALF) / LOUPE_ZOOM;
      const xi = Math.round(sx);
      const yi = Math.round(sy);
      const di = (ly * LOUPE_SIZE + lx) * 4;

      if (xi < 0 || yi < 0 || xi >= naturalWidth || yi >= naturalHeight) {
        imageData.data[di + 3] = 0;
        continue;
      }

      const si = (yi * naturalWidth + xi) * 4;
      imageData.data[di] = pixels[si];
      imageData.data[di + 1] = pixels[si + 1];
      imageData.data[di + 2] = pixels[si + 2];
      imageData.data[di + 3] = pixels[si + 3] < 128 ? 0 : 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function PhotoCanvasPicker({
  photoDataUrl,
  enabled,
  onPick,
  onPreviewPick,
  maxHeightLimit,
  fillContainer = false,
  overlayControls = false,
}: PhotoCanvasPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageInfoRef = useRef<ImageInfo | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);
  const pointersRef = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const pinchRef = useRef<{
    initialDistance: number;
    initialZoom: number;
    anchorCssX: number;
    anchorCssY: number;
  } | null>(null);

  const coarsePointer = useCoarsePointer();

  const [containerWidth, setContainerWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<HoverState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });

  viewRef.current = { zoom, pan };

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
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
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

      const imageData = ctx.getImageData(0, 0, layout.bufferWidth, layout.bufferHeight);
      imageInfoRef.current = {
        img,
        pixels: imageData.data,
        naturalWidth: layout.bufferWidth,
        naturalHeight: layout.bufferHeight,
      };
      setDisplaySize({ w: layout.cssWidth, h: layout.cssHeight });
      setHover(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.src = photoDataUrl;

    return () => {
      cancelled = true;
    };
  }, [photoDataUrl, containerWidth, maxHeight]);

  const clientToCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      const viewport = viewportRef.current;
      const { w, h } = displaySize;
      if (!canvas || !viewport || w === 0 || h === 0) return null;

      const vRect = viewport.getBoundingClientRect();
      if (vRect.width === 0 || vRect.height === 0) return null;

      const { zoom: z, pan: p } = viewRef.current;
      const cssX = (clientX - vRect.left - p.x) / z;
      const cssY = (clientY - vRect.top - p.y) / z;

      return {
        canvasX: (cssX / w) * canvas.width,
        canvasY: (cssY / h) * canvas.height,
        cssX,
        cssY,
      };
    },
    [displaySize],
  );

  const sampleAtCanvasCoords = useCallback(
    (cx: number, cy: number, radius = 1): string | null => {
      const info = imageInfoRef.current;
      if (!info) return null;
      const { pixels, naturalWidth, naturalHeight } = info;

      const xi = Math.round(cx);
      const yi = Math.round(cy);
      if (xi < 0 || yi < 0 || xi >= naturalWidth || yi >= naturalHeight) {
        return null;
      }

      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = xi + dx;
          const y = yi + dy;
          if (x < 0 || y < 0 || x >= naturalWidth || y >= naturalHeight) {
            continue;
          }
          const i = (y * naturalWidth + x) * 4;
          if (pixels[i + 3] < 128) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          n++;
        }
      }
      if (n === 0) return null;
      return rgbToHex(r / n, g / n, b / n);
    },
    [],
  );

  const applyZoomAt = useCallback(
    (nextZoom: number, anchorX: number, anchorY: number) => {
      const { w, h } = displaySize;
      if (w === 0 || h === 0) return;

      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
      const { zoom: prevZoom, pan: prevPan } = viewRef.current;

      if (clamped === 1) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const ratio = clamped / prevZoom;
      const nextPan = clampPan(
        clamped,
        {
          x: anchorX - ratio * (anchorX - prevPan.x),
          y: anchorY - ratio * (anchorY - prevPan.y),
        },
        w,
        h,
      );
      setZoom(clamped);
      setPan(nextPan);
    },
    [displaySize],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !enabled) return;

    const onWheel = (e: WheelEvent) => {
      if (displaySize.w === 0) return;
      e.preventDefault();
      const coords = clientToCoords(e.clientX, e.clientY);
      if (!coords) return;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      applyZoomAt(viewRef.current.zoom + delta, coords.cssX, coords.cssY);
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [enabled, displaySize, applyZoomAt, clientToCoords]);

  useEffect(() => {
    if (!hover || !enabled) return;
    const loupeCanvas = loupeCanvasRef.current;
    const info = imageInfoRef.current;
    if (!loupeCanvas || !info) return;
    drawLoupeCanvas(loupeCanvas, info, hover.canvasX, hover.canvasY);
  }, [hover, enabled]);

  function emitPick(
    hex: string,
    coords: { canvasX: number; canvasY: number },
    preview: boolean,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = {
      x: coords.canvasX / canvas.width,
      y: coords.canvasY / canvas.height,
    };
    if (preview) {
      onPreviewPick?.(hex, pos);
    } else {
      onPick(hex, pos);
    }
  }

  function updateHoverAt(
    clientX: number,
    clientY: number,
    emitPreview = false,
  ) {
    const coords = clientToCoords(clientX, clientY);
    if (!coords) return;
    const hex = sampleAtCanvasCoords(coords.canvasX, coords.canvasY, 1);
    if (hex) {
      setHover({
        canvasX: coords.canvasX,
        canvasY: coords.canvasY,
        cssX: coords.cssX,
        cssY: coords.cssY,
        hex,
      });
      if (emitPreview) {
        emitPick(hex, coords, true);
      }
    } else {
      setHover(null);
    }
  }

  function pinchMidpointCss(): { x: number; y: number } | null {
    const pts = [...pointersRef.current.values()];
    if (pts.length < 2) return null;
    const midX = (pts[0].clientX + pts[1].clientX) / 2;
    const midY = (pts[0].clientY + pts[1].clientY) / 2;
    const coords = clientToCoords(midX, midY);
    if (!coords) return null;
    return { x: coords.cssX, y: coords.cssY };
  }

  function pinchDistance(): number | null {
    const pts = [...pointersRef.current.values()];
    if (pts.length < 2) return null;
    return Math.hypot(
      pts[1].clientX - pts[0].clientX,
      pts[1].clientY - pts[0].clientY,
    );
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!enabled || e.button > 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    pointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    if (pointersRef.current.size >= 2) {
      const dist = pinchDistance();
      const midCss = pinchMidpointCss();
      if (dist && midCss) {
        pinchRef.current = {
          initialDistance: dist,
          initialZoom: viewRef.current.zoom,
          anchorCssX: midCss.x,
          anchorCssY: midCss.y,
        };
        dragRef.current = null;
        setHover(null);
      }
      return;
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
      moved: false,
    };
    updateHoverAt(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!enabled) return;

    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, {
        clientX: e.clientX,
        clientY: e.clientY,
      });
    }

    if (pointersRef.current.size >= 2) {
      e.preventDefault();
      setHover(null);

      const dist = pinchDistance();
      const midCss = pinchMidpointCss();
      if (!dist || !midCss) return;

      if (!pinchRef.current) {
        pinchRef.current = {
          initialDistance: dist,
          initialZoom: viewRef.current.zoom,
          anchorCssX: midCss.x,
          anchorCssY: midCss.y,
        };
      }

      const pr = pinchRef.current;
      const ratio = dist / pr.initialDistance;
      applyZoomAt(pr.initialZoom * ratio, midCss.x, midCss.y);
      return;
    }

    const drag = dragRef.current;
    if (drag && drag.pointerId === e.pointerId) {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (
        !drag.moved &&
        (Math.abs(dx) > PAN_START_THRESHOLD || Math.abs(dy) > PAN_START_THRESHOLD)
      ) {
        drag.moved = true;
      }
    }

    if (pointersRef.current.size <= 1) {
      const preview = !!dragRef.current;
      updateHoverAt(e.clientX, e.clientY, preview);
    }
  }

  function pickFromClient(clientX: number, clientY: number) {
    const coords = clientToCoords(clientX, clientY);
    if (!coords) return;
    const hex = sampleAtCanvasCoords(coords.canvasX, coords.canvasY, 1);
    if (hex) {
      emitPick(hex, coords, false);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      const remaining = [...pointersRef.current.entries()][0];
      dragRef.current = {
        pointerId: remaining[0],
        startX: remaining[1].clientX,
        startY: remaining[1].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
        moved: false,
      };
    }

    const drag = dragRef.current;
    if (drag?.pointerId === e.pointerId) {
      const moved = drag.moved;
      dragRef.current = null;

      if (!enabled) {
        // no pick
      } else if (moved) {
        pickFromClient(e.clientX, e.clientY);
      } else if (
        Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) <
        TAP_MOVE_THRESHOLD
      ) {
        pickFromClient(e.clientX, e.clientY);
      }
    }

    if (pointersRef.current.size === 0) {
      dragRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer may already be released
    }
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId);
    pinchRef.current = null;
    dragRef.current = null;
    setHover(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function handlePointerLeave() {
    if (pointersRef.current.size > 0) return;
    setHover(null);
  }

  function zoomIn() {
    const { w, h } = displaySize;
    applyZoomAt(zoom + ZOOM_STEP, w / 2, h / 2);
  }

  function zoomOut() {
    const { w, h } = displaySize;
    applyZoomAt(zoom - ZOOM_STEP, w / 2, h / 2);
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const { w, h } = displaySize;

  let vpX = 0;
  let vpY = 0;
  let loupeX = 0;
  let loupeY = 0;
  let hexLabel: ReturnType<typeof placeHexLabel> | null = null;

  if (hover && enabled && w > 0) {
    vpX = pan.x + hover.cssX * zoom;
    vpY = pan.y + hover.cssY * zoom;
    const placed = placeLoupe(vpX, vpY, w, h, coarsePointer);
    loupeX = placed.loupeX;
    loupeY = placed.loupeY;
    hexLabel = placeHexLabel(loupeX, loupeY, vpX, vpY, w, h);
  }

  const cursorClass = !enabled ? "cursor-default" : "cursor-crosshair";

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col items-center gap-2 ${
        fillContainer ? "h-full min-h-0" : ""
      } ${overlayControls ? "relative" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`relative ${
          fillContainer
            ? "flex min-h-0 w-full flex-1 items-center justify-center"
            : ""
        }`}
        style={
          fillContainer
            ? undefined
            : { width: w || undefined, height: h || undefined }
        }
      >
        <div
          className={`relative ${
            fillContainer ? "max-h-full max-w-full" : "h-full w-full"
          }`}
          style={
            fillContainer
              ? { width: w || undefined, height: h || undefined }
              : undefined
          }
        >
        <div
          ref={viewportRef}
          className={`absolute inset-0 touch-none overflow-hidden ring-1 ring-stone-200 ${
            fillContainer ? "rounded-none" : "rounded-xl"
          }`}
        >
          <div
            className="relative origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: w || undefined,
              height: h || undefined,
            }}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onPointerLeave={handlePointerLeave}
              className={`block touch-none select-none ${cursorClass}`}
            />
          </div>
        </div>

        {hover && enabled && hexLabel && (
          <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
            {coarsePointer && (
              <svg
                className="absolute overflow-visible"
                style={{ inset: 0, width: w, height: h }}
              >
                <line
                  x1={vpX}
                  y1={vpY}
                  x2={loupeX}
                  y2={loupeY}
                  stroke="white"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  opacity={0.85}
                />
              </svg>
            )}

            <svg
              className="absolute overflow-visible"
              style={{
                left: vpX,
                top: vpY,
                transform: "translate(-50%, -50%)",
              }}
              width={coarsePointer ? 36 : 24}
              height={coarsePointer ? 36 : 24}
              viewBox="0 0 24 24"
            >
              <circle
                cx={12}
                cy={12}
                r={coarsePointer ? 9 : 4}
                fill="none"
                stroke="white"
                strokeWidth={coarsePointer ? 2.5 : 2}
              />
              <line
                x1={12}
                y1={2}
                x2={12}
                y2={coarsePointer ? 6 : 8}
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={12}
                y1={coarsePointer ? 18 : 16}
                x2={12}
                y2={22}
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={2}
                y1={12}
                x2={coarsePointer ? 6 : 8}
                y2={12}
                stroke="white"
                strokeWidth={2}
              />
              <line
                x1={coarsePointer ? 18 : 16}
                y1={12}
                x2={22}
                y2={12}
                stroke="white"
                strokeWidth={2}
              />
              <circle
                cx={12}
                cy={12}
                r={coarsePointer ? 3.5 : 2}
                fill={hover.hex}
                stroke="white"
                strokeWidth={1.5}
              />
            </svg>

            <div
              className="absolute overflow-hidden rounded-full border-4 border-white shadow-xl ring-1 ring-black/20"
              style={{
                left: loupeX - LOUPE_HALF,
                top: loupeY - LOUPE_HALF,
                width: LOUPE_SIZE,
                height: LOUPE_SIZE,
              }}
            >
              <canvas
                ref={loupeCanvasRef}
                className="block h-full w-full"
                style={{ imageRendering: "pixelated" }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-0.5 w-full -translate-x-1/2 -translate-y-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]"
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 h-full w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]"
                aria-hidden
              />
              <div
                className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ring-1 ring-black/40"
                style={{ backgroundColor: hover.hex }}
              />
            </div>

            <div
              className="pointer-events-none absolute z-40 flex items-center gap-1 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-medium leading-none text-stone-700 shadow ring-1 ring-stone-200"
              style={{
                left: hexLabel.hexLeft,
                top: hexLabel.hexTop,
                transform:
                  hexLabel.hexAnchor === "bottom"
                    ? "translate(-50%, -100%)"
                    : "translateX(-50%)",
              }}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-stone-300"
                style={{ backgroundColor: hover.hex }}
              />
              <span className="font-mono uppercase">{hover.hex}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {enabled && w > 0 && (
        <div
          className={`flex w-full max-w-full shrink-0 flex-wrap items-center justify-center gap-1 px-1 text-xs text-stone-500 ${
            overlayControls
              ? "pointer-events-auto absolute inset-x-1 bottom-1 z-20 gap-0.5 rounded-lg border border-stone-200/60 bg-white/90 px-1 py-0.5 backdrop-blur-sm"
              : fillContainer
                ? "py-1"
                : ""
          }`}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= MIN_ZOOM}
            className={`flex items-center justify-center rounded-md bg-white text-sm ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-40 ${
              overlayControls ? "h-7 w-7" : "min-h-11 min-w-11 text-base"
            }`}
            aria-label="缩小"
          >
            −
          </button>
          <span
            className={`text-center font-mono ${overlayControls ? "min-w-[2rem] text-[10px]" : "min-w-[3rem] text-sm"}`}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= MAX_ZOOM}
            className={`flex items-center justify-center rounded-md bg-white text-sm ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-40 ${
              overlayControls ? "h-7 w-7" : "min-h-11 min-w-11 text-base"
            }`}
            aria-label="放大"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
            className={`rounded-md bg-white ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-40 ${
              overlayControls ? "h-7 px-1.5 text-[10px]" : "min-h-11 px-3 py-2"
            }`}
          >
            重置
          </button>
          {!overlayControls && (
            <span className="w-full text-center text-stone-400 sm:w-auto">
              {coarsePointer
                ? "双指缩放 · 准心=取色点 · 松手确认"
                : "滚轮缩放 · 拖动查看颜色 · 点击取色"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
