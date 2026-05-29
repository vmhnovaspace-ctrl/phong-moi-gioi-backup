"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Copy, ExternalLink, XCircle } from "lucide-react";
import { recordRoomSellEventAction } from "@/app/landlord/actions";
import type { RoomSellEventType } from "@/lib/landlord/types";

type ZaloShareButtonProps = {
  label: string;
  text: string;
  eventType: RoomSellEventType;
  buildingId?: string;
  roomId?: string;
  zaloUrl?: string | null;
  noZaloMessage: string;
  className?: string;
  variant?: "primary" | "secondary";
};

type ShareState = "idle" | "copied" | "error";

export function ZaloShareButton({
  buildingId,
  className,
  eventType,
  label,
  noZaloMessage,
  roomId,
  text,
  variant = "secondary",
  zaloUrl
}: ZaloShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    const copied = await writeClipboard(text);

    if (!copied) {
      setState("error");
      setMessage("Không copy được nội dung. Vui lòng thử lại.");
      return;
    }

    if (zaloUrl) {
      window.open(zaloUrl, "_blank", "noopener,noreferrer");
      setMessage("Đã copy nội dung và mở nhóm Zalo.");
    } else {
      setMessage(noZaloMessage);
    }

    setState("copied");
    startTransition(async () => {
      const result = await recordRoomSellEventAction(eventType, { buildingId, roomId });

      if (result.error) {
        setMessage(`Đã copy nội dung, nhưng chưa ghi nhận được lịch sử: ${result.error}`);
      }
    });
    window.setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="space-y-1">
      <button
        className={clsx(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70",
          variant === "primary"
            ? "bg-[#0F5FD7] text-white hover:bg-[#0B4FB5]"
            : "border border-[#BFDBFE] bg-white text-[#0F5FD7] hover:bg-[#EFF6FF]",
          className
        )}
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        {state === "copied" ? <Check className="size-4" aria-hidden /> : null}
        {state === "error" ? <XCircle className="size-4" aria-hidden /> : null}
        {state === "idle" && zaloUrl ? <ExternalLink className="size-4" aria-hidden /> : null}
        {state === "idle" && !zaloUrl ? <Copy className="size-4" aria-hidden /> : null}
        {state === "copied" ? "Đã copy" : label}
      </button>
      {message ? <p className="max-w-sm text-xs leading-5 text-slate-500">{message}</p> : null}
    </div>
  );
}

async function writeClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback for older mobile browsers.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
