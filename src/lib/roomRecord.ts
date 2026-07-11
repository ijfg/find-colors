import type { RoomPublicView } from "../lib/roomTypes";
import {
  compressToThumbnail,
  createRecordId,
  saveRecord,
} from "../utils/storage";
import { loadRoomMembership } from "./roomSession";

const SAVED_PREFIX = "color-game-room-record-saved:";

export async function saveRoomGameRecord(
  code: string,
  room: RoomPublicView,
  photoDataUrl: string,
): Promise<boolean> {
  const normalized = code.toUpperCase();
  if (sessionStorage.getItem(`${SAVED_PREFIX}${normalized}`)) {
    return false;
  }

  const membership = loadRoomMembership(normalized);
  if (!membership) return false;

  const entry = room.leaderboard?.find(
    (e) => e.playerId === membership.playerId,
  );
  if (
    !entry?.submitted ||
    !entry.userColors ||
    !entry.userPositions ||
    entry.totalScore === null ||
    !entry.perCellScores
  ) {
    return false;
  }

  try {
    const thumbnailDataUrl = await compressToThumbnail(photoDataUrl, 240);
    const { ok } = saveRecord({
      id: createRecordId(),
      createdAt: Date.now(),
      difficulty: room.challenge.difficulty,
      thumbnailDataUrl,
      targetColors: room.challenge.targetColors,
      userColors: entry.userColors,
      targetPositions: room.challenge.targetPositions,
      userPositions: entry.userPositions,
      totalScore: entry.totalScore,
      perCellScores: entry.perCellScores,
      mode: "room",
      roomCode: room.code,
      roomRank: entry.rank,
      roomPlayerCount: room.playerCount,
    });
    if (ok) {
      sessionStorage.setItem(`${SAVED_PREFIX}${normalized}`, "1");
    }
    return ok;
  } catch {
    return false;
  }
}
