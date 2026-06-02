import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { BrokerCloseRequestButton } from "@/components/broker/broker-close-request-button";
import { StatusBadge } from "@/components/landlord/status-badge";
import type { BrokerInventoryRoom } from "@/lib/broker/types";
import { formatCurrencyVnd } from "@/lib/landlord/format";

type BrokerRoomCardProps = {
  room: BrokerInventoryRoom;
};

export function BrokerRoomCard({ room }: BrokerRoomCardProps) {
  const roomType = getRoomTypeLabel(room);

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md">
      <div className="flex min-w-0 flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h5 className="truncate text-base font-black text-slate-800">
                {room.title || `Phòng ${room.room_code}`}
              </h5>
              <StatusBadge status={room.status} />
              {room.commission ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
                  <Star className="size-3.5" aria-hidden />
                  HH {room.commission}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Giá thuê" value={formatCurrencyVnd(room.rent_price)} />
          <InfoItem label="Tiền cọc" value={room.deposit_amount ? formatCurrencyVnd(room.deposit_amount) : "Chưa nhập"} />
          <InfoItem label="Tầng" value={room.floor || "Chưa nhập"} />
          <InfoItem label="Dạng phòng" value={roomType} />
        </div>

        {room.features ? (
          <div className="flex flex-wrap gap-1.5">
            {room.features.is_furnished ? <FeatureChip label="Nội thất" /> : null}
            {room.features.allows_pet ? <FeatureChip label="Thú cưng" /> : null}
            {room.features.has_balcony ? <FeatureChip label="Ban công" /> : null}
            {room.features.has_parking ? <FeatureChip label="Chỗ xe" /> : null}
            {room.features.has_window ? <FeatureChip label="Cửa sổ" /> : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#0F5FD7] px-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
            href={`/broker/rooms/${room.id}`}
          >
            Xem chi tiết
          </Link>
          <BrokerCloseRequestButton closeRequest={room.close_request} roomId={room.id} />
          {room.room_drive_folder_url ? <ExternalButton href={room.room_drive_folder_url} label="Ảnh/Drive" /> : null}
        </div>
      </div>
    </article>
  );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF]"
      href={href}
      rel="noreferrer"
      target="_blank"
      title={label}
    >
      {label}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

function FeatureChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
      {label}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 truncate whitespace-nowrap text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function getRoomTypeLabel(room: BrokerInventoryRoom) {
  const record = room as BrokerInventoryRoom & {
    room_type?: string | null;
    roomType?: string | null;
    room_kind?: string | null;
  };
  const value = record.room_type ?? record.roomType ?? record.room_kind;

  return value && value.trim().length > 0 ? value : "Chưa nhập";
}
