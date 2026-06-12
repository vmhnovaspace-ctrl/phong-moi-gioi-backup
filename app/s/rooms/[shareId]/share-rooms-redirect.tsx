"use client";

import { useEffect } from "react";

export function ShareRoomsRedirect({
  brokerPath,
  brokerUrl,
}: {
  brokerPath: string;
  brokerUrl: string;
}) {
  useEffect(() => {
    window.location.replace(brokerPath);
  }, [brokerPath]);

  return (
    <a
      className="inline-flex h-11 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-bold text-white hover:bg-[#0B4FB5]"
      href={brokerUrl}
    >
      Xem phòng trống
    </a>
  );
}
