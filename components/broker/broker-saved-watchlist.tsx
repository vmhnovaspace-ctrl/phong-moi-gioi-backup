"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Search } from "lucide-react";
import { StatusBadge } from "@/components/landlord/status-badge";
import type { BrokerSavedRoom } from "@/lib/broker/types";
import { normalizeBrokerSearchText } from "@/lib/broker/search";
import { formatCurrencyVnd, roomStatusLabels } from "@/lib/landlord/format";

type BrokerSavedWatchlistProps = {
  rooms: BrokerSavedRoom[];
};

export function BrokerSavedWatchlist({ rooms }: BrokerSavedWatchlistProps) {
  const [query, setQuery] = useState("");
  const filteredRooms = useMemo(() => {
    const needle = normalizeBrokerSearchText(query);

    if (!needle) {
      return rooms;
    }

    return rooms.filter((room) => {
      const haystack = normalizeBrokerSearchText(
        [
          room.room_code,
          room.title,
          room.rent_price,
          room.status,
          roomStatusLabels[room.status],
          room.building.name,
          room.building.address,
          room.building.ward,
          room.building.district,
          room.landlord?.full_name,
          room.landlord?.phone
        ].join(" ")
      );

      return haystack.includes(needle);
    });
  }, [query, rooms]);

  return (
    <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-[#0F5FD7]" aria-hidden />
              <h2 className="text-base font-bold text-slate-950">Phòng theo dõi</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Các phòng bạn đang theo dõi.</p>
          </div>
          <Link
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
            href="/broker/saved"
          >
            Mở phòng theo dõi
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <label className="mt-3 flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
          <input
            className="min-w-0 flex-1 text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã phòng, căn, giá, trạng thái..."
            value={query}
          />
        </label>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <p className="font-semibold text-slate-950">Bạn chưa theo dõi phòng nào.</p>
          <Link
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
            href="/broker/rooms"
          >
            Mở kho phòng
          </Link>
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {filteredRooms.map((room) => (
            <article className="rounded-md border border-slate-200 bg-slate-50 p-3" key={room.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {room.title || `Phòng ${room.room_code}`}
                  </p>
                  <p className="mt-1 text-base font-black text-slate-950">
                    {formatCurrencyVnd(room.rent_price)}
                  </p>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                {room.building.name} · {room.building.address}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                {room.commission ? (
                  <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0F5FD7]">
                    HH {room.commission}
                  </span>
                ) : (
                  <span />
                )}
                <Link
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  href={`/broker/rooms/${room.id}`}
                >
                  Chi tiết
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-slate-500">
          Không có phòng theo dõi khớp từ khóa.
        </div>
      )}
    </section>
  );
}
