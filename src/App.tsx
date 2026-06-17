import { useEffect, useState } from "react";
import { useMobileImmersive } from "./hooks/useMedia";
import type { Difficulty } from "./types";
import { ColorGuessingGame } from "./components/ColorGuessingGame";
import { HomeView } from "./components/HomeView";
import { RecordsView } from "./components/RecordsView";
import { extractColorsFromImage } from "./utils/colorExtract";
import {
  clearSession,
  deleteRecord,
  loadRecords,
  loadSession,
  saveSession,
  clearRecords,
  type GameSeed,
  type PersistedGameState,
} from "./utils/storage";

type View = "home" | "game" | "records";

function readInitialAppState() {
  const session = loadSession();
  if (!session) {
    return {
      view: "home" as View,
      difficulty: 4 as Difficulty,
      seed: null as GameSeed | null,
      gameState: undefined as PersistedGameState | undefined,
    };
  }

  return {
    view: session.view,
    difficulty: session.difficulty,
    seed: session.seed,
    gameState: session.gameState,
  };
}

export default function App() {
  const initial = readInitialAppState();
  const [view, setView] = useState<View>(initial.view);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [seed, setSeed] = useState<GameSeed | null>(initial.seed);
  const [gameState, setGameState] = useState<PersistedGameState | undefined>(
    initial.gameState,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState(() => loadRecords());
  const mobileImmersive = useMobileImmersive();
  const immersiveGame = view === "game" && seed !== null && mobileImmersive;

  useEffect(() => {
    if (!seed) return;

    void saveSession({
      version: 1,
      view,
      difficulty,
      seed,
      gameState,
    });
  }, [seed, view, difficulty, gameState]);

  useEffect(() => {
    const flushSession = () => {
      if (!seed) return;
      void saveSession({
        version: 1,
        view,
        difficulty,
        seed,
        gameState,
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSession();
        return;
      }
      setRecords(loadRecords());
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      const session = loadSession();
      if (!session) return;
      setSeed(session.seed);
      setView(session.view);
      setDifficulty(session.difficulty);
      setGameState(session.gameState);
      setRecords(loadRecords());
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [seed, view, difficulty, gameState]);

  async function handlePhotoSelect(file: File) {
    setError(null);
    setLoading(true);
    try {
      const { colors, positions, dataUrl } = await extractColorsFromImage(
        file,
        difficulty,
      );
      const nextSeed: GameSeed = {
        id: Date.now(),
        photoDataUrl: dataUrl,
        targetColors: colors,
        targetPositions: positions,
        difficulty,
      };
      setGameState(undefined);
      setSeed(nextSeed);
      setView("game");
    } catch {
      setError("无法处理该图片，请换一张试试。");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlayAgain() {
    if (!seed || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { colors, positions } = await extractColorsFromImage(
        seed.photoDataUrl,
        seed.difficulty,
        { random: true },
      );
      setGameState(undefined);
      setSeed({
        ...seed,
        id: Date.now(),
        targetColors: colors,
        targetPositions: positions,
      });
    } catch {
      setError("无法重新生成目标色，请换一张试试。");
    } finally {
      setLoading(false);
    }
  }

  function handleNewPhoto() {
    clearSession();
    setSeed(null);
    setGameState(undefined);
    setView("home");
  }

  function handleSaved() {
    setRecords(loadRecords());
  }

  function openRecords() {
    setRecords(loadRecords());
    setView("records");
  }

  function handleDeleteRecord(id: string) {
    setRecords(deleteRecord(id));
  }

  function handleClearAllRecords() {
    clearRecords();
    setRecords([]);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {!immersiveGame && (
      <header
        className={
          view === "home"
            ? "bg-transparent"
            : "border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm"
        }
      >
        <div
          className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 ${
            view === "game" ? "max-w-6xl" : "max-w-5xl"
          }`}
        >
          {view !== "home" && (
            <div className="min-w-0">
              <h1 className="text-title text-lg sm:text-xl">找颜色</h1>
            </div>
          )}
          {view === "home" && <div className="flex-1" aria-hidden />}
          {view !== "records" ? (
            <button
              type="button"
              onClick={openRecords}
              className="text-label min-h-11 shrink-0 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
            >
              我的记录{records.length > 0 ? ` (${records.length})` : ""}
            </button>
          ) : (
            <div className="w-px shrink-0" aria-hidden />
          )}
        </div>
      </header>
      )}

      <main
        className={`mx-auto ${
          immersiveGame
            ? "p-0"
            : view === "home"
              ? "flex w-full flex-1 flex-col px-5 sm:px-6"
              : "px-3 py-4 sm:px-6 sm:py-6"
        } ${view === "game" ? "max-w-6xl" : view === "home" ? "max-w-5xl" : "max-w-5xl"}`}
      >
        {view === "home" && (
          <HomeView
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            onPhotoSelect={handlePhotoSelect}
            loading={loading}
            error={error}
          />
        )}

        {view === "game" && seed && (
          <ColorGuessingGame
            key={seed.id}
            photoDataUrl={seed.photoDataUrl}
            difficulty={seed.difficulty}
            targetColors={seed.targetColors}
            targetPositions={seed.targetPositions}
            initialGameState={gameState}
            onGameStateChange={setGameState}
            onNewPhoto={handleNewPhoto}
            onPlayAgain={handlePlayAgain}
            playAgainBusy={loading}
            onSaved={handleSaved}
          />
        )}

        {view === "records" && (
          <RecordsView
            records={records}
            onBack={() => setView(seed ? "game" : "home")}
            onDelete={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
          />
        )}
      </main>
    </div>
  );
}
