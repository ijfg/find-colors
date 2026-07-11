export function navigate(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function getPathname(): string {
  return window.location.pathname;
}

export function parseRoomCodeFromPath(path: string): string | null {
  const match = path.match(/^\/r\/([A-Za-z0-9]{6})\/?$/);
  return match ? match[1]!.toUpperCase() : null;
}

export type AppRoute =
  | { kind: "home" }
  | { kind: "records" }
  | { kind: "soloGame" }
  | { kind: "roomHub" }
  | { kind: "roomCreate" }
  | { kind: "roomJoin"; code?: string }
  | { kind: "room"; code: string };

export function parseRoute(path: string): AppRoute {
  if (path === "/room") return { kind: "roomHub" };
  if (path === "/room/create") return { kind: "roomCreate" };
  if (path === "/room/join" || path.startsWith("/room/join")) {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code")?.toUpperCase() ?? undefined;
    return { kind: "roomJoin", code };
  }
  const code = parseRoomCodeFromPath(path);
  if (code) return { kind: "room", code };
  return { kind: "home" };
}

export function shareUrlForCode(code: string): string {
  return `${window.location.origin}/r/${code.toUpperCase()}`;
}
