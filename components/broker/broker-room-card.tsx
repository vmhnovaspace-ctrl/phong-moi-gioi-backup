import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Home,
  ImageIcon,
  MapPin,
  Ruler,
  Star,
  WalletCards
} from "lucide-react";
import { cancelRoomCloseRequestFromForm, createRoomCloseRequestFromForm } from "@/app/broker/actions";
import { StatusBadge } from "@/components/landlord/status-badge";
import type { BrokerInventoryRoom } from "@/lib/broker/types";
import { formatArea, formatCurrencyVnd, formatDate } from "@/lib/landlord/format";
import { buildGoogleMapsUrl } from "@/lib/maps";

type BrokerRoomCardProps = {
  room: BrokerInventoryRoom;
};

export function BrokerRoomCard({ room }: BrokerRoomCardProps) {
  const thumbnailUrl = room.cover_image_url || room.thumbnail?.image_url;
  const mapUrl = buildGoogleMapsUrl(room.building);
  const closeRequest = (room as BrokerInventoryRoom & { close_request?: { status: string } | null }).close_request;
  const isClosePending = closeRequest?.status === "pending";
  const location = [room.building.ward, room.building.district, room.building.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md">
      <div>
        <div className="hidden">
          {thumbnailUrl ? (
            <img
              alt={room.title || `Phòng ${room.room_code}`}
              className="h-full w-full object-cover"
              loading="lazy"
              src={thumbnailUrl}
            />
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center bg-slate-100 text-slate-400">
              <ImageIcon className="size-8" aria-hidden />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={room.status} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h5 className="truncate text-lg font-black text-slate-950">
                {room.title || `Phòng ${room.room_code}`}
              </h5>
              <div className="mt-2">
                <StatusBadge status={room.status} />
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{room.building.name}</span>
              </p>
            </div>
            {room.commission ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
                <Star className="size-3.5" aria-hidden />
                HH {room.commission}
              </span>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-end">
            <div>
              <p className="text-2xl font-black tabular-nums text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
              {room.deposit_amount ? (
                <p className="mt-1 text-sm font-medium text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
              {room.area_m2 ? <InfoItem icon={<Ruler className="size-4" aria-hidden />} label={formatArea(room.area_m2)} /> : null}
              {room.available_from ? (
                <InfoItem icon={<CalendarDays className="size-4" aria-hidden />} label={formatDate(room.available_from)} />
              ) : null}
              {room.min_lease_months ? (
                <InfoItem icon={<WalletCards className="size-4" aria-hidden />} label={`${room.min_lease_months} tháng`} />
              ) : null}
              {room.floor ? <InfoItem icon={<MapPin className="size-4" aria-hidden />} label={room.floor} /> : null}
            </div>
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

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p className="truncate font-medium">{location || room.building.address}</p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#0F5FD7] px-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
                href={`/broker/rooms/${room.id}`}
              >
                Xem chi tiết
              </Link>
              <form
                action={(isClosePending ? cancelRoomCloseRequestFromForm : createRoomCloseRequestFromForm).bind(
                  null,
                  room.id
                )}
              >
                <button
                  className="inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  type="submit"
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {isClosePending ? "Chờ chủ nhà xác nhận" : "Chốt phòng"}
                </button>
              </form>
              {room.room_drive_folder_url ? (
                <ExternalButton href={room.room_drive_folder_url} label="Ảnh Drive" />
              ) : null}
              {mapUrl ? <ExternalButton href={mapUrl} label="Mở vị trí" /> : null}
            </div>
          </div>
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

function InfoItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
