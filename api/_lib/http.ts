import type { VercelRequest, VercelResponse } from "@vercel/node";

export function readJsonBody<T>(req: VercelRequest): T {
  if (req.body && typeof req.body === "object") {
    return req.body as T;
  }
  if (typeof req.body === "string" && req.body.length > 0) {
    return JSON.parse(req.body) as T;
  }
  return {} as T;
}

export function json(res: VercelResponse, status: number, data: unknown): void {
  res.status(status).setHeader("Content-Type", "application/json").json(data);
}

export function error(res: VercelResponse, status: number, message: string): void {
  json(res, status, { error: message });
}

export function methodNotAllowed(res: VercelResponse): void {
  error(res, 405, "Method not allowed");
}

export function getOrigin(req: VercelRequest): string | undefined {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  if (!host) return undefined;
  return `${proto}://${host}`;
}

export function getCodeParam(req: VercelRequest): string {
  const raw = req.query.code;
  if (typeof raw === "string") return raw.toUpperCase();
  if (Array.isArray(raw) && raw[0]) return String(raw[0]).toUpperCase();
  return "";
}
