import { useState } from "react";
import type { Difficulty } from "../types";
import { t, useLocale } from "../i18n";
import { createRoom } from "../lib/roomApi";
import { getPlayerId } from "../lib/playerId";
import { navigate } from "../lib/routing";
import { saveRoomMembership } from "../lib/roomSession";
import { extractColorsFromImage } from "../utils/colorExtract";
import { compressToThumbnail } from "../utils/storage";
import { DifficultySelector } from "./DifficultySelector";
import { PhotoUpload } from "./PhotoUpload";

function parseDeadlineMinutes(raw: string): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 60;
  return Math.min(10_080, Math.max(5, n));
}

export function RoomCreateView() {
  useLocale();
  const [difficulty, setDifficulty] = useState<Difficulty>(4);
  const [hostName, setHostName] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("60");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoSelect(file: File) {
    setError(null);
    const name = hostName.trim();
    if (!name) {
      setError(t("room.yourName"));
      return;
    }
    setLoading(true);
    try {
      const { colors, positions, dataUrl } = await extractColorsFromImage(
        file,
        difficulty,
      );
      const photoBase64 = await compressToThumbnail(dataUrl, 1280, 0.72);
      const playerId = getPlayerId();
      const result = await createRoom({
        hostPlayerId: playerId,
        hostName: name,
        photoBase64,
        challenge: {
          difficulty,
          targetColors: colors,
          targetPositions: positions,
          extractVersion: 1,
        },
        deadlineMinutes: parseDeadlineMinutes(deadlineInput),
      });
      saveRoomMembership({
        code: result.code,
        playerId,
        displayName: name,
        submitted: false,
      });
      navigate(`/r/${result.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("room.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-5 py-4 sm:max-w-md">
      <h2 className="text-title text-center text-xl">{t("room.createRoom")}</h2>

      <DifficultySelector
        value={difficulty}
        onChange={setDifficulty}
        className="!mt-0"
      />

      <label className="block space-y-1">
        <span className="text-caption text-xs">{t("room.yourName")}</span>
        <input
          type="text"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          maxLength={24}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-caption text-xs">{t("room.deadlineMinutes")}</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={deadlineInput}
          onChange={(e) => setDeadlineInput(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={() => {
            if (!deadlineInput.trim()) setDeadlineInput("60");
          }}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm tabular-nums"
        />
      </label>

      <PhotoUpload onSelect={handlePhotoSelect} loading={loading} />

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
