import { useEffect } from "react";
import { t, useLocale } from "../i18n";

const LS_KEY = "color-game-howto-seen";

export function hasSeenHowTo(): boolean {
  try {
    return localStorage.getItem(LS_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHowToSeen(): void {
  try {
    localStorage.setItem(LS_KEY, "1");
  } catch {
    // ignore
  }
}

interface HowToPlayProps {
  open: boolean;
  onClose: () => void;
}

export function HowToPlay({ open, onClose }: HowToPlayProps) {
  useLocale();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="howto-title"
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="howto-title"
          className="text-title text-center text-lg text-[var(--color-ink)]"
        >
          {t("howto.title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
          {t("howto.goal")}
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
          <li>{t("howto.step1")}</li>
          <li>{t("howto.step2")}</li>
          <li>{t("howto.step3")}</li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)]">
          {t("howto.multiplayer")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          {t("howto.gotIt")}
        </button>
      </div>
    </div>
  );
}
