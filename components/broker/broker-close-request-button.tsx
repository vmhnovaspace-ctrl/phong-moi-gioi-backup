"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import {
  acknowledgeRoomCloseRequest,
  cancelRoomCloseRequest,
  createRoomCloseRequest
} from "@/app/broker/actions";
import type { BrokerRoomCloseRequestState, RoomCloseRequestStatus } from "@/lib/broker/types";

type BrokerCloseRequestButtonProps = {
  closeRequest: BrokerRoomCloseRequestState | null | undefined;
  roomId: string;
};

type LocalCloseState =
  | { id: string; status: Extract<RoomCloseRequestStatus, "approved" | "pending" | "rejected"> }
  | null;

export function BrokerCloseRequestButton({ closeRequest, roomId }: BrokerCloseRequestButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localCloseRequest, setLocalCloseRequest] = useState<LocalCloseState>(() =>
    closeRequest && (closeRequest.status === "pending" || closeRequest.status === "approved" || closeRequest.status === "rejected")
      ? { id: closeRequest.id, status: closeRequest.status }
      : null
  );
  const status = localCloseRequest?.status ?? null;

  useEffect(() => {
    setLocalCloseRequest(
      closeRequest && (closeRequest.status === "pending" || closeRequest.status === "approved" || closeRequest.status === "rejected")
        ? { id: closeRequest.id, status: closeRequest.status }
        : null
    );
  }, [closeRequest?.id, closeRequest?.status]);

  function runAction(action: () => Promise<{ error?: string; message?: string }>, optimisticState: LocalCloseState) {
    const previousState = localCloseRequest;
    setError(null);
    setLocalCloseRequest(optimisticState);

    startTransition(async () => {
      const result = await action();

      if (result.error) {
        setLocalCloseRequest(previousState);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  if (status === "approved" || status === "rejected") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">
          {status === "approved" ? "Chủ nhà đã xác nhận" : "Chủ nhà đã từ chối"}
        </span>
        <button
          className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF] disabled:cursor-wait disabled:opacity-70"
          disabled={isPending}
          onClick={() => {
            if (!localCloseRequest) {
              return;
            }

            runAction(
              () => acknowledgeRoomCloseRequest(localCloseRequest.id, roomId),
              null
            );
          }}
          type="button"
        >
          Đã biết
        </button>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
          disabled={isPending}
          onClick={() => runAction(() => cancelRoomCloseRequest(roomId), null)}
          type="button"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Chờ chủ nhà xác nhận
        </button>
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
        disabled={isPending}
        onClick={() => runAction(() => createRoomCloseRequest(roomId), { id: "optimistic", status: "pending" })}
        type="button"
      >
        <CheckCircle2 className="size-3.5" aria-hidden />
        Chốt phòng
      </button>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
