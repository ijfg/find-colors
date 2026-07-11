import { useState } from "react";
import type { RoomPublicView } from "../lib/roomTypes";
import { buildPlayerEmojiMap, getPlayerEmoji } from "../lib/playerEmoji";
import { t, useLocale } from "../i18n";

interface RoomPlayerStatusProps {
  room: RoomPublicView;
  mode: "inline" | "sidebar" | "overlay";
  wide?: boolean;
}

function statusLine(
  name: string,
  submitted: boolean,
  filledCount: number,
  total: number,
): string {
  if (submitted) {
    return t("room.playerSubmitted", { name });
  }
  if (filledCount <= 0) {
    return t("room.playerNotStarted", { name });
  }
  if (filledCount >= total) {
    return t("room.playerReadySubmit", { name });
  }
  return t("room.playerFilling", { name, n: String(filledCount + 1) });
}

export function RoomPlayerStatus({
  room,
  mode,
  wide = false,
}: RoomPlayerStatusProps) {
  useLocale();
  const total = room.challenge.difficulty;
  const players = room.players.filter((p) => p.displayName.trim());
  const [open, setOpen] = useState(true);
  const playerEmoji = buildPlayerEmojiMap(players);

  if (players.length === 0) return null;

  const list = (
    <ul className="space-y-1.5">
      {players.map((p) => {
        const emoji = getPlayerEmoji(playerEmoji, p.playerId);
        return (
          <li
            key={p.playerId}
            className={`flex items-start gap-2 text-sm leading-snug ${
              p.submitted ? "text-emerald-700" : "text-stone-600"
            }`}
          >
            <span className="shrink-0 text-base leading-none">{emoji}</span>
            <span className="min-w-0">{statusLine(p.displayName, p.submitted, p.filledCount, total)}</span>
          </li>
        );
      })}
    </ul>
  );

  if (mode === "sidebar") {
    return (
      <div className="rounded-lg border border-stone-200/80 bg-stone-50/80 px-2.5 py-2">
        <p className="text-caption mb-1.5 text-[10px] font-medium uppercase tracking-wide">
          {t("room.playerStatusTitle")}
        </p>
        <ul className="max-h-28 space-y-1 overflow-y-auto overscroll-y-contain">
          {players.map((p) => {
            const emoji = getPlayerEmoji(playerEmoji, p.playerId);
            return (
              <li
                key={p.playerId}
                className={`flex items-start gap-2 text-xs leading-snug ${
                  p.submitted ? "text-emerald-700" : "text-stone-600"
                }`}
              >
                <span className="shrink-0 text-sm leading-none">{emoji}</span>
                <span className="min-w-0">
                  {statusLine(p.displayName, p.submitted, p.filledCount, total)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (mode === "overlay") {
    const panel = !open ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-r-lg border border-l-0 border-stone-200 bg-white/95 px-1.5 py-3 text-[11px] font-medium text-stone-600 shadow-sm backdrop-blur-sm"
        style={{ writingMode: "vertical-rl" }}
        aria-label={t("room.playerStatusTitle")}
      >
        {t("room.playerStatusShort")}
      </button>
    ) : (
      <div className="pointer-events-auto absolute left-2 top-2 z-20 max-w-[min(16rem,calc(100%-1rem))] rounded-lg border border-stone-200 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-caption text-[10px] font-medium uppercase tracking-wide">
            {t("room.playerStatusTitle")}
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label={t("room.closeStatus")}
          >
            ×
          </button>
        </div>
        {list}
      </div>
    );

    return panel;
  }

  if (mode === "inline") {
    return (
      <div
        className={`rounded-lg border border-[var(--color-border)] bg-white/95 p-3 backdrop-blur-sm ${
          wide ? "w-full" : "w-full max-w-[11rem]"
        }`}
      >
        <p className="text-caption mb-1.5 text-[10px] font-medium uppercase tracking-wide">
          {t("room.playerStatusTitle")}
        </p>
        {list}
      </div>
    );
  }

  return null;
}
