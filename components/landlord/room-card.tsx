import Link from "next/link";
import { DoorOpen, Pencil } from "lucide-react";
import { formatArea } from "@/lib/landlord/format";
import type { Room } from "@/lib/landlord/types";
import { PriceDisplay } from "@/components/landlord/price-display";
import { StatusBadge } from "@/components/landlord/status-badge";
import { CopyLinkButton } from "@/components/share/copy-link-button";

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="size-4 text-teal-700" aria-hidden />
            <h2 className="text-base font-semibold text-slate-950">
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
        <Info label="Diện tích" value={formatArea(room.area_m2)} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
          href={`/landlord/rooms/${room.id}`}
        >
          Chi tiết
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href={`/landlord/rooms/${room.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa
        </Link>
        <CopyLinkButton className="w-full" label="Copy link" path={`/r/${room.public_slug}`} />
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900">{value}</div>
    </div>
  );
}
