import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { RoomChallenge } from "../lib/types.js";
import {
  createRoom,
  getShareUrl,
} from "../lib/roomService.js";
import {
  error,
  getOrigin,
  json,
  methodNotAllowed,
  readJsonBody,
} from "../lib/http.js";

interface CreateBody {
  hostPlayerId?: string;
  hostName?: string;
  photoBase64?: string;
  challenge?: RoomChallenge;
  deadlineMinutes?: number;
  deadlineHours?: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = readJsonBody<CreateBody>(req);
    if (!body.hostPlayerId || !body.hostName || !body.photoBase64 || !body.challenge) {
      error(res, 400, "Missing required fields");
      return;
    }

    const { publicView } = await createRoom({
      hostPlayerId: body.hostPlayerId,
      hostName: body.hostName,
      photoBase64: body.photoBase64,
      challenge: body.challenge,
      deadlineMinutes: body.deadlineMinutes ?? (body.deadlineHours != null ? body.deadlineHours * 60 : undefined),
    });

    json(res, 201, {
      code: publicView.code,
      shareUrl: getShareUrl(publicView.code, getOrigin(req)),
      room: publicView,
    });
  } catch (e) {
    error(res, 400, e instanceof Error ? e.message : "Create failed");
  }
}
