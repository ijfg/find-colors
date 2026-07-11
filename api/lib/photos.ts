import { put, head } from "@vercel/blob";
import type { Room } from "./types.js";

const memoryPhotos = new Map<string, Buffer>();

function useMemoryPhotos(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN;
}

export async function saveRoomPhoto(
  code: string,
  bytes: Buffer,
): Promise<string> {
  const key = `rooms/${code.toUpperCase()}.jpg`;
  if (useMemoryPhotos()) {
    memoryPhotos.set(key, bytes);
    return key;
  }
  const blob = await put(key, bytes, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: false,
  });
  return blob.pathname;
}

export async function getRoomPhotoBytes(key: string): Promise<Buffer | null> {
  if (useMemoryPhotos()) {
    return memoryPhotos.get(key) ?? null;
  }
  try {
    const meta = await head(key);
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export function parsePhotoBase64(input: string): Buffer {
  const base64 = input.includes(",") ? input.split(",")[1]! : input;
  return Buffer.from(base64, "base64");
}

export function validatePhotoSize(bytes: Buffer): boolean {
  return bytes.length > 0 && bytes.length <= 1.5 * 1024 * 1024;
}
