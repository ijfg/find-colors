import { t, useLocale } from "../i18n";
import { navigate } from "../lib/routing";

const actionBtn =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-base font-medium transition-colors hover:bg-[var(--color-bg)] text-[var(--color-ink-secondary)]";

export function RoomHubView() {
  useLocale();

  return (
    <section className="home-landing mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-[22vh] pt-[10vh] sm:max-w-md">
      <div className="w-full text-center">
        <h2 className="text-title text-[1.75rem] sm:text-[2rem]">{t("room.hubTitle")}</h2>

        <div className="mt-8 space-y-2.5 sm:mt-10">
          <button
            type="button"
            onClick={() => navigate("/room/create")}
            className={actionBtn}
          >
            {t("room.createRoom")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/room/join")}
            className={actionBtn}
          >
            {t("room.joinRoom")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
        >
          ← {t("room.backHome")}
        </button>
      </div>
    </section>
  );
}
