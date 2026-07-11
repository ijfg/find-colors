import type { ReactNode } from "react";
import type { RoomPublicView } from "../lib/roomTypes";
import { t, useLocale } from "../i18n";

interface RoomWaitingViewProps {
  room: RoomPublicView;
  statusPanel?: ReactNode;
}

export function RoomWaitingView({ room, statusPanel }: RoomWaitingViewProps) {
  useLocale();
  const progress = room.playerCount > 0 ? room.submittedCount / room.playerCount : 0;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <div className="space-y-6 text-center">
        {statusPanel && <div className="text-left">{statusPanel}</div>}

        <div className="space-y-3">
          <h2 className="text-title text-xl">{t("room.waitingTitle")}</h2>
          <p className="text-body text-sm">{t("room.waitingHint")}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-stone-800">
            {t("room.submittedCount", {
              submitted: String(room.submittedCount),
              total: String(room.playerCount),
            })}
          </p>
          <div className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
