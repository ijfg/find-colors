import { useEffect, useState } from "react";
import type { Difficulty } from "./types";
import { t, useLocale } from "./i18n";
import { ColorGuessingGame } from "./components/ColorGuessingGame";
import { HomeView } from "./components/HomeView";
import { SoloSetupView } from "./components/SoloSetupView";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ThemeSwitcher, HEADER_CHIP_CLASS } from "./components/ThemeSwitcher";
import { RecordsView } from "./components/RecordsView";
import { RoomCreateView } from "./components/RoomCreateView";
import { RoomFlow } from "./components/RoomFlow";
import { RoomHubView } from "./components/RoomHubView";
import { RoomJoinView } from "./components/RoomJoinView";
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
import {
  getPathname,
  navigate,
  parseRoute,
  type AppRoute,
} from "./lib/routing";

type SoloView = "home" | "soloSetup" | "game" | "records";

function readInitialSoloState() {
  const session = loadSession();
  if (!session) {
    return {
      view: "home" as SoloView,
      difficulty: 4 as Difficulty,
      seed: null as GameSeed | null,
      gameState: undefined as PersistedGameState | undefined,
    };
  }
  return {
    view: session.view as SoloView,
    difficulty: session.difficulty,
    seed: session.seed,
    gameState: session.gameState,
  };
}

function useAppRoute(): AppRoute {
  const [path, setPath] = useState(getPathname);
  useEffect(() => {
    const onPop = () => setPath(getPathname());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return parseRoute(path);
}

export default function App() {
  const locale = useLocale();
  const route = useAppRoute();
  const initial = readInitialSoloState();
  const [soloView, setSoloView] = useState<SoloView>(
    route.kind === "home" ? initial.view : "home",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [seed, setSeed] = useState<GameSeed | null>(initial.seed);
  const [gameState, setGameState] = useState<PersistedGameState | undefined>(
    initial.gameState,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState(() => loadRecords());
  const [roomImmersive, setRoomImmersive] = useState(false);

  const isSoloRoute = route.kind === "home";
  const isRoomRoute =
    route.kind === "roomHub" ||
    route.kind === "roomCreate" ||
    route.kind === "roomJoin" ||
    route.kind === "room";
  const immersiveGame = isSoloRoute && soloView === "game" && seed !== null;
  const fullScreenMain = immersiveGame || roomImmersive;
  const hideHeader =
    immersiveGame || isRoomRoute || (isSoloRoute && soloView === "records");

  const showRecordsButton =
    isSoloRoute && soloView !== "records" && soloView !== "game";
  const transparentHeader =
    isSoloRoute && (soloView === "home" || soloView === "soloSetup");
  const roomLanding =
    route.kind === "roomHub" ||
    route.kind === "roomCreate" ||
    route.kind === "roomJoin";
  const centeredShell = transparentHeader || roomLanding;

  useEffect(() => {
    document.title = t("appName");
  }, [locale]);

  useEffect(() => {
    if (!isSoloRoute || !seed) return;
    void saveSession({
      version: 1,
      view: soloView === "records" ? "records" : "game",
      difficulty,
      seed,
      gameState,
    });
  }, [seed, soloView, difficulty, gameState, isSoloRoute]);

  useEffect(() => {
    const flushSession = () => {
      if (!isSoloRoute || !seed) return;
      void saveSession({
        version: 1,
        view: soloView === "records" ? "records" : "game",
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
      setSoloView(session.view as SoloView);
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
  }, [seed, soloView, difficulty, gameState, isSoloRoute]);

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
      setSoloView("game");
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
    setError(null);
    setSoloView("soloSetup");
    navigate("/");
  }

  function handleBackHome() {
    clearSession();
    setSeed(null);
    setGameState(undefined);
    setError(null);
    setSoloView("home");
    navigate("/");
  }

  function handleSaved() {
    setRecords(loadRecords());
  }

  function openRecords() {
    setRecords(loadRecords());
    setSoloView("records");
  }

  function handleDeleteRecord(id: string) {
    setRecords(deleteRecord(id));
  }

  function handleClearAllRecords() {
    clearRecords();
    setRecords([]);
  }

  function renderMain() {
    if (route.kind === "roomHub") {
      return <RoomHubView />;
    }
    if (route.kind === "roomCreate") {
      return <RoomCreateView />;
    }
    if (route.kind === "roomJoin") {
      return <RoomJoinView initialCode={route.code} />;
    }
    if (route.kind === "room") {
      return (
        <RoomFlow code={route.code} onImmersiveChange={setRoomImmersive} />
      );
    }

    if (soloView === "home") {
      return (
        <HomeView
          onSoloStart={() => {
            setError(null);
            setSoloView("soloSetup");
          }}
          onRoomPlay={() => navigate("/room")}
        />
      );
    }

    if (soloView === "soloSetup") {
      return (
        <SoloSetupView
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onPhotoSelect={handlePhotoSelect}
          onBack={() => {
            setError(null);
            setSoloView("home");
          }}
          loading={loading}
          error={error}
        />
      );
    }

    if (soloView === "game" && seed) {
      return (
        <ColorGuessingGame
          key={seed.id}
          photoDataUrl={seed.photoDataUrl}
          difficulty={seed.difficulty}
          targetColors={seed.targetColors}
          targetPositions={seed.targetPositions}
          initialGameState={gameState}
          onGameStateChange={setGameState}
          onNewPhoto={handleNewPhoto}
          onBackHome={handleBackHome}
          onPlayAgain={handlePlayAgain}
          playAgainBusy={loading}
          onSaved={handleSaved}
        />
      );
    }

    if (soloView === "records") {
      return (
        <RecordsView
          records={records}
          onBack={() => setSoloView(seed ? "game" : "home")}
          onDelete={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
        />
      );
    }

    return null;
  }

  return (
    <div
      className={`flex flex-col ${
        fullScreenMain ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      {!hideHeader && (
        <header
          className={
            transparentHeader
              ? "bg-transparent"
              : "border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm"
          }
        >
          <div
            className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 ${
              isSoloRoute && soloView === "game" ? "max-w-6xl" : "max-w-5xl"
            }`}
          >
            {!transparentHeader && (
              <div className="min-w-0">
                <h1 className="text-title text-lg sm:text-xl">{t("appName")}</h1>
              </div>
            )}
            {transparentHeader && <div className="flex-1" aria-hidden />}
            <div className="flex shrink-0 items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              {showRecordsButton && (
                <button
                  type="button"
                  onClick={openRecords}
                  className={HEADER_CHIP_CLASS}
                >
                  {t("records.titleShort")}
                  {records.length > 0 && (
                    <span className="tabular-nums">({records.length})</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main
        className={`mx-auto ${
          fullScreenMain
            ? "p-0"
            : centeredShell
              ? "flex w-full flex-1 flex-col px-5 sm:px-6"
              : isSoloRoute && soloView === "game"
                ? "flex min-h-0 flex-1 w-full flex-col overflow-hidden p-0"
                : "w-full px-3 py-4 sm:px-6 sm:py-6"
        } ${
          isSoloRoute && soloView === "game"
            ? "max-w-none"
            : centeredShell
              ? "max-w-5xl"
              : "max-w-5xl"
        }`}
      >
        {renderMain()}
      </main>
    </div>
  );
}
