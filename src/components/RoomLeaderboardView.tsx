import { useEffect, useMemo, useState } from "react";
import type { GameResult } from "../types";
import type { LeaderboardEntry, RoomPublicView } from "../lib/roomTypes";
import { buildPlayerEmojiMap, getPlayerEmoji } from "../lib/playerEmoji";
import { useMobileLandscapeLayout } from "../hooks/useMedia";
import { loadRoomMembership } from "../lib/roomSession";
import { computeResult } from "../utils/scoring";
import { t, useLocale } from "../i18n";
import { fetchRoomPhotoObjectUrl } from "../lib/roomApi";
import { navigate } from "../lib/routing";
import { MiniPalette } from "./MiniPalette";
import { RoomMultiPlayerPhoto } from "./RoomMultiPlayerPhoto";
import { ScoreDenom, ScoreResult } from "./ScoreResult";

interface RoomLeaderboardViewProps {
  room: RoomPublicView;
  photoUrl: string | null;
  onLeave: () => void;
}

function entryToResult(
  entry: LeaderboardEntry,
  room: RoomPublicView,
): GameResult | null {
  if (
    !entry.submitted ||
    entry.totalScore === null ||
    !entry.userColors ||
    !entry.userPositions
  ) {
    return null;
  }
  return computeResult(
    room.challenge.targetColors,
    entry.userColors,
    room.challenge.targetPositions,
    entry.userPositions,
  );
}

function rankAccent(_rank: number): string {
  return "border border-[var(--color-border)] bg-white/90";
}

function rankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export function RoomLeaderboardView({
  room,
  photoUrl: initialPhotoUrl,
  onLeave,
}: RoomLeaderboardViewProps) {
  useLocale();
  const mobileLandscape = useMobileLandscapeLayout();
  const sideBySide = mobileLandscape;
  const membership = loadRoomMembership(room.code);
  const leaderboard = room.leaderboard ?? [];
  const submittedCount = leaderboard.filter((e) => e.submitted).length;
  const compactPalette = leaderboard.length > 6;

  const playerEmoji = useMemo(
    () => buildPlayerEmojiMap(room.players),
    [room.players],
  );

  const submittedEntries = useMemo(
    () =>
      leaderboard.filter(
        (e) => e.submitted && e.userColors && e.userPositions,
      ),
    [leaderboard],
  );
  const photoPlayers = useMemo(
    () =>
      submittedEntries.map((e) => ({
        playerId: e.playerId,
        emoji: getPlayerEmoji(playerEmoji, e.playerId),
        userColors: e.userColors!,
        userPositions: e.userPositions!,
      })),
    [submittedEntries, playerEmoji],
  );

  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [photoFocused, setPhotoFocused] = useState(false);

  useEffect(() => {
    if (initialPhotoUrl) {
      setPhotoUrl(initialPhotoUrl);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    void (async () => {
      try {
        objectUrl = await fetchRoomPhotoObjectUrl(room.code);
        if (!cancelled) setPhotoUrl(objectUrl);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl && objectUrl !== initialPhotoUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [room.code, initialPhotoUrl]);

  useEffect(() => {
    if (selectedId && !submittedEntries.some((e) => e.playerId === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, submittedEntries]);

  useEffect(() => {
    setDetailIndex(null);
  }, [selectedId]);

  const selectedEntry = submittedEntries.find((e) => e.playerId === selectedId);
  const selectedResult = selectedEntry ? entryToResult(selectedEntry, room) : null;
  const selectedEmoji = selectedEntry
    ? getPlayerEmoji(playerEmoji, selectedEntry.playerId)
    : undefined;

  const detailPlayers =
    detailIndex === null
      ? []
      : submittedEntries
          .map((entry) => {
            const color = entry.userColors?.[detailIndex];
            const pos = entry.userPositions?.[detailIndex];
            const score = entry.perCellScores?.[detailIndex];
            if (!color || !pos || score === undefined) return null;
            return {
              playerId: entry.playerId,
              emoji: getPlayerEmoji(playerEmoji, entry.playerId),
              displayName: entry.displayName,
              userColor: color,
              userPosition: pos,
              cellScore: score,
            };
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

  const rankingList = (
    <ol className="space-y-2.5" aria-label={t("room.rankings")}>
      {leaderboard.map((entry) => {
        const active = entry.playerId === selectedId;
        const isMe = membership?.playerId === entry.playerId;
        const canSelect = entry.submitted && entry.totalScore !== null;
        const emoji = getPlayerEmoji(playerEmoji, entry.playerId);

        return (
          <li key={entry.playerId}>
            <button
              type="button"
              disabled={!canSelect}
              onClick={() => {
                if (!canSelect) return;
                setSelectedId(active ? null : entry.playerId);
                if (!active) setPhotoFocused(false);
              }}
              className={`flex w-full items-start rounded-xl text-left transition-all ${
                sideBySide ? "gap-2 px-2.5 py-2.5" : "gap-3 px-3 py-3"
              } ${rankAccent(entry.rank)} ${
                active
                  ? "ring-2 ring-stone-400 ring-offset-1"
                  : canSelect
                    ? "hover:brightness-[0.98]"
                    : "opacity-60"
              } ${!canSelect ? "cursor-default" : ""}`}
            >
              <span
                className={`mt-0.5 shrink-0 text-center leading-none ${
                  sideBySide ? "w-7" : "w-8"
                } ${
                  entry.rank <= 3
                    ? sideBySide
                      ? "text-lg"
                      : "text-xl"
                    : "text-base font-bold tabular-nums text-stone-400"
                }`}
                aria-label={`#${entry.rank}`}
              >
                {rankBadge(entry.rank)}
              </span>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`shrink-0 leading-none ${sideBySide ? "text-base" : "text-lg"}`}
                    aria-hidden
                  >
                    {emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                    {entry.displayName}
                    {isMe && (
                      <span className="ml-1 text-[10px] font-normal text-stone-400">
                        ({t("room.you")})
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-score shrink-0 tabular-nums text-stone-800 ${
                      sideBySide ? "text-base" : "text-xl"
                    }`}
                  >
                    {entry.submitted && entry.totalScore !== null ? (
                      <>
                        {entry.totalScore}
                        <ScoreDenom
                          className={`text-caption ${sideBySide ? "text-[10px]" : "text-sm"}`}
                        />
                      </>
                    ) : (
                      <span className="text-sm font-normal text-stone-400">
                        {t("room.dnf")}
                      </span>
                    )}
                  </span>
                </div>
                {entry.userColors && entry.userColors.length > 0 && (
                  <MiniPalette
                    colors={entry.userColors}
                    size={compactPalette || sideBySide ? "sm" : "md"}
                  />
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div
      className={`fixed inset-0 z-40 flex bg-[#f7f5f2] ${
        sideBySide
          ? "flex-row overflow-hidden"
          : "flex-col md:flex-row md:overflow-hidden"
      }`}
    >
      <div
        className={`relative flex min-w-0 flex-col bg-stone-900/5 transition-[flex-basis,height] duration-300 ease-out ${
          photoFocused
            ? "z-20 min-h-0 flex-1"
            : sideBySide
              ? "min-h-0 flex-1"
              : "h-[36vh] shrink-0 md:h-auto md:min-h-0 md:flex-1"
        }`}
      >
        {photoUrl && photoPlayers.length > 0 ? (
          <RoomMultiPlayerPhoto
            photoDataUrl={photoUrl}
            targetColors={room.challenge.targetColors}
            targetPositions={room.challenge.targetPositions}
            players={photoPlayers}
            selectedIndex={detailIndex}
            onSelectedIndexChange={setDetailIndex}
            onEmptyPhotoTap={() => setPhotoFocused((v) => !v)}
            detailPlayers={detailPlayers}
            fillContainer
          />
        ) : (
          <p className="flex flex-1 items-center justify-center text-sm text-stone-400">
            {t("room.loadingRoom")}
          </p>
        )}

        {!photoFocused && photoPlayers.length > 0 && (
          <button
            type="button"
            onClick={() => setPhotoFocused(true)}
            className="absolute bottom-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/75 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-stone-900/90"
            aria-label={t("room.expandPhoto")}
            title={t("room.expandPhoto")}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        )}

        {photoFocused && (
          <button
            type="button"
            onClick={() => setPhotoFocused(false)}
            className={`absolute left-1/2 z-30 -translate-x-1/2 rounded-full bg-stone-900/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-stone-900 ${
              detailIndex !== null ? "top-3" : "bottom-3"
            }`}
          >
            {t("room.collapsePhoto")}
          </button>
        )}
      </div>

      <aside
        className={`flex min-h-0 min-w-0 flex-col bg-[#f7f5f2] transition-all duration-300 ease-out ${
          photoFocused
            ? "pointer-events-none absolute inset-x-0 bottom-0 z-10 max-h-[42%] translate-y-[108%] opacity-0 md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[clamp(22rem,38vw,32rem)] md:translate-x-[108%] md:translate-y-0"
            : sideBySide
              ? "relative z-10 w-[min(48%,20rem)] shrink-0 overflow-hidden"
              : "relative z-10 flex-1 md:w-[clamp(22rem,38vw,32rem)] md:shrink-0"
        }`}
        aria-hidden={photoFocused}
      >
        <div
          className={`sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-stone-200/80 bg-[#f7f5f2]/95 backdrop-blur-sm ${
            sideBySide ? "px-3 py-2" : "px-4 py-3"
          }`}
        >
          <div className="min-w-0">
            <h2 className={`text-title ${sideBySide ? "text-base" : "text-lg"}`}>
              {t("room.leaderboardTitle")}
            </h2>
            <p className="text-caption text-[11px]">
              {t("room.submittedCount", {
                submitted: String(submittedCount),
                total: String(room.playerCount),
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onLeave();
              navigate("/");
            }}
            className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 sm:px-3 sm:text-sm"
          >
            {t("room.backHome")}
          </button>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto ${
            sideBySide ? "px-3 py-2" : "px-4 py-3"
          }`}
        >
          <div className="space-y-4">
            <div className="min-w-0">
              <p className="text-caption mb-2 text-[10px] font-medium uppercase tracking-wide">
                {t("room.rankings")}
              </p>
              {rankingList}
              {!selectedResult && (
                <p className="text-caption mt-3 text-center text-xs">
                  {t("room.tapPlayerForScore")}
                </p>
              )}
            </div>

            {selectedResult && selectedEntry && (
              <div className="min-w-0 border-t border-stone-200/80 pt-4">
                <p className="text-caption mb-2 text-[10px] font-medium uppercase tracking-wide">
                  {t("score.total")}
                </p>
                <ScoreResult
                  result={selectedResult}
                  onPlayAgain={() => {}}
                  onNewPhoto={() => {}}
                  compact
                  hideActions
                  pairedLayout
                  hideTotalLabel
                  tight={sideBySide}
                  rank={selectedEntry.rank}
                  rankTotal={leaderboard.length}
                  playerName={selectedEntry.displayName}
                  playerEmoji={selectedEmoji}
                  selectedDetailIndex={detailIndex}
                  onSelectDetailIndex={(index) => {
                    setDetailIndex(index);
                    if (index !== null) setPhotoFocused(true);
                  }}
                />
              </div>
            )}
          </div>

          {detailIndex === null && submittedEntries.length > 0 && (
            <p className="text-caption mt-3 text-center text-xs">
              {t("room.tapCellOnPhoto")}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
