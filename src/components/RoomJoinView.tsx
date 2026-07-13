import { useState } from "react";
import { t, useLocale } from "../i18n";
import { joinRoom } from "../lib/roomApi";
import { getPlayerId } from "../lib/playerId";
import { navigate } from "../lib/routing";
import { saveRoomMembership } from "../lib/roomSession";

interface RoomJoinViewProps {
  initialCode?: string;
  onJoined?: () => void;
}

export function RoomJoinView({ initialCode = "", onJoined }: RoomJoinViewProps) {
  useLocale();
  const [code, setCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerId = getPlayerId();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = code.trim().toUpperCase();
    const name = displayName.trim();
    if (normalized.length !== 6 || !name) return;

    setLoading(true);
    try {
      await joinRoom(normalized, { playerId, displayName: name });
      saveRoomMembership({
        code: normalized,
        playerId,
        displayName: name,
        submitted: false,
      });
      if (onJoined) {
        onJoined();
      } else {
        navigate(`/r/${normalized}`);
      }
    } catch {
      setError(t("room.joinFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-5 py-4 sm:max-w-md">
      <h2 className="text-title text-center text-xl">{t("room.joinRoom")}</h2>

      <form onSubmit={handleJoin} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-caption text-xs">{t("room.roomCode")}</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center font-mono text-lg tracking-widest"
            autoComplete="off"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-caption text-xs">{t("room.yourName")}</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={24}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={loading || code.trim().length !== 6 || !displayName.trim()}
          className="min-h-12 w-full rounded-xl bg-[var(--color-button)] px-4 py-3 text-sm font-medium text-[var(--color-button-text)] transition-colors hover:bg-[var(--color-button-hover)] disabled:opacity-50"
        >
          {loading ? t("room.joining") : t("room.joinRoom")}
        </button>
      </form>

      {error && (
        <p className="text-center text-sm text-red-600/90">{error}</p>
      )}

      <button
        type="button"
        onClick={() => navigate("/room")}
        className="block w-full text-center text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
      >
        ← {t("room.backHome")}
      </button>
    </div>
  );
}
