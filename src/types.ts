export type Difficulty = 1 | 4 | 9 | 16;

export interface Position {
  x: number;
  y: number;
}

export interface ScoreDetail {
  index: number;
  target: string;
  guess: string;
  targetPos: Position;
  guessPos: Position;
  deltaE: number;
  score: number;
}

export interface GameResult {
  total: number;
  details: ScoreDetail[];
}

export interface GameRecord {
  id: string;
  createdAt: number;
  difficulty: Difficulty;
  thumbnailDataUrl: string;
  targetColors: string[];
  userColors: string[];
  targetPositions: Position[];
  userPositions: Position[];
  totalScore: number;
  perCellScores: number[];
}
