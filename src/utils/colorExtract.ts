import type { Position } from "../types";
import { normalizePhotoDataUrl } from "./photoCanvas";

const SAMPLE_SIZE = 120;

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface PixelSample extends RGB {
  x: number;
  y: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface ColorBin {
  key: string;
  count: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

export function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function colorDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
    }
  }

  return { h: h * 360, s, l };
}

function getBinKey(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  const hBin = s < 0.08 ? "gray" : String(Math.floor(h / 20));
  const sBin = Math.min(3, Math.floor(s * 4));
  const lBin = Math.min(3, Math.floor(l * 4));
  return `${hBin}-${sBin}-${lBin}`;
}

function binAverage(bin: ColorBin): RGB {
  return {
    r: bin.sumR / bin.count,
    g: bin.sumG / bin.count,
    b: bin.sumB / bin.count,
  };
}

function computeMean(pixels: RGB[]): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const p of pixels) {
    r += p.r;
    g += p.g;
    b += p.b;
  }
  const n = pixels.length;
  return { r: r / n, g: g / n, b: b / n };
}

function chromaWeight(r: number, g: number, b: number): number {
  const { s, l } = rgbToHsl(r, g, b);
  if (s < 0.08) {
    return 0.15 + Math.abs(l - 0.5) * 0.35;
  }
  return 0.25 + s * (1 - Math.abs(l - 0.45) * 0.75);
}

function scoreBin(
  bin: ColorBin,
  total: number,
  mean: RGB,
  dominantAvgs: RGB[],
): number {
  const freq = bin.count / total;
  const avg = binAverage(bin);

  const rarity = Math.log(total / bin.count + 1);
  const chroma = chromaWeight(avg.r, avg.g, avg.b);
  const contrast = Math.min(1, Math.sqrt(colorDistance(avg, mean)) / 140);

  let bgPenalty = 1;
  if (freq > 0.12) bgPenalty *= 0.04;
  else if (freq > 0.07) bgPenalty *= 0.12;
  else if (freq > 0.04) bgPenalty *= 0.35;

  for (const dom of dominantAvgs) {
    const d = Math.sqrt(colorDistance(avg, dom));
    if (d < 35) bgPenalty *= 0.15;
    else if (d < 60) bgPenalty *= 0.45;
  }

  let accentBoost = 1;
  if (freq >= 0.004 && freq <= 0.08) accentBoost = 1.4;
  else if (freq < 0.004) accentBoost = 1.1;

  return rarity * chroma * (0.35 + 0.65 * contrast) * bgPenalty * accentBoost;
}

function pickRepresentativePixel(
  pixels: PixelSample[],
  binKey: string,
): PixelSample {
  const inBin = pixels.filter((p) => getBinKey(p.r, p.g, p.b) === binKey);
  if (inBin.length === 0) return pixels[0];

  let best = inBin[0];
  let bestScore = -1;
  for (const p of inBin) {
    const { s, l } = rgbToHsl(p.r, p.g, p.b);
    const score = s * 0.7 + Math.abs(l - 0.5) * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export interface ExtractColorOptions {
  /** 为 true 时在显著色候选中加入随机权重，同一照片可得到不同目标色 */
  random?: boolean;
  /** 「再玩一次」时排除与这些颜色过于接近的候选 */
  excludeColors?: string[];
}

function getHueFamily(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 0.10) {
    if (l < 0.28) return "neutral-dark";
    if (l < 0.58) return "neutral-mid";
    return "neutral-light";
  }
  return String(Math.floor(h / 30) % 12);
}

function isTooSimilarToExcluded(
  color: RGB,
  excludeColors: string[],
  minDist: number,
): boolean {
  if (excludeColors.length === 0) return false;
  const family = getHueFamily(color.r, color.g, color.b);
  const lum = luminance(color);

  return excludeColors.some((hex) => {
    const ex = hexToRgb(hex);
    if (colorDistance(color, ex) < minDist) return true;

    const exFamily = getHueFamily(ex.r, ex.g, ex.b);
    const lumDiff = Math.abs(lum - luminance(ex));

    if (family === exFamily) {
      if (family.startsWith("neutral-") && lumDiff < 42) return true;
      if (
        !family.startsWith("neutral-") &&
        lumDiff < 38 &&
        hueAngularDistance(color, ex) < 28
      ) {
        return true;
      }
    }

    return false;
  });
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function hueAngularDistance(a: RGB, b: RGB): number {
  const ha = rgbToHsl(a.r, a.g, a.b);
  const hb = rgbToHsl(b.r, b.g, b.b);
  if (ha.s < 0.10 && hb.s < 0.10) return 0;
  if (ha.s < 0.10 || hb.s < 0.10) return 90;
  let diff = Math.abs(ha.h - hb.h);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function pixelSalienceScore(
  p: PixelSample,
  total: number,
  bin: ColorBin,
  mean: RGB,
): number {
  const freq = bin.count / total;
  const rarity = Math.log(total / bin.count + 1);
  const chroma = chromaWeight(p.r, p.g, p.b);
  const contrast = Math.min(1, Math.sqrt(colorDistance(p, mean)) / 140);
  const freqPenalty = freq > 0.08 ? 0.15 : freq > 0.04 ? 0.4 : 1;
  return rarity * chroma * (0.35 + 0.65 * contrast) * freqPenalty;
}

interface HueFamilyPool {
  family: string;
  candidates: PixelSample[];
  weight: number;
}

function buildHueFamilyPools(
  pixels: PixelSample[],
  bins: Map<string, ColorBin>,
  total: number,
  mean: RGB,
): HueFamilyPool[] {
  const byFamily = new Map<string, { p: PixelSample; score: number }[]>();

  for (const p of pixels) {
    const key = getBinKey(p.r, p.g, p.b);
    const bin = bins.get(key);
    if (!bin || bin.count < 2) continue;

    const score = pixelSalienceScore(p, total, bin, mean);
    if (score < 0.003) continue;

    const family = getHueFamily(p.r, p.g, p.b);
    const list = byFamily.get(family) ?? [];
    list.push({ p, score });
    byFamily.set(family, list);
  }

  const pools: HueFamilyPool[] = [];

  for (const [family, items] of byFamily) {
    items.sort((a, b) => b.score - a.score);

    const candidates: PixelSample[] = [];
    for (const { p } of items) {
      if (candidates.length >= 10) break;
      if (candidates.every((c) => colorDistance(c, p) >= 700)) {
        candidates.push(p);
      }
    }
    if (candidates.length === 0) {
      candidates.push(items[0].p);
    }

    // 随机模式：各色系接近均等机会，避免总抽到主色
    const weight = 0.85 + Math.random() * 0.3;

    pools.push({ family, candidates, weight });
  }

  return pools;
}

function extractRandomSalientColors(
  pixels: PixelSample[],
  count: number,
  bins: Map<string, ColorBin>,
  total: number,
  mean: RGB,
  excludeColors: string[] = [],
): PixelSample[] {
  const familyPools = buildHueFamilyPools(pixels, bins, total, mean);
  if (familyPools.length === 0) {
    return Array.from({ length: count }, () => ({ ...mean, x: 0.5, y: 0.5 }));
  }

  const excludeDist = count <= 1 ? 9000 : count <= 4 ? 4800 : 2400;
  const minHueSep = count <= 1 ? 0 : count <= 4 ? 55 : 40;
  const minRgbSep = count <= 1 ? 0 : count <= 4 ? 1800 : 1200;

  function candidateOk(color: PixelSample): boolean {
    if (isTooSimilarToExcluded(color, excludeColors, excludeDist)) return false;
    if (
      minRgbSep > 0 &&
      !selected.every((s) => colorDistance(s, color) >= minRgbSep)
    ) {
      return false;
    }
    if (
      minHueSep > 0 &&
      !selected.every((s) => hueAngularDistance(s, color) >= minHueSep)
    ) {
      return false;
    }
    return true;
  }

  const selected: PixelSample[] = [];

  const excludedFamilies = new Set(
    excludeColors.map((hex) => {
      const rgb = hexToRgb(hex);
      return getHueFamily(rgb.r, rgb.g, rgb.b);
    }),
  );

  const diversePools =
    count <= 4 && excludedFamilies.size > 0
      ? shuffleInPlace([
          ...familyPools.filter((p) => !excludedFamilies.has(p.family)),
          ...familyPools.filter((p) => excludedFamilies.has(p.family)),
        ])
      : shuffleInPlace([...familyPools]);

  function pickRandomCandidate(pool: HueFamilyPool): PixelSample | null {
    const eligible = shuffleInPlace([...pool.candidates]).filter(candidateOk);
    return eligible[0] ?? null;
  }

  const shuffledPools = diversePools;

  for (const pool of shuffledPools) {
    if (selected.length >= count) break;
    const color = pickRandomCandidate(pool);
    if (color) selected.push({ ...color });
  }

  if (selected.length < count) {
    const flat = shuffleInPlace(
      familyPools.flatMap((pool) => pool.candidates),
    );
    for (const candidate of flat) {
      if (selected.length >= count) break;
      if (candidateOk(candidate)) selected.push({ ...candidate });
    }
  }

  if (selected.length < count) {
    const relaxedDist = Math.max(1200, excludeDist * 0.45);
    for (const pool of shuffleInPlace([...familyPools])) {
      if (selected.length >= count) break;
      for (const candidate of shuffleInPlace([...pool.candidates])) {
        if (selected.length >= count) break;
        if (isTooSimilarToExcluded(candidate, excludeColors, relaxedDist)) {
          continue;
        }
        if (selected.every((s) => colorDistance(s, candidate) >= 900)) {
          selected.push({ ...candidate });
        }
      }
    }
  }

  while (selected.length < count) {
    selected.push({ ...mean, x: 0.5, y: 0.5 });
  }

  return sortByLuminance(selected.slice(0, count));
}

function extractSalientColors(
  pixels: PixelSample[],
  count: number,
  options?: ExtractColorOptions,
): PixelSample[] {
  const random = options?.random ?? false;
  const baseSep =
    count <= 1 ? 0 : count <= 4 ? 6500 : count <= 9 ? 4500 : 2800;
  const midSep = count <= 1 ? 0 : count <= 4 ? 3000 : count <= 9 ? 2000 : 1400;
  const lowSep = count <= 1 ? 0 : count <= 4 ? 1500 : count <= 9 ? 1100 : 900;
  const minSep = count <= 1 ? 0 : count <= 4 ? 700 : count <= 9 ? 500 : 400;

  const total = pixels.length;
  const mean = computeMean(pixels);

  const bins = new Map<string, ColorBin>();
  for (const p of pixels) {
    const key = getBinKey(p.r, p.g, p.b);
    const bin = bins.get(key) ?? {
      key,
      count: 0,
      sumR: 0,
      sumG: 0,
      sumB: 0,
    };
    bin.count++;
    bin.sumR += p.r;
    bin.sumG += p.g;
    bin.sumB += p.b;
    bins.set(key, bin);
  }

  const binList = [...bins.values()].sort((a, b) => b.count - a.count);

  if (random) {
    return extractRandomSalientColors(
      pixels,
      count,
      bins,
      total,
      mean,
      options?.excludeColors ?? [],
    );
  }

  const dominantAvgs = binList
    .filter((b) => b.count / total > 0.035)
    .slice(0, 6)
    .map(binAverage);

  let scored = binList
    .filter((b) => b.count >= 2)
    .map((bin) => ({
      bin,
      score: scoreBin(bin, total, mean, dominantAvgs),
      color: pickRepresentativePixel(pixels, bin.key),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: PixelSample[] = [];

  function tryAdd(color: PixelSample, minSep: number): boolean {
    if (selected.length >= count) return false;
    if (selected.every((s) => colorDistance(s, color) >= minSep)) {
      selected.push({ ...color });
      return true;
    }
    return false;
  }

  for (const { color, score } of scored) {
    if (selected.length >= count) break;
    if (score < 0.008) continue;
    tryAdd(color, baseSep);
  }

  if (selected.length < count) {
    for (const { color } of scored) {
      if (selected.length >= count) break;
      tryAdd(color, midSep);
    }
  }

  if (selected.length < count) {
    let pixelScores = pixels.map((p) => {
      const key = getBinKey(p.r, p.g, p.b);
      const bin = bins.get(key)!;
      const freq = bin.count / total;
      const rarity = Math.log(total / bin.count + 1);
      const chroma = chromaWeight(p.r, p.g, p.b);
      const contrast = Math.min(
        1,
        Math.sqrt(colorDistance(p, mean)) / 140,
      );
      const freqPenalty = freq > 0.08 ? 0.1 : freq > 0.04 ? 0.35 : 1;
      return {
        p,
        score: rarity * chroma * (0.35 + 0.65 * contrast) * freqPenalty,
      };
    });
    pixelScores.sort((a, b) => b.score - a.score);

    for (const { p } of pixelScores) {
      if (selected.length >= count) break;
      tryAdd(p, lowSep);
    }
  }

  if (selected.length < count) {
    for (const { color } of scored) {
      if (selected.length >= count) break;
      tryAdd(color, minSep);
    }
  }

  while (selected.length < count) {
    selected.push({ ...mean, x: 0.5, y: 0.5 });
  }

  return sortByLuminance(selected.slice(0, count));
}

function samplePixels(imageData: ImageData): PixelSample[] {
  const { data, width, height } = imageData;
  const pixels: PixelSample[] = [];
  const step = 2;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (a < 128) continue;
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        x: (x + 0.5) / width,
        y: (y + 0.5) / height,
      });
    }
  }

  return pixels;
}

function luminance(color: RGB): number {
  return 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
}

function sortByLuminance(pixels: PixelSample[]): PixelSample[] {
  return [...pixels].sort((a, b) => luminance(b) - luminance(a));
}

export async function extractColorsFromImage(
  source: string | File,
  count: number,
  options?: ExtractColorOptions,
): Promise<{ colors: string[]; positions: Position[]; dataUrl: string }> {
  const dataUrl =
    typeof source === "string"
      ? source
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(source);
        });

  const normalizedDataUrl = await normalizePhotoDataUrl(dataUrl);

  const img = await loadImage(normalizedDataUrl);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, SAMPLE_SIZE / Math.max(img.width, img.height));
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = samplePixels(imageData);

  if (pixels.length === 0) {
    return {
      colors: Array(count).fill("#808080"),
      positions: Array.from({ length: count }, () => ({ x: 0.5, y: 0.5 })),
      dataUrl: normalizedDataUrl,
    };
  }

  const salient = extractSalientColors(pixels, count, options);
  const colors = salient.map((p) => rgbToHex(p.r, p.g, p.b));
  const positions = salient.map((p) => ({ x: p.x, y: p.y }));

  return { colors, positions, dataUrl: normalizedDataUrl };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}
