import type { VercelRequest, VercelResponse } from "@vercel/node";
import { submitToRoom } from "../../lib/roomService.js";
import {
  error,
  getCodeParam,
  json,
  methodNotAllowed,
  readJsonBody,
} from "../../lib/http.js";

interface SubmitBody {
  playerId?: string;
  userColors?: string[];
  userPositions?: Array<{ x: number; y: number }>;
  totalScore?: number;
  perCellScores?: number[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  const code = getCodeParam(req);
  if (!code) {
    error(res, 400, "Room code required");
    return;
  }

  try {
    const body = readJsonBody<SubmitBody>(req);
    if (
      !body.playerId ||
      !body.userColors ||
      !body.userPositions ||
      body.totalScore === undefined ||
      !body.perCellScores
    ) {
      error(res, 400, "Missing submission fields");
      return;
    }

    const room = await submitToRoom(
      code,
      body.playerId,
      body.userColors,
      body.userPositions,
      body.totalScore,
      body.perCellScores,
    );
    json(res, 200, { room });
  } catch (e) {
    error(res, 400, e instanceof Error ? e.message : "Submit failed");
  }
}
