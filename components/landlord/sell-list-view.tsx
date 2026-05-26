import Link from "next/link";
import { CopyRoomButton } from "@/components/landlord/copy-room-button";
import { StatusBadge } from "@/components/landlord/status-badge";
import { formatArea, formatCurrencyVnd, formatDate } from "@/lib/landlord/format";
import type { SellListGroup } from "@/lib/landlord/types";
import { getSiteUrl } from "@/lib/env";
import { buildRoomShareText } from "@/lib/share/templates";

export function SellListView({ groups }: { groups: SellListGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-950">Chưa có phòng sell</h2>
        <p className="mt-2 text-sm text-slate-600">
          Danh sách này chỉ gồm phòng đang trống và sắp trống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={group.building.id}>
          <h2 className="text-lg font-bold text-slate-950">{group.building.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {group.building.address}
            {group.building.district ? ` · ${group.building.district}` : ""}
          </p>
          <div className="mt-4 grid gap-3">
            {group.rooms.map((room) => {
              const copyText = buildRoomShareText({ building: room.building, room }, getSiteUrl());

              return (
                <article className="rounded-md border border-slate-200 bg-slate-50 p-3" key={room.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">Phòng {room.room_code}</p>
                        <StatusBadge status={room.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatCurrencyVnd(room.rent_price)} · Cọc {formatCurrencyVnd(room.deposit_amount)} ·{" "}
                        {formatArea(room.area_m2)}
                        {room.available_from ? ` · Trống ${formatDate(room.available_from)}` : ""}
                        {room.min_lease_months ? ` · Tối thiểu ${room.min_lease_months} tháng` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        href={`/landlord/rooms/${room.id}/edit`}
                      >
                        Sửa
                      </Link>
                      <CopyRoomButton text={copyText} />
                      <button
                        className="h-9 cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-400"
                        disabled
                        type="button"
                      >
                        Gửi Zalo sau
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
