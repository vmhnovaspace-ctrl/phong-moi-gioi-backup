"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock3, Send, XCircle } from "lucide-react";
import { createRoomCloseRequest } from "@/app/broker/actions";
import type { BrokerRoomCloseRequestState } from "@/lib/broker/types";
import type { RoomStatus } from "@/lib/landlord/types";

type BrokerCloseRequestPanelProps = {
  closeRequest: BrokerRoomCloseRequestState | null;
  roomId: string;
  roomStatus: RoomStatus;
};

export function BrokerCloseRequestPanel({
  closeRequest,
  roomId,
  roomStatus
}: BrokerCloseRequestPanelProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isSellable = roomStatus === "available" || roomStatus === "coming_soon";
  const isWaiting = closeRequest?.status === "pending";
  const isApproved = closeRequest?.status === "approved";

  function handleSubmit() {
    const confirmed = window.confirm("Bạn muốn báo với chủ nhà rằng phòng này đã chốt?");

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await createRoomCloseRequest(roomId, note);

      if (result.error) {
        setError(result.error);
        return;
      }

      setNote("");
      setMessage(result.message ?? "Đã gửi báo chốt, chờ chủ nhà xác nhận.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        {isApproved ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#047857]" aria-hidden />
        ) : isWaiting ? (
          <Clock3 className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        ) : (
          <Send className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{statusTitle(closeRequest, isSellable)}</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">{statusDescription(closeRequest, isSellable)}</p>
          {closeRequest?.status === "pending" && closeRequest.broker_note ? (
            <p className="mt-2 text-xs leading-5 text-slate-600">Ghi chú đã gửi: {closeRequest.broker_note}</p>
          ) : null}
        </div>
      </div>

      {!isWaiting && !isApproved && isSellable ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="close-request-note">
            Ghi chú cho chủ nhà
          </label>
          <textarea
            className="min-h-20 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            id="close-request-note"
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ví dụ: Khách đã cọc, chờ chủ nhà xác nhận."
            value={note}
          />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-amber-700 px-3 text-sm font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-400"
            disabled={isPending}
            onClick={handleSubmit}
            type="button"
          >
            <Send className="size-4" aria-hidden />
            {isPending ? "Đang gửi..." : "Báo đã chốt phòng"}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-xs leading-5 text-[#047857]">{message}</p> : null}
      {error ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs leading-5 text-red-700">
          <XCircle className="size-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function statusTitle(closeRequest: BrokerRoomCloseRequestState | null, isSellable: boolean) {
  if (closeRequest?.status === "pending") {
    return "Đã gửi báo chốt";
  }

  if (closeRequest?.status === "approved") {
    return "Chủ nhà đã xác nhận phòng đã chốt";
  }

  if (closeRequest?.status === "rejected") {
    return "Chủ nhà đã từ chối báo chốt trước đó";
  }

  if (closeRequest?.status === "cancelled") {
    return "Báo chốt trước đó đã hủy";
  }

  if (!isSellable) {
    return "Phòng này không còn trong danh sách sell";
  }

  return "Môi giới báo đã chốt phòng";
}

function statusDescription(closeRequest: BrokerRoomCloseRequestState | null, isSellable: boolean) {
  if (closeRequest?.status === "pending") {
    return "Đã gửi báo chốt, chờ chủ nhà xác nhận.";
  }

  if (closeRequest?.status === "approved") {
    return "Phòng đã được chủ nhà chuyển sang Đã thuê.";
  }

  if (closeRequest?.status === "rejected") {
    return isSellable
      ? "Bạn có thể báo lại nếu đã có thông tin chốt mới."
      : "Phòng này hiện không còn sell được.";
  }

  if (closeRequest?.status === "cancelled") {
    return isSellable
      ? "Bạn có thể gửi lại báo chốt nếu có thông tin mới."
      : "Phòng này hiện không còn sell được.";
  }

  if (!isSellable) {
    return "Chỉ phòng Đang trống hoặc Sắp trống mới báo chốt được.";
  }

  return "Báo với chủ nhà để họ xác nhận trước khi phòng chuyển sang Đã thuê.";
}
