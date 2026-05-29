"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { markRoomRentedFromSellListAction } from "@/app/landlord/actions";

type CloseRoomButtonProps = {
  roomId: string;
};

export function CloseRoomButton({ roomId }: CloseRoomButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      "Xác nhận phòng này đã chốt? Phòng sẽ không còn hiện trong danh sách sell của môi giới."
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    startTransition(async () => {
      const result = await markRoomRentedFromSellListAction(roomId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.message ?? "Đã chốt phòng.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        <CheckCircle className="size-4" aria-hidden />
        {isPending ? "Đang chốt..." : "Đã chốt phòng"}
      </button>
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
