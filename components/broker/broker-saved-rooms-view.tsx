"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, BookmarkX, Search } from "lucide-react";
import { setBrokerRoomSaved } from "@/app/broker/actions";
import { StatusBadge } from "@/components/landlord/status-badge";
import { normalizeBrokerSearchText } from "@/lib/broker/search";
import type { BrokerSavedRoom } from "@/lib/broker/types";
import { formatCurrencyVnd, roomStatusLabels } from "@/lib/landlord/format";

type BrokerSavedRoomsViewProps = {
  rooms: BrokerSavedRoom[];
};

export function BrokerSavedRoomsView({ rooms }: BrokerSavedRoomsViewProps) {
  const [query, setQuery] = useState("");
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
          room.commission
        ].join(" ")
      );

      return haystack.includes(needle);
    });
  }, [query, rooms]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Phòng theo dõi</h2>
          <p className="mt-1 text-sm text-slate-600">
            Các phòng bạn đang theo dõi.
          </p>
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-md border border-slate-300 bg-white px-3 lg:max-w-md">
          <Search className="size-4 shrink-0 text-slate-400" aria-hidden />
          <input
            className="min-w-0 flex-1 text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã phòng, căn, địa chỉ, giá, trạng thái..."
            value={query}
          />
        </label>
      </div>

      {rooms.length === 0 ? (
        <EmptyState />
      ) : filteredRooms.length > 0 ? (
        <section className="grid gap-3">
          {filteredRooms.map((room) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md"
              key={room.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={room.status} />
                    {room.commission ? (
                      <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0F5FD7]">
                        HH {room.commission}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 truncate text-base font-bold text-slate-950">
                    {room.title || `Phòng ${room.room_code}`}
                  </h3>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {formatCurrencyVnd(room.rent_price)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {room.building.name} · {room.building.address}
                    {room.building.district ? ` · ${room.building.district}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Theo dõi/cập nhật: {new Intl.DateTimeFormat("vi-VN").format(new Date(room.saved_at))}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
                    href={`/broker/rooms/${room.id}`}
                  >
                    Chi tiết
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <button
                    className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    disabled={isPending && pendingRoomId === room.id}
                    onClick={() => {
                      setPendingRoomId(room.id);
                      startTransition(async () => {
                        await setBrokerRoomSaved(room.id, false);
                        setPendingRoomId(null);
                      });
                    }}
                    type="button"
                  >
                    <BookmarkX className="size-4" aria-hidden />
                    Bỏ theo dõi
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Không có phòng theo dõi khớp từ khóa.
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
      <h3 className="text-base font-semibold text-slate-950">Bạn chưa theo dõi phòng nào.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Mở kho phòng và theo dõi những phòng cần xử lý để xem nhanh tại đây.
      </p>
      <Link
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
        href="/broker/rooms"
      >
        Mở kho phòng
      </Link>
    </section>
  );
}
