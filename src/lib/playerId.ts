const PLAYER_ID_KEY = "color-game-player-id";

function newPlayerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getPlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const id = newPlayerId();
    localStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    return newPlayerId();
  }
}
