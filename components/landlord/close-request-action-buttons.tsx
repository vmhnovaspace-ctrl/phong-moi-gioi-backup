"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { confirmRoomCloseRequest, rejectRoomCloseRequest } from "@/app/landlord/actions";

type CloseRequestActionButtonsProps = {
  requestId: string;
};

export function CloseRequestActionButtons({ requestId }: CloseRequestActionButtonsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(action: "confirm" | "reject") {
    const confirmed = window.confirm(
      action === "confirm"
        ? "Xác nhận phòng này đã chốt? Phòng sẽ chuyển sang Đã thuê và không còn hiện trong danh sách sell."
        : "Từ chối báo chốt này? Phòng vẫn tiếp tục nằm trong danh sách sell."
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    startTransition(async () => {
      const result =
        action === "confirm"
          ? await confirmRoomCloseRequest(requestId)
          : await rejectRoomCloseRequest(requestId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.message ?? "Đã xử lý yêu cầu báo chốt.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          onClick={() => run("confirm")}
          type="button"
        >
          <CheckCircle className="size-4" aria-hidden />
          {isPending ? "Đang xử lý..." : "Xác nhận đã chốt"}
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => run("reject")}
          type="button"
        >
          Từ chối
        </button>
      </div>
      {message ? <p className="text-xs leading-5 text-[#047857]">{message}</p> : null}
      {error ? (
        <p className="inline-flex items-center gap-1 text-xs leading-5 text-red-700">
          <XCircle className="size-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
