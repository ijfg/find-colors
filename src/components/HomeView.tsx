import type { Difficulty } from "../types";
import { DifficultySelector } from "./DifficultySelector";
import { PhotoUpload } from "./PhotoUpload";

interface HomeViewProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onPhotoSelect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
}

export function HomeView({
  difficulty,
  onDifficultyChange,
  onPhotoSelect,
  loading,
  error,
}: HomeViewProps) {
  return (
    <section className="home-landing mx-auto grid w-full max-w-sm flex-1 grid-rows-[var(--home-hero-row)_auto_1fr] sm:max-w-md">
      <div className="flex flex-col justify-end pb-6 text-center sm:pb-8">
        <h2 className="text-title text-[1.75rem] sm:text-[2rem]">找颜色</h2>
        <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
      </div>

      <PhotoUpload onSelect={onPhotoSelect} loading={loading} />

      <div className="min-h-0">
        {error && (
          <p className="text-caption mt-4 text-center text-sm text-red-600/90">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
