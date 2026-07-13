import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadRoomPublic } from "../_lib/roomService.js";
import { error, getCodeParam, json, methodNotAllowed } from "../_lib/http.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  const code = getCodeParam(req);
  if (!code) {
    error(res, 400, "Room code required");
    return;
  }

  try {
    const room = await loadRoomPublic(code);
    if (!room) {
      error(res, 404, "Room not found");
      return;
    }
    json(res, 200, { room });
  } catch (e) {
    error(res, 500, e instanceof Error ? e.message : "Load failed");
  }
}
