import { computeResult } from "./scoring.js";
import {
  getRoomPhotoBytes,
  parsePhotoBase64,
  saveRoomPhoto,
  validatePhotoSize,
} from "./photos.js";
import { ensureRoomEmojis } from "./playerEmoji.js";
import { getRoom, roomCodeExists, saveRoom } from "./store.js";
import type {
  LeaderboardEntry,
  Room,
  RoomChallenge,
  RoomPlayer,
  RoomPublicView,
  RoomSubmission,
} from "./types.js";

export const MAX_PLAYERS = 12;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_DEADLINE_MINUTES = 60;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateRoomCode();
    if (!(await roomCodeExists(code))) return code;
  }
  throw new Error("Could not allocate room code");
}

function normalizeName(name: string): string {
  return name.trim().slice(0, 24);
}

function countSubmitted(room: Room): number {
  return room.players.filter((p) => room.submissions[p.playerId]).length;
}

function maybeReveal(room: Room): Room {
  if (room.status !== "open") return room;
  const now = Date.now();
  const allSubmitted =
    room.players.length > 0 &&
    room.players.every((p) => room.submissions[p.playerId]);
  if (allSubmitted) {
    room.status = "revealed";
    room.revealReason = "all_submitted";
    return room;
  }
  if (now >= room.deadlineAt) {
    room.status = "revealed";
    room.revealReason = "deadline";
    return room;
  }
  return room;
}

function buildLeaderboard(room: Room): LeaderboardEntry[] {
  const entries = room.players.map((p) => {
    const sub = room.submissions[p.playerId];
    return {
      playerId: p.playerId,
      displayName: p.displayName,
      totalScore: sub?.totalScore ?? null,
      perCellScores: sub?.perCellScores ?? null,
      userColors: sub?.userColors ?? null,
      userPositions: sub?.userPositions ?? null,
      submitted: Boolean(sub),
      rank: 0,
    };
  });
  entries.sort((a, b) => {
    if (a.submitted !== b.submitted) return a.submitted ? -1 : 1;
    if (a.totalScore === null && b.totalScore === null) return 0;
    if (a.totalScore === null) return 1;
    if (b.totalScore === null) return -1;
    return b.totalScore - a.totalScore;
  });
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}

export function toPublicView(room: Room): RoomPublicView {
  const revealed = room.status === "revealed";
  return {
    code: room.code,
    status: room.status,
    createdAt: room.createdAt,
    deadlineAt: room.deadlineAt,
    hostPlayerId: room.hostPlayerId,
    hostName: room.hostName,
    challenge: room.challenge,
    playerCount: room.players.length,
    submittedCount: countSubmitted(room),
    players: room.players.map((p) => {
      const submitted = Boolean(room.submissions[p.playerId]);
      const filledCount = submitted
        ? room.challenge.difficulty
        : (room.progress?.[p.playerId]?.filledCount ?? 0);
      return {
        ...p,
        submitted,
        filledCount,
      };
    }),
    revealReason: room.revealReason,
    leaderboard: revealed ? buildLeaderboard(room) : undefined,
  };
}

function validateChallenge(challenge: RoomChallenge): string | null {
  const n = challenge.difficulty;
  if (![1, 4, 9, 16].includes(n)) return "Invalid difficulty";
  if (challenge.targetColors.length !== n) return "Invalid targetColors length";
  if (challenge.targetPositions.length !== n) {
    return "Invalid targetPositions length";
  }
  return null;
}

export async function createRoom(input: {
  hostPlayerId: string;
  hostName: string;
  photoBase64: string;
  challenge: RoomChallenge;
  deadlineMinutes?: number;
  /** @deprecated use deadlineMinutes */
  deadlineHours?: number;
}): Promise<{ room: Room; publicView: RoomPublicView }> {
  const challengeError = validateChallenge(input.challenge);
  if (challengeError) throw new Error(challengeError);

  const photoBytes = parsePhotoBase64(input.photoBase64);
  if (!validatePhotoSize(photoBytes)) {
    throw new Error("Photo too large (max 1.5MB)");
  }

  const hostName = normalizeName(input.hostName);
  if (!hostName) throw new Error("Host name required");

  const code = await generateUniqueRoomCode();
  const blobPhotoKey = await saveRoomPhoto(code, photoBytes);
  const minutes =
    input.deadlineMinutes ??
    (input.deadlineHours != null ? input.deadlineHours * 60 : DEFAULT_DEADLINE_MINUTES);
  const createdAt = Date.now();

  const hostPlayer: RoomPlayer = {
    playerId: input.hostPlayerId,
    displayName: hostName,
  };

  const room: Room = {
    code,
    status: "open",
    createdAt,
    deadlineAt: createdAt + minutes * 60 * 1000,
    hostPlayerId: input.hostPlayerId,
    hostName,
    challenge: input.challenge,
    blobPhotoKey,
    players: [hostPlayer],
    submissions: {},
  };
  ensureRoomEmojis(room.players);

  await saveRoom(room);
  return { room, publicView: toPublicView(room) };
}

export async function loadRoomPublic(code: string): Promise<RoomPublicView | null> {
  let room = await getRoom(code);
  if (!room) return null;
  room = maybeReveal(room);
  if (room.status === "revealed") {
    await saveRoom(room);
  }
  return toPublicView(room);
}

export async function joinRoom(
  code: string,
  playerId: string,
  displayName: string,
): Promise<RoomPublicView> {
  let room = await getRoom(code);
  if (!room) throw new Error("Room not found");
  room = maybeReveal(room);
  if (room.status !== "open") throw new Error("Room is closed");

  const name = normalizeName(displayName);
  if (!name) throw new Error("Name required");

  const existing = room.players.find((p) => p.playerId === playerId);
  if (existing) {
    existing.displayName = name;
  } else {
    if (room.players.length >= MAX_PLAYERS) throw new Error("Room is full");
    room.players.push({ playerId, displayName: name });
    ensureRoomEmojis(room.players);
  }

  await saveRoom(room);
  return toPublicView(room);
}

export async function submitToRoom(
  code: string,
  playerId: string,
  userColors: string[],
  userPositions: RoomSubmission["userPositions"],
  clientTotal: number,
  clientPerCell: number[],
): Promise<RoomPublicView> {
  let room = await getRoom(code);
  if (!room) throw new Error("Room not found");
  room = maybeReveal(room);
  if (room.status !== "open") {
    return toPublicView(room);
  }

  if (!room.players.some((p) => p.playerId === playerId)) {
    throw new Error("Not in room");
  }
  if (room.submissions[playerId]) {
    throw new Error("Already submitted");
  }

  const { difficulty, targetColors, targetPositions } = room.challenge;
  if (userColors.length !== difficulty || userPositions.length !== difficulty) {
    throw new Error("Invalid submission length");
  }

  const computed = computeResult(
    targetColors,
    userColors,
    targetPositions,
    userPositions,
  );

  if (
    computed.total !== clientTotal ||
    computed.perCellScores.some((s, i) => s !== clientPerCell[i])
  ) {
    throw new Error("Score mismatch");
  }

  const player = room.players.find((p) => p.playerId === playerId)!;
  room.submissions[playerId] = {
    playerId,
    displayName: player.displayName,
    submittedAt: Date.now(),
    userColors,
    userPositions,
    totalScore: computed.total,
    perCellScores: computed.perCellScores,
  };

  room = maybeReveal(room);
  await saveRoom(room);
  return toPublicView(room);
}

export async function getRoomPhoto(code: string): Promise<Buffer | null> {
  const room = await getRoom(code);
  if (!room) return null;
  return getRoomPhotoBytes(room.blobPhotoKey);
}

export async function updateRoomProgress(
  code: string,
  playerId: string,
  filledCount: number,
): Promise<RoomPublicView> {
  let room = await getRoom(code);
  if (!room) throw new Error("Room not found");
  room = maybeReveal(room);
  if (room.status !== "open") return toPublicView(room);
  if (!room.players.some((p) => p.playerId === playerId)) {
    throw new Error("Not in room");
  }
  if (room.submissions[playerId]) return toPublicView(room);

  const max = room.challenge.difficulty;
  const clamped = Math.max(0, Math.min(max, Math.floor(filledCount)));
  if (!room.progress) room.progress = {};
  room.progress[playerId] = { filledCount: clamped, updatedAt: Date.now() };
  await saveRoom(room);
  return toPublicView(room);
}

export function getShareUrl(code: string, origin?: string): string {
  const base = origin ?? "https://www.findcolors.app";
  return `${base}/r/${code.toUpperCase()}`;
}
