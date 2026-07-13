export interface PhotoCanvasLayout {
  cssWidth: number;
  cssHeight: number;
  bufferWidth: number;
  bufferHeight: number;
}

export function computePhotoCanvasLayout(
  imgWidth: number,
  imgHeight: number,
  containerWidth: number,
  maxHeight: number,
  devicePixelRatio = typeof window !== "undefined"
    ? window.devicePixelRatio || 1
    : 1,
): PhotoCanvasLayout {
  const fitScale = Math.min(
    1,
    containerWidth / imgWidth,
    maxHeight / imgHeight,
  );
  const cssWidth = Math.max(1, Math.round(imgWidth * fitScale));
  const cssHeight = Math.max(1, Math.round(imgHeight * fitScale));

  const maxDprFromSource = Math.min(
    imgWidth / cssWidth,
    imgHeight / cssHeight,
  );
  const dpr = Math.min(Math.max(devicePixelRatio, 1), maxDprFromSource, 3);

  return {
    cssWidth,
    cssHeight,
    bufferWidth: Math.max(1, Math.round(cssWidth * dpr)),
    bufferHeight: Math.max(1, Math.round(cssHeight * dpr)),
  };
}

export function drawPhotoToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  layout: PhotoCanvasLayout,
): CanvasRenderingContext2D | null {
  canvas.width = layout.bufferWidth;
  canvas.height = layout.bufferHeight;
  canvas.style.width = `${layout.cssWidth}px`;
  canvas.style.height = `${layout.cssHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, layout.bufferWidth, layout.bufferHeight);
  return ctx;
}

/**
 * Draw a square zoom crop centered on (cx, cy) in source pixel space.
 * Near edges, the sample stays in the middle of the tile (letterboxed)
 * so the crosshair always marks the true pick — not a shifted clamp.
 */
export function drawCenteredCrop(
  dest: HTMLCanvasElement | CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  cx: number,
  cy: number,
  radius: number,
  displaySize: number,
  options?: {
    fillStyle?: string;
    imageSmoothingEnabled?: boolean;
  },
): CanvasRenderingContext2D | null {
  const ctx =
    dest instanceof HTMLCanvasElement ? dest.getContext("2d") : dest;
  if (!ctx) return null;

  if (dest instanceof HTMLCanvasElement) {
    dest.width = displaySize;
    dest.height = displaySize;
  }

  const half = radius;
  const srcLeft = cx - half;
  const srcTop = cy - half;
  const srcSize = half * 2;

  ctx.imageSmoothingEnabled = options?.imageSmoothingEnabled ?? false;
  ctx.fillStyle = options?.fillStyle ?? "#e7e5e4";
  ctx.fillRect(0, 0, displaySize, displaySize);

  const clippedLeft = Math.max(0, srcLeft);
  const clippedTop = Math.max(0, srcTop);
  const clippedRight = Math.min(source.width, srcLeft + srcSize);
  const clippedBottom = Math.min(source.height, srcTop + srcSize);
  const clippedW = clippedRight - clippedLeft;
  const clippedH = clippedBottom - clippedTop;

  if (clippedW > 0 && clippedH > 0 && srcSize > 0) {
    const destLeft = ((clippedLeft - srcLeft) / srcSize) * displaySize;
    const destTop = ((clippedTop - srcTop) / srcSize) * displaySize;
    const destW = (clippedW / srcSize) * displaySize;
    const destH = (clippedH / srcSize) * displaySize;
    ctx.drawImage(
      source,
      clippedLeft,
      clippedTop,
      clippedW,
      clippedH,
      destLeft,
      destTop,
      destW,
      destH,
    );
  }

  return ctx;
}

export function drawCropCrosshair(
  ctx: CanvasRenderingContext2D,
  displaySize: number,
  hex: string,
  stroke: string,
): void {
  const center = displaySize / 2;
  const cross = Math.max(6, Math.round(displaySize * 0.09));
  const dot = Math.max(3, Math.round(displaySize * 0.04));

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(center - cross, center);
  ctx.lineTo(center + cross, center);
  ctx.moveTo(center, center - cross);
  ctx.lineTo(center, center + cross);
  ctx.stroke();

  ctx.fillStyle = hex;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, dot, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

const MAX_PHOTO_LONG_EDGE = 2560;

export async function normalizePhotoDataUrl(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const longEdge = Math.max(img.width, img.height);
  if (longEdge <= MAX_PHOTO_LONG_EDGE) return dataUrl;

  const scale = MAX_PHOTO_LONG_EDGE / longEdge;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load"));
    img.src = src;
  });
}
