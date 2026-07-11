/** Distinct hues for multi-player overlays — chosen for easy visual separation. */
const PLAYER_PALETTE = [
  "#E11D48",
  "#2563EB",
  "#CA8A04",
  "#7C3AED",
  "#059669",
  "#EA580C",
  "#0891B2",
  "#DB2777",
  "#4F46E5",
  "#65A30D",
  "#C026D3",
  "#0D9488",
] as const;

export function getPlayerColor(index: number): string {
  return PLAYER_PALETTE[index % PLAYER_PALETTE.length]!;
}

export function buildPlayerColorIndex(
  playerIds: string[],
): Map<string, number> {
  const map = new Map<string, number>();
  playerIds.forEach((id, i) => map.set(id, i));
  return map;
}
