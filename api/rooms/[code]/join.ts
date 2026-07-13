import type { VercelRequest, VercelResponse } from "@vercel/node";
import { joinRoom } from "../../_lib/roomService.js";
import {
  error,
  getCodeParam,
  json,
  methodNotAllowed,
  readJsonBody,
} from "../../_lib/http.js";

interface JoinBody {
  playerId?: string;
  displayName?: string;
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
    const body = readJsonBody<JoinBody>(req);
    if (!body.playerId || !body.displayName) {
      error(res, 400, "Missing playerId or displayName");
      return;
    }
    const room = await joinRoom(code, body.playerId, body.displayName);
    json(res, 200, { room });
  } catch (e) {
    error(res, 400, e instanceof Error ? e.message : "Join failed");
  }
}
