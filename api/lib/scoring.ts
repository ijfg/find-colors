import type { Position } from "./types.js";

interface Lab {
  L: number;
  a: number;
  b: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function sRgbToLinear(v: number): number {
  const n = v / 255;
  return n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
}

function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const R = sRgbToLinear(r) * 100;
  const G = sRgbToLinear(g) * 100;
  const B = sRgbToLinear(b) * 100;
  const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  return [x, y, z];
}

function xyzToLab(x: number, y: number, z: number): Lab {
  const xRef = 95.047;
  const yRef = 100;
  const zRef = 108.883;
  const f = (t: number) =>
    t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(x / xRef);
  const fy = f(y / yRef);
  const fz = f(z / zRef);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

function hexToLab(hex: string): Lab {
  const { r, g, b } = hexToRgb(hex);
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

function deltaE(hex1: string, hex2: string): number {
  const a = hexToLab(hex1);
  const b = hexToLab(hex2);
  const dL = a.L - b.L;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

function scoreFromDeltaE(de: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - de * 1.5)));
}

export function computeResult(
  targetColors: string[],
  userColors: string[],
  targetPositions: Position[],
  userPositions: Position[],
): { total: number; perCellScores: number[] } {
  const perCellScores = targetColors.map((target, index) => {
    const guess = userColors[index] ?? "#000000";
    return scoreFromDeltaE(deltaE(target, guess));
  });
  const total = Math.round(
    perCellScores.reduce((sum, s) => sum + s, 0) / perCellScores.length,
  );
  return { total, perCellScores };
}
