import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRoomPhoto } from "../../_lib/roomService.js";
import { error, getCodeParam, methodNotAllowed } from "../../_lib/http.js";

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
    const bytes = await getRoomPhoto(code);
    if (!bytes) {
      error(res, 404, "Photo not found");
      return;
    }
    res
      .status(200)
      .setHeader("Content-Type", "image/jpeg")
      .setHeader("Cache-Control", "public, max-age=86400")
      .send(bytes);
  } catch (e) {
    error(res, 500, e instanceof Error ? e.message : "Photo load failed");
  }
}
