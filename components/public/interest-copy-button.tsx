"use client";

import { useEffect, useState, useTransition } from "react";

const SUCCESS_MESSAGE = "Đã ghi nhận quan tâm. Môi giới sẽ liên hệ/xác nhận lại.";
const ERROR_MESSAGE = "Chưa gửi được thông tin quan tâm. Vui lòng thử lại.";

export function InterestCopyButton({
  packageSlug,
  roomId,
  text
}: {
  packageSlug: string;
  roomId: string;
  text: string;
}) {
  const storageKey = `customer-interest:${packageSlug}:${roomId}`;
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (window.localStorage.getItem(storageKey) === "sent") {
      setSent(true);
      setMessage(SUCCESS_MESSAGE);
    }
  }, [storageKey]);

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-bold text-white hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-slate-600"
        disabled={sent || isPending}
        onClick={() => {
          startTransition(async () => {
            try {
              const response = await fetch(`/p/${packageSlug}/interest`, {
                body: JSON.stringify({ roomId }),
                headers: {
                  "Content-Type": "application/json"
                },
                method: "POST"
              });
              const result = (await response.json()) as { error?: string; ok?: boolean };

              if (!result.ok) {
                setMessage(result.error ?? ERROR_MESSAGE);
                return;
              }

              try {
                await navigator.clipboard.writeText(text);
              } catch {
                // Copying is only a convenience; the in-app interest event was already recorded.
              }

              window.localStorage.setItem(storageKey, "sent");
              setSent(true);
              setMessage(SUCCESS_MESSAGE);
            } catch {
              setMessage(ERROR_MESSAGE);
            }
          });
        }}
        type="button"
      >
        {sent ? "Đã quan tâm" : isPending ? "Đang gửi..." : "Tôi quan tâm phòng này"}
      </button>
      {message ? (
        <p className={sent ? "text-xs font-medium text-[#047857]" : "text-xs font-medium text-[#B91C1C]"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
