export type Difficulty = 1 | 4 | 9 | 16;

export interface Position {
  x: number;
  y: number;
}

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

export interface RoomPlayerProgress {
  filledCount: number;
  updatedAt: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  createdAt: number;
  deadlineAt: number;
  hostPlayerId: string;
  hostName: string;
  challenge: RoomChallenge;
  blobPhotoKey: string;
  players: RoomPlayer[];
  submissions: Record<string, RoomSubmission>;
  progress?: Record<string, RoomPlayerProgress>;
  revealReason?: "all_submitted" | "deadline";
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
