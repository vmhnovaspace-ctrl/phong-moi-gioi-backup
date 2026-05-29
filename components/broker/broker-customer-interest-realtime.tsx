"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type CustomerInterestRow = {
  customer_name?: string | null;
  package_public_slug?: string | null;
  room_code?: string | null;
  room_name?: string | null;
};

type BrokerCustomerInterestRealtimeProps = {
  brokerId: string;
};

export function BrokerCustomerInterestRealtime({ brokerId }: BrokerCustomerInterestRealtimeProps) {
  const router = useRouter();
  const [latest, setLatest] = useState<CustomerInterestRow | null>(null);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`customer-interest-events:${brokerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `broker_id=eq.${brokerId}`,
          schema: "public",
          table: "customer_room_package_events"
        },
        (payload) => {
          setLatest(payload.new as CustomerInterestRow);
          setNewCount((count) => count + 1);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [brokerId, router]);

  if (!latest) {
    return null;
  }

  const roomLabel = latest.room_name || (latest.room_code ? `Phòng ${latest.room_code}` : "một phòng");
  const customerLabel = latest.customer_name ? `Khách ${latest.customer_name}` : "Khách";

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-amber-200 bg-white p-3 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <Bell className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">
            {customerLabel} vừa quan tâm {roomLabel}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            {newCount > 1 ? `${newCount} quan tâm mới trong phiên này. ` : ""}
            Mở khu Tìm phòng và Gửi khách để xem chi tiết.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-xs font-bold text-white hover:bg-[#0B4FB5]"
              href="/broker/send"
              onClick={() => setLatest(null)}
            >
              Xem khách quan tâm
            </Link>
            {latest.package_public_slug ? (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                href={`/p/${latest.package_public_slug}`}
                target="_blank"
              >
                Mở gói phòng
              </Link>
            ) : null}
          </div>
        </div>
        <button
          aria-label="Đóng thông báo"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          onClick={() => setLatest(null)}
          type="button"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
