import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  createRoom,
  getRoomPhoto,
  getShareUrl,
  joinRoom,
  loadRoomPublic,
  submitToRoom,
  updateRoomProgress,
} from "./api/_lib/roomService.js";
import type { RoomChallenge } from "./api/_lib/types.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function parseJson<T>(req: IncomingMessage): Promise<T> {
  const raw = await readBody(req);
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message });
}

function getOrigin(req: IncomingMessage): string | undefined {
  const host = req.headers.host;
  if (!host) return undefined;
  return `http://${host}`;
}

export function devRoomApiPlugin(): Plugin {
  return {
    name: "dev-room-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/rooms")) {
          next();
          return;
        }

        try {
          const path = url.split("?")[0] ?? url;
          const origin = getOrigin(req);

          if (path === "/api/rooms" && req.method === "POST") {
            const body = await parseJson<{
              hostPlayerId?: string;
              hostName?: string;
              photoBase64?: string;
              challenge?: RoomChallenge;
              deadlineMinutes?: number;
              deadlineHours?: number;
            }>(req);
            if (!body.hostPlayerId || !body.hostName || !body.photoBase64 || !body.challenge) {
              sendError(res, 400, "Missing required fields");
              return;
            }
            const { publicView } = await createRoom({
              hostPlayerId: body.hostPlayerId,
              hostName: body.hostName,
              photoBase64: body.photoBase64,
              challenge: body.challenge,
              deadlineMinutes:
                body.deadlineMinutes ??
                (body.deadlineHours != null ? body.deadlineHours * 60 : undefined),
            });
            sendJson(res, 201, {
              code: publicView.code,
              shareUrl: getShareUrl(publicView.code, origin),
              room: publicView,
            });
            return;
          }

          const roomMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{6})$/i);
          if (roomMatch && req.method === "GET") {
            const code = roomMatch[1]!.toUpperCase();
            const room = await loadRoomPublic(code);
            if (!room) {
              sendError(res, 404, "Room not found");
              return;
            }
            sendJson(res, 200, { room });
            return;
          }

          const joinMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{6})\/join$/i);
          if (joinMatch && req.method === "POST") {
            const code = joinMatch[1]!.toUpperCase();
            const body = await parseJson<{ playerId?: string; displayName?: string }>(req);
            if (!body.playerId || !body.displayName) {
              sendError(res, 400, "Missing playerId or displayName");
              return;
            }
            const room = await joinRoom(code, body.playerId, body.displayName);
            sendJson(res, 200, { room });
            return;
          }

          const progressMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{6})\/progress$/i);
          if (progressMatch && req.method === "POST") {
            const code = progressMatch[1]!.toUpperCase();
            const body = await parseJson<{ playerId?: string; filledCount?: number }>(req);
            if (!body.playerId || body.filledCount === undefined) {
              sendError(res, 400, "Missing playerId or filledCount");
              return;
            }
            const room = await updateRoomProgress(code, body.playerId, body.filledCount);
            sendJson(res, 200, { room });
            return;
          }

          const submitMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{6})\/submit$/i);
          if (submitMatch && req.method === "POST") {
            const code = submitMatch[1]!.toUpperCase();
            const body = await parseJson<{
              playerId?: string;
              userColors?: string[];
              userPositions?: Array<{ x: number; y: number }>;
              totalScore?: number;
              perCellScores?: number[];
            }>(req);
            if (
              !body.playerId ||
              !body.userColors ||
              !body.userPositions ||
              body.totalScore === undefined ||
              !body.perCellScores
            ) {
              sendError(res, 400, "Missing submission fields");
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
            sendJson(res, 200, { room });
            return;
          }

          const photoMatch = path.match(/^\/api\/rooms\/([A-Z0-9]{6})\/photo$/i);
          if (photoMatch && req.method === "GET") {
            const code = photoMatch[1]!.toUpperCase();
            const bytes = await getRoomPhoto(code);
            if (!bytes) {
              sendError(res, 404, "Photo not found");
              return;
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "image/jpeg");
            res.setHeader("Cache-Control", "public, max-age=86400");
            res.end(bytes);
            return;
          }

          sendError(res, 404, "Not found");
        } catch (e) {
          sendError(res, 400, e instanceof Error ? e.message : "Request failed");
        }
      });
    },
  };
}
