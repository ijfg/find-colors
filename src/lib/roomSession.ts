const PREFIX = "color-game-room:";

export interface RoomMembership {
  code: string;
  playerId: string;
  displayName: string;
  submitted: boolean;
}

function key(code: string): string {
  return `${PREFIX}${code.toUpperCase()}`;
}

export function saveRoomMembership(m: RoomMembership): void {
  try {
    localStorage.setItem(key(m.code), JSON.stringify(m));
  } catch {
    // ignore
  }
}

export function loadRoomMembership(code: string): RoomMembership | null {
  try {
    const raw = localStorage.getItem(key(code.toUpperCase()));
    return raw ? (JSON.parse(raw) as RoomMembership) : null;
  } catch {
    return null;
  }
}

export function markRoomSubmitted(code: string): void {
  const m = loadRoomMembership(code);
  if (!m) return;
  saveRoomMembership({ ...m, submitted: true });
}

export function clearRoomMembership(code: string): void {
  try {
    localStorage.removeItem(key(code));
  } catch {
    // ignore
  }
}

const PLAYING_PREFIX = "color-game-room-playing:";

export function markRoomPlaying(code: string): void {
  try {
    sessionStorage.setItem(`${PLAYING_PREFIX}${code.toUpperCase()}`, "1");
  } catch {
    // ignore
  }
}

export function clearRoomPlaying(code: string): void {
  try {
    sessionStorage.removeItem(`${PLAYING_PREFIX}${code.toUpperCase()}`);
  } catch {
    // ignore
  }
}

export function isRoomPlaying(code: string): boolean {
  try {
    return sessionStorage.getItem(`${PLAYING_PREFIX}${code.toUpperCase()}`) === "1";
  } catch {
    return false;
  }
}
