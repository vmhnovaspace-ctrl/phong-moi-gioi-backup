"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRoomCloseRequestSeenAction } from "@/app/landlord/actions";
import type { LandlordCloseToastItem } from "@/lib/landlord/types";

type LandlordCloseToastProps = {
  items: LandlordCloseToastItem[];
};

export function LandlordCloseToast({ items }: LandlordCloseToastProps) {
  const router = useRouter();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.includes(item.id)).slice(0, 1),
    [hiddenIds, items]
  );

  if (visibleItems.length === 0) {
    return null;
  }

  const item = visibleItems[0];

  function hideToast(requestId: string) {
    setHiddenIds((current) => (current.includes(requestId) ? current : [...current, requestId]));
  }

  function markSeen(requestId: string, nextHref?: string) {
    hideToast(requestId);
    startTransition(async () => {
      await markRoomCloseRequestSeenAction(requestId);
      if (nextHref) {
        router.push(nextHref);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
        <p className="text-sm font-bold text-slate-950">Có báo chốt phòng mới</p>
        <p className="mt-1 text-sm text-slate-600">
          Môi giới vừa báo chốt phòng {item.room_code} - {item.building_name}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={isPending}
            onClick={() => markSeen(item.id, "/landlord/sell-list")}
            type="button"
          >
            Xem
          </button>
          <button
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isPending}
            onClick={() => markSeen(item.id)}
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
