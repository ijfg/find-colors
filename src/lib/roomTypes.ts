import type { Difficulty, Position } from "../types";

export type RoomStatus = "open" | "revealed" | "expired";

export interface RoomChallenge {
  difficulty: Difficulty;
  targetColors: string[];
  targetPositions: Position[];
  extractVersion: 1;
}

export interface RoomSubmission {
  playerId: string;
  displayName: string;
  submittedAt: number;
  userColors: string[];
  userPositions: Position[];
  totalScore: number;
  perCellScores: number[];
}

export interface RoomPlayer {
  playerId: string;
  displayName: string;
  emoji?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  totalScore: number | null;
  perCellScores: number[] | null;
  userColors: string[] | null;
  userPositions: Position[] | null;
  submitted: boolean;
  rank: number;
}

export interface RoomPublicView {
  code: string;
  status: RoomStatus;
  createdAt: number;
  deadlineAt: number;
  hostPlayerId: string;
  hostName: string;
  challenge: RoomChallenge;
  playerCount: number;
  submittedCount: number;
  players: Array<RoomPlayer & { submitted: boolean; filledCount: number }>;
  revealReason?: "all_submitted" | "deadline";
  leaderboard?: LeaderboardEntry[];
}

export interface CreateRoomPayload {
  hostPlayerId: string;
  hostName: string;
  photoBase64: string;
  challenge: RoomChallenge;
  deadlineMinutes?: number;
}

export interface CreateRoomResponse {
  code: string;
  shareUrl: string;
  room: RoomPublicView;
}

export interface JoinRoomPayload {
  playerId: string;
  displayName: string;
}

export interface SubmitRoomPayload {
  playerId: string;
  userColors: string[];
  userPositions: Position[];
  totalScore: number;
  perCellScores: number[];
}
