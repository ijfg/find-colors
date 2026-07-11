import type {
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  RoomPublicView,
  SubmitRoomPayload,
} from "./roomTypes";

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json() as Promise<T>;
}

export function roomPhotoUrl(code: string): string {
  return `/api/rooms/${code.toUpperCase()}/photo`;
}

export async function createRoom(
  payload: CreateRoomPayload,
): Promise<CreateRoomResponse> {
  return request<CreateRoomResponse>("/api/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRoom(code: string): Promise<RoomPublicView> {
  const data = await request<{ room: RoomPublicView }>(
    `/api/rooms/${code.toUpperCase()}`,
  );
  return data.room;
}

export async function joinRoom(
  code: string,
  payload: JoinRoomPayload,
): Promise<RoomPublicView> {
  const data = await request<{ room: RoomPublicView }>(
    `/api/rooms/${code.toUpperCase()}/join`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return data.room;
}

export async function submitRoom(
  code: string,
  payload: SubmitRoomPayload,
): Promise<RoomPublicView> {
  const data = await request<{ room: RoomPublicView }>(
    `/api/rooms/${code.toUpperCase()}/submit`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return data.room;
}

export async function updateRoomProgress(
  code: string,
  playerId: string,
  filledCount: number,
): Promise<RoomPublicView> {
  const data = await request<{ room: RoomPublicView }>(
    `/api/rooms/${code.toUpperCase()}/progress`,
    {
      method: "POST",
      body: JSON.stringify({ playerId, filledCount }),
    },
  );
  return data.room;
}

export async function fetchRoomPhotoObjectUrl(code: string): Promise<string> {
  const res = await fetch(roomPhotoUrl(code));
  if (!res.ok) throw new Error("Failed to load room photo");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
