import { useEffect, useState } from "react";
import type { Difficulty } from "./types";
import { t, useLocale } from "./i18n";
import { ColorGuessingGame } from "./components/ColorGuessingGame";
import { HomeView } from "./components/HomeView";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
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
  const locale = useLocale();
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
  const immersiveGame = view === "game" && seed !== null;

  useEffect(() => {
    document.title = t("appName");
  }, [locale]);

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
      setError(t("home.cantProcess"));
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
        { random: true, excludeColors: seed.targetColors },
      );
      setGameState(undefined);
      setSeed({
        ...seed,
        id: Date.now(),
        targetColors: colors,
        targetPositions: positions,
      });
    } catch {
      setError(t("home.cantRegenerate"));
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
    <div
      className={`flex flex-col ${
        view === "game" && seed ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
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
              <h1 className="text-title text-lg sm:text-xl">{t("appName")}</h1>
            </div>
          )}
          {view === "home" && <div className="flex-1" aria-hidden />}
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            {view !== "records" && (
              <button
                type="button"
                onClick={openRecords}
                className="text-label inline-flex min-h-11 w-[9.25rem] shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg)]"
              >
                {t("records.title")}
                {records.length > 0 ? ` (${records.length})` : ""}
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      <main
        className={`mx-auto ${
          immersiveGame
            ? "p-0"
            : view === "home"
              ? "flex w-full flex-1 flex-col px-5 sm:px-6"
                : view === "game"
                ? "flex min-h-0 flex-1 w-full flex-col overflow-hidden p-0"
                : "w-full px-3 py-4 sm:px-6 sm:py-6"
        } ${view === "game" ? "max-w-none" : view === "home" ? "max-w-5xl" : "max-w-5xl"}`}
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
