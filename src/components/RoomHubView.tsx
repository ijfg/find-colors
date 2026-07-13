import { t, useLocale } from "../i18n";
import { navigate } from "../lib/routing";

const actionBtn =
  "min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg)]";

export function RoomHubView() {
  useLocale();

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 py-4 sm:max-w-md">
      <div className="text-center">
        <h2 className="text-title text-xl">{t("room.hubTitle")}</h2>
      </div>
      <div className="flex flex-col gap-2">
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
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink-secondary)]"
        >
          ← {t("room.backHome")}
        </button>
      </div>
    </div>
  );
}
