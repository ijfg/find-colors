import type { VercelRequest, VercelResponse } from "@vercel/node";
import { updateRoomProgress } from "../../lib/roomService.js";
import {
  error,
  getCodeParam,
  json,
  methodNotAllowed,
  readJsonBody,
} from "../../lib/http.js";

interface ProgressBody {
  playerId?: string;
  filledCount?: number;
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
    const body = readJsonBody<ProgressBody>(req);
    if (!body.playerId || body.filledCount === undefined) {
      error(res, 400, "Missing playerId or filledCount");
      return;
    }

    const room = await updateRoomProgress(code, body.playerId, body.filledCount);
    json(res, 200, { room });
  } catch (e) {
    error(res, 400, e instanceof Error ? e.message : "Progress update failed");
  }
}
