import { useState } from "react";
import type { RoomPublicView } from "../lib/roomTypes";
import { buildPlayerEmojiMap, getPlayerEmoji } from "../lib/playerEmoji";
import { copyText } from "../lib/copyText";
import { t, useLocale } from "../i18n";
import { loadRoomMembership } from "../lib/roomSession";
import { shareUrlForCode } from "../lib/routing";

interface RoomLobbyViewProps {
  room: RoomPublicView;
  onStart: () => void;
  onLeave: () => void;
}

const actionBtn =
  "min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg)]";

export function RoomLobbyView({ room, onStart, onLeave }: RoomLobbyViewProps) {
  useLocale();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const shareUrl = shareUrlForCode(room.code);
  const me = loadRoomMembership(room.code);
  const iSubmitted = me
    ? room.players.some((p) => p.playerId === me.playerId && p.submitted)
    : false;
  const playerEmoji = buildPlayerEmojiMap(room.players);

  async function handleCopy() {
    setCopyError(false);
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setCopyError(true);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-title text-xl">
          {t("room.lobbyTitle", { code: room.code })}
        </h2>
        <p className="text-caption mt-1 text-sm">
          {t("room.hostLabel")}: {room.hostName}
        </p>
        <p className="text-caption mt-1 text-xs">
          {t("room.submittedCount", {
            submitted: String(room.submittedCount),
            total: String(room.playerCount),
          })}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-caption mb-2 text-xs uppercase tracking-wide">
          {t("room.players")}
        </p>
        <ul className="space-y-1">
          {room.players.map((p) => (
            <li
              key={p.playerId}
              className="flex items-center justify-between text-sm text-[var(--color-ink-secondary)]"
            >
              <span>
                <span className="mr-1.5">{getPlayerEmoji(playerEmoji, p.playerId)}</span>
                {p.displayName}
              </span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                {p.submitted ? "✓" : "…"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={handleCopy} className={actionBtn}>
          {copied ? t("room.copied") : t("room.copyLink")}
        </button>
        {copyError && (
          <p className="break-all text-center text-xs text-[var(--color-ink-muted)]">{shareUrl}</p>
        )}
        {!iSubmitted && (
          <button type="button" onClick={onStart} className={actionBtn}>
            {t("room.startGame")}
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
        >
          {t("room.leaveRoom")}
        </button>
      </div>
    </div>
  );
}
