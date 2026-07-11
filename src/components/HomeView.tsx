import { t, useLocale } from "../i18n";

interface HomeViewProps {
  onSoloStart: () => void;
  onRoomPlay: () => void;
}

const homeBtn =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-base font-medium transition-colors hover:bg-[var(--color-bg)]";

export function HomeView({ onSoloStart, onRoomPlay }: HomeViewProps) {
  useLocale();

  return (
    <section className="home-landing mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-[22vh] pt-[10vh] sm:max-w-md">
      <div className="w-full text-center">
        <h2 className="text-title text-[1.75rem] sm:text-[2rem]">{t("appName")}</h2>

        <div className="mt-8 space-y-2.5 sm:mt-10">
          <button
            type="button"
            disabled
            className={`${homeBtn} flex-col py-3 text-stone-400`}
          >
            {t("home.dailyChallenge")}
            <span className="mt-0.5 text-xs font-normal">{t("home.comingSoon")}</span>
          </button>

          <button type="button" onClick={onSoloStart} className={`${homeBtn} text-stone-700`}>
            {t("home.soloGame")}
          </button>

          <button type="button" onClick={onRoomPlay} className={`${homeBtn} text-stone-700`}>
            {t("room.playWithFriends")}
          </button>
        </div>
      </div>
    </section>
  );
}
