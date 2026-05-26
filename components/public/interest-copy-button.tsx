"use client";

import { useEffect, useState, useTransition } from "react";

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
    setSent(window.localStorage.getItem(storageKey) === "sent");
  }, [storageKey]);

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
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
                setMessage(result.error ?? "Chưa gửi được thông tin quan tâm. Vui lòng thử lại.");
                return;
              }

              try {
                await navigator.clipboard.writeText(text);
              } catch {
                // Clipboard copy is only a convenience; the broker notification was already recorded.
              }

              window.localStorage.setItem(storageKey, "sent");
              setSent(true);
              setMessage("Đã gửi thông tin cho môi giới. Môi giới sẽ liên hệ bạn sớm.");
            } catch {
              setMessage("Chưa gửi được thông tin quan tâm. Vui lòng thử lại.");
            }
          });
        }}
        type="button"
      >
        {sent ? "Đã gửi quan tâm" : isPending ? "Đang gửi..." : "Tôi quan tâm phòng này"}
      </button>
      {message ? (
        <p className={sent ? "text-xs font-medium text-teal-700" : "text-xs font-medium text-rose-700"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
