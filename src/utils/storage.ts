import type { Difficulty, GameRecord, GameResult, Position } from "../types";

const KEY = "color-game-records";
const SESSION_KEY = "color-game-active-session";
const MAX_RECORDS = 50;

export interface GameSeed {
  id: number;
  photoDataUrl: string;
  targetColors: string[];
  targetPositions: Position[];
  difficulty: Difficulty;
}

export interface PersistedGameState {
  userColors: string[];
  userPositions: Position[];
  activeIndex: number | null;
  result: GameResult | null;
}

export interface PersistedSession {
  version: 1;
  view: "home" | "game" | "records";
  difficulty: Difficulty;
  seed: GameSeed;
  gameState?: PersistedGameState;
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createRecordId(): string {
  return newId();
}

export async function compressToThumbnail(
  dataUrl: string,
  maxSize = 240,
  quality = 0.65,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image load"));
    img.src = dataUrl;
  });
}

export function loadRecords(): GameRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GameRecord[]) : [];
  } catch {
    return [];
  }
}

function tryWriteRecords(list: GameRecord[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function saveRecord(
  rec: GameRecord,
): { ok: boolean; records: GameRecord[] } {
  let list = [rec, ...loadRecords()].slice(0, MAX_RECORDS);
  if (tryWriteRecords(list)) {
    return { ok: true, records: list };
  }

  while (list.length > 1) {
    list = list.slice(0, Math.ceil(list.length / 2));
    if (tryWriteRecords(list)) {
      return { ok: true, records: list };
    }
  }

  return { ok: false, records: loadRecords() };
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PersistedSession;
    if (session.version !== 1 || !session.seed?.photoDataUrl) return null;
    return session;
  } catch {
    return null;
  }
}

export async function saveSession(
  session: PersistedSession,
): Promise<boolean> {
  const write = (value: PersistedSession) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  if (write(session)) return true;

  try {
    const compressed = await compressToThumbnail(
      session.seed.photoDataUrl,
      960,
      0.72,
    );
    return write({
      ...session,
      seed: { ...session.seed, photoDataUrl: compressed },
    });
  } catch {
    return false;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function deleteRecord(id: string): GameRecord[] {
  const list = loadRecords().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function clearRecords(): void {
  localStorage.removeItem(KEY);
}
