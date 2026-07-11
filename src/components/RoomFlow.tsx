import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RoomPublicView } from "../lib/roomTypes";
import type { PersistedGameState } from "../utils/storage";
import { saveRoomGameRecord } from "../lib/roomRecord";
import { t, useLocale } from "../i18n";
import {
  fetchRoom,
  fetchRoomPhotoObjectUrl,
  submitRoom,
  updateRoomProgress,
} from "../lib/roomApi";
import {
  clearRoomPlaying,
  isRoomPlaying,
  loadRoomMembership,
  markRoomPlaying,
  markRoomSubmitted,
} from "../lib/roomSession";
import { navigate } from "../lib/routing";
import { ColorGuessingGame } from "./ColorGuessingGame";
import { RoomJoinView } from "./RoomJoinView";
import { RoomLeaderboardView } from "./RoomLeaderboardView";
import { RoomLobbyView } from "./RoomLobbyView";
import { RoomPlayerStatus } from "./RoomPlayerStatus";
import { RoomWaitingView } from "./RoomWaitingView";

type RoomPhase = "loading" | "join" | "lobby" | "playing" | "waiting" | "leaderboard";

const PLAY_STATE_PREFIX = "color-game-room-play:";

function loadPlayState(code: string): PersistedGameState | undefined {
  try {
    const raw = sessionStorage.getItem(`${PLAY_STATE_PREFIX}${code}`);
    return raw ? (JSON.parse(raw) as PersistedGameState) : undefined;
  } catch {
    return undefined;
  }
}

function savePlayState(code: string, state: PersistedGameState | undefined): void {
  try {
    const key = `${PLAY_STATE_PREFIX}${code}`;
    if (!state) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface RoomFlowProps {
  code: string;
  onImmersiveChange?: (immersive: boolean) => void;
}

function mergeRoomProgress(
  prev: RoomPublicView | null,
  next: RoomPublicView,
  selfPlayerId?: string,
  localFilled = 0,
): RoomPublicView {
  return {
    ...next,
    players: next.players.map((p) => {
      const prevCount =
        prev?.players.find((x) => x.playerId === p.playerId)?.filledCount ?? 0;
      let filledCount = Math.max(p.filledCount, prevCount);
      if (selfPlayerId && p.playerId === selfPlayerId && !p.submitted) {
        filledCount = Math.max(filledCount, localFilled);
      }
      return { ...p, filledCount };
    }),
  };
}

export function RoomFlow({ code, onImmersiveChange }: RoomFlowProps) {
  useLocale();
  const normalized = code.toUpperCase();

  const [phase, setPhase] = useState<RoomPhase>("loading");
  const [room, setRoom] = useState<RoomPublicView | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [gameState, setGameState] = useState<PersistedGameState | undefined>(
    () => loadPlayState(normalized),
  );
  const [error, setError] = useState<string | null>(null);
  const isPlayingRef = useRef(isRoomPlaying(normalized));
  const phaseRef = useRef<RoomPhase>("loading");
  const progressTimerRef = useRef<number | null>(null);

  phaseRef.current = phase;

  useEffect(() => {
    const immersive = phase === "playing" || phase === "leaderboard";
    onImmersiveChange?.(immersive);
    return () => onImmersiveChange?.(false);
  }, [phase, onImmersiveChange]);

  const membership = loadRoomMembership(normalized);

  const displayRoom = useMemo(() => {
    if (!room) return null;
    const localFilled = gameState?.userColors.filter((c) => c).length ?? 0;
    if (!membership) return room;
    return {
      ...room,
      players: room.players.map((p) => {
        if (p.playerId !== membership.playerId || p.submitted) return p;
        return {
          ...p,
          filledCount: Math.max(p.filledCount, localFilled),
        };
      }),
    };
  }, [room, gameState, membership]);

  const statusPanelProps = useMemo(() => {
    if (!displayRoom) return null;
    return { room: displayRoom };
  }, [displayRoom]);

  const syncPhase = useCallback(
    (nextRoom: RoomPublicView, hasMembership: boolean) => {
      if (nextRoom.status === "revealed") {
        isPlayingRef.current = false;
        clearRoomPlaying(normalized);
        setPhase("leaderboard");
        return;
      }
      if (!hasMembership) {
        setPhase("join");
        return;
      }
      const m = loadRoomMembership(normalized);
      if (m?.submitted) {
        isPlayingRef.current = false;
        clearRoomPlaying(normalized);
        setPhase("waiting");
        return;
      }
      if (isPlayingRef.current || isRoomPlaying(normalized)) {
        isPlayingRef.current = true;
        markRoomPlaying(normalized);
        setPhase("playing");
        return;
      }
      setPhase("lobby");
    },
    [normalized],
  );

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const applyRoomUpdate = useCallback(
    (next: RoomPublicView) => {
      const mem = loadRoomMembership(normalized);
      const localFilled =
        gameStateRef.current?.userColors.filter((c) => c).length ?? 0;
      setRoom((prev) => mergeRoomProgress(prev, next, mem?.playerId, localFilled));
    },
    [normalized],
  );

  const refreshRoom = useCallback(async () => {
    const next = await fetchRoom(normalized);
    applyRoomUpdate(next);
    if (
      phaseRef.current === "playing" &&
      (isPlayingRef.current || isRoomPlaying(normalized))
    ) {
      return next;
    }
    const m = loadRoomMembership(normalized);
    syncPhase(next, Boolean(m));
    return next;
  }, [normalized, syncPhase, applyRoomUpdate]);

  const refreshRoomRef = useRef(refreshRoom);
  refreshRoomRef.current = refreshRoom;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mem = loadRoomMembership(normalized);
        if (!mem) {
          setPhase("join");
          const next = await fetchRoom(normalized);
          if (!cancelled) setRoom(next);
          return;
        }
        const url = await fetchRoomPhotoObjectUrl(normalized);
        if (cancelled) return;
        setPhotoUrl(url);
        if (
          !mem.submitted &&
          (isRoomPlaying(normalized) || loadPlayState(normalized))
        ) {
          isPlayingRef.current = true;
          markRoomPlaying(normalized);
        }
        await refreshRoomRef.current();
      } catch {
        if (!cancelled) setError(t("room.joinFailed"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  useEffect(() => {
    if (phase !== "lobby" && phase !== "waiting" && phase !== "playing") return;
    const intervalMs = phase === "playing" ? 2000 : 3000;
    const id = window.setInterval(() => {
      void refreshRoom();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [phase, refreshRoom]);

  useEffect(() => {
    if (phase !== "playing" && phase !== "lobby") return;
    const prevBody = document.body.style.overscrollBehaviorY;
    const prevHtml = document.documentElement.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = "none";
    document.documentElement.style.overscrollBehaviorY = "none";
    return () => {
      document.body.style.overscrollBehaviorY = prevBody;
      document.documentElement.style.overscrollBehaviorY = prevHtml;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaderboard" || !room || !photoUrl) return;
    void saveRoomGameRecord(normalized, room, photoUrl);
  }, [phase, room, photoUrl, normalized]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const handleGameStateChange = useCallback(
    (state: PersistedGameState) => {
      setGameState(state);
      savePlayState(normalized, state);
    },
    [normalized],
  );

  const handleRoomSubmit = useCallback(
    async (payload: {
      userColors: string[];
      userPositions: Array<{ x: number; y: number }>;
      totalScore: number;
      perCellScores: number[];
    }) => {
      const m = loadRoomMembership(normalized);
      if (!m) throw new Error("Not in room");
      const next = await submitRoom(normalized, {
        playerId: m.playerId,
        ...payload,
      });
      markRoomSubmitted(normalized);
      clearRoomPlaying(normalized);
      isPlayingRef.current = false;
      savePlayState(normalized, undefined);
      applyRoomUpdate(next);
      setPhase(next.status === "revealed" ? "leaderboard" : "waiting");
    },
    [normalized, applyRoomUpdate],
  );

  const reportProgress = useCallback(
    (filledCount: number) => {
      const m = loadRoomMembership(normalized);
      if (!m || m.submitted) return;

      setRoom((prev) => {
        if (!prev) return prev;
        return mergeRoomProgress(prev, prev, m.playerId, filledCount);
      });

      if (progressTimerRef.current) {
        window.clearTimeout(progressTimerRef.current);
      }
      progressTimerRef.current = window.setTimeout(() => {
        void updateRoomProgress(normalized, m.playerId, filledCount)
          .then((next) => applyRoomUpdate(next))
          .catch(() => {});
      }, 300);
    },
    [normalized, applyRoomUpdate],
  );

  const handleLeave = useCallback(() => {
    clearRoomPlaying(normalized);
    isPlayingRef.current = false;
    savePlayState(normalized, undefined);
    navigate("/");
  }, [normalized]);

  if (error) {
    return (
      <p className="py-12 text-center text-sm text-red-600/90">{error}</p>
    );
  }

  if (phase === "join") {
    return (
      <RoomJoinView
        initialCode={normalized}
        onJoined={() => {
          void (async () => {
            try {
              const url = await fetchRoomPhotoObjectUrl(normalized);
              setPhotoUrl(url);
              await refreshRoom();
            } catch {
              setError(t("room.joinFailed"));
            }
          })();
        }}
      />
    );
  }

  if (phase === "loading" || !room || !displayRoom) {
    return (
      <p className="py-12 text-center text-sm text-stone-400">
        {t("room.loadingRoom")}
      </p>
    );
  }

  if (phase === "leaderboard") {
    return <RoomLeaderboardView room={room} photoUrl={photoUrl} onLeave={handleLeave} />;
  }

  if (phase === "waiting") {
    return (
      <RoomWaitingView
        room={displayRoom}
        statusPanel={
          statusPanelProps ? (
            <RoomPlayerStatus {...statusPanelProps} mode="inline" wide />
          ) : undefined
        }
      />
    );
  }

  if (phase === "playing" && photoUrl && statusPanelProps) {
    return (
      <>
        <ColorGuessingGame
          key={`room-${normalized}`}
          mode="room"
          photoDataUrl={photoUrl}
          difficulty={room.challenge.difficulty}
          targetColors={room.challenge.targetColors}
          targetPositions={room.challenge.targetPositions}
          initialGameState={gameState}
          onGameStateChange={handleGameStateChange}
          onNewPhoto={handleLeave}
          onPlayAgain={() => {}}
          hideScoreUntilReveal
          onRoomSubmit={handleRoomSubmit}
          onRoomProgress={reportProgress}
          roomStatus={displayRoom}
        />
      </>
    );
  }

  return (
    <RoomLobbyView
      room={room}
      onStart={async () => {
        isPlayingRef.current = true;
        markRoomPlaying(normalized);
        if (!photoUrl) {
          const url = await fetchRoomPhotoObjectUrl(normalized);
          setPhotoUrl(url);
        }
        setPhase("playing");
        const filled = gameState?.userColors.filter((c) => c).length ?? 0;
        if (filled > 0) reportProgress(filled);
      }}
      onLeave={handleLeave}
    />
  );
}
