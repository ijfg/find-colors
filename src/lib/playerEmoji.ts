/** Cute fruits, veggies, plants, and animals for per-room player identity. */
export const PLAYER_EMOJIS = [
  // Fruits
  "🍎",
  "🍊",
  "🍋",
  "🍇",
  "🍓",
  "🍑",
  "🥝",
  "🍒",
  "🍉",
  "🍌",
  "🍍",
  "🥭",
  "🫐",
  "🍈",
  // Vegetables & mushrooms
  "🥕",
  "🌽",
  "🥒",
  "🍅",
  "🫑",
  "🥬",
  "🍄",
  "🫛",
  // Plants & flowers
  "🌻",
  "🌸",
  "🌺",
  "🌷",
  "🌼",
  "🪷",
  "🍀",
  "🌵",
  "🌱",
  "🪴",
  // Land animals
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🦄",
  "🐢",
  "🐣",
  "🐥",
  "🦔",
  "🐿️",
  "🦖",
  "🦥",
  "🦦",
  // Insects
  "🐛",
  "🦋",
  "🐝",
  "🐞",
  // Birds
  "🦉",
  "🐧",
  "🦆",
  "🦜",
  "🐤",
  // Sea life
  "🐙",
  "🐠",
  "🐳",
  "🐡",
  "🦀",
  "🦞",
  "🦭",
  "🐬",
  "🐚",
  "🦑",
  "🐟",
  "🪼",
  "🦐",
] as const;

function hashLabel(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) {
    h = (Math.imul(31, h) + label.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function pickEmojiForPlayer(
  displayName: string,
  playerId: string,
  used: Set<string>,
): string {
  let idx = hashLabel(displayName + playerId) % PLAYER_EMOJIS.length;
  for (let n = 0; n < PLAYER_EMOJIS.length; n++) {
    const emoji = PLAYER_EMOJIS[(idx + n) % PLAYER_EMOJIS.length]!;
    if (!used.has(emoji)) return emoji;
  }
  return PLAYER_EMOJIS[used.size % PLAYER_EMOJIS.length]!;
}

export function buildPlayerEmojiMap(
  players: Array<{ playerId: string; displayName: string; emoji?: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set<string>();

  for (const p of players) {
    if (p.emoji && !used.has(p.emoji)) {
      map.set(p.playerId, p.emoji);
      used.add(p.emoji);
    }
  }

  for (const p of players) {
    if (map.has(p.playerId)) continue;
    const emoji = pickEmojiForPlayer(p.displayName, p.playerId, used);
    map.set(p.playerId, emoji);
    used.add(emoji);
  }

  return map;
}

export function getPlayerEmoji(
  map: Map<string, string>,
  playerId: string,
): string {
  return map.get(playerId) ?? "🎮";
}

export function previewEmoji(displayName: string, playerId: string): string {
  return pickEmojiForPlayer(displayName.trim() || "?", playerId, new Set());
}
