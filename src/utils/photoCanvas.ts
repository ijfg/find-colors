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
