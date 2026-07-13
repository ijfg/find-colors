import { kv } from "@vercel/kv";
import type { Room } from "./types.js";

const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60;
const memoryRooms = new Map<string, Room>();

function useMemoryStore(): boolean {
  return !process.env.KV_REST_API_URL;
}

function roomKey(code: string): string {
  return `room:${code.toUpperCase()}`;
}

export async function getRoom(code: string): Promise<Room | null> {
  const normalized = code.toUpperCase();
  if (useMemoryStore()) {
    return memoryRooms.get(normalized) ?? null;
  }
  return (await kv.get<Room>(roomKey(normalized))) ?? null;
}

export async function saveRoom(room: Room): Promise<void> {
  const normalized = room.code.toUpperCase();
  room.code = normalized;
  if (useMemoryStore()) {
    memoryRooms.set(normalized, room);
    return;
  }
  await kv.set(roomKey(normalized), room, { ex: ROOM_TTL_SECONDS });
}

export async function roomCodeExists(code: string): Promise<boolean> {
  const room = await getRoom(code);
  return room !== null;
}

export { ROOM_TTL_SECONDS };
