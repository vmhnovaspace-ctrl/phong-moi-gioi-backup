import Link from "next/link";
import { CalendarDays, DoorOpen, Pencil, Ruler } from "lucide-react";
import { formatArea, formatDate } from "@/lib/landlord/format";
import type { Room } from "@/lib/landlord/types";
import { PriceDisplay } from "@/components/landlord/price-display";
import { StatusBadge } from "@/components/landlord/status-badge";

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0F5FD7]">
              <DoorOpen className="size-4" aria-hidden />
            </span>
            <h2 className="text-base font-bold text-slate-950">
              {room.title || `Phòng ${room.room_code}`}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Mã {room.room_code}
            {room.floor ? ` · Tầng ${room.floor}` : ""}
          </p>
        </div>
        <StatusBadge status={room.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Info label="Giá thuê" value={<PriceDisplay value={room.rent_price} />} />
        <Info icon={<Ruler className="size-4" aria-hidden />} label="Diện tích" value={formatArea(room.area_m2)} />
        {room.available_from ? (
          <Info icon={<CalendarDays className="size-4" aria-hidden />} label="Ngày vào" value={formatDate(room.available_from)} />
        ) : null}
        {room.commission ? <Info label="Hoa hồng" value={room.commission} /> : null}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0F5FD7] px-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
          href={`/landlord/rooms/${room.id}`}
        >
          Chi tiết
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF]"
          href={`/landlord/rooms/${room.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa
        </Link>
      </div>
    </article>
  );
}

function Info({
  icon,
  label,
  value
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
