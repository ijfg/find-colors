import type { Difficulty } from "../types";
import { t, useLocale } from "../i18n";
import { DifficultySelector } from "./DifficultySelector";
import { PhotoUpload } from "./PhotoUpload";

interface SoloSetupViewProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPhotoSelect: (file: File) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function SoloSetupView({
  difficulty,
  onDifficultyChange,
  onPhotoSelect,
  onBack,
  loading,
  error,
}: SoloSetupViewProps) {
  useLocale();

  return (
    <section className="home-landing mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-[22vh] pt-[10vh] sm:max-w-md">
      <div className="w-full text-center">
        <h2 className="text-title text-[1.75rem] sm:text-[2rem]">{t("appName")}</h2>

        <div className="mt-8 space-y-4 sm:mt-10">
          <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
          <PhotoUpload onSelect={onPhotoSelect} loading={loading} />
        </div>

        {error && (
          <p className="text-caption mt-4 text-sm text-red-600/90">{error}</p>
        )}

        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          ← {t("records.back")}
        </button>
      </div>
    </section>
  );
}
