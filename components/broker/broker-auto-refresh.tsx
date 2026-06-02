"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type BrokerAutoRefreshProps = {
  intervalMs?: number;
};

export function BrokerAutoRefresh({ intervalMs = 15000 }: BrokerAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    const intervalId = window.setInterval(refreshWhenVisible, intervalMs);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [intervalMs, router]);

  return null;
}
