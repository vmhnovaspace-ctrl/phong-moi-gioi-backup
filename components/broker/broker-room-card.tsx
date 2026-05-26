import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Home,
  ImageIcon,
  MapPin,
  Ruler,
  WalletCards
} from "lucide-react";
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
  const location = [room.building.ward, room.building.district, room.building.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[168px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-slate-100 md:aspect-auto md:min-h-44">
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

        <div className="flex min-w-0 flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h5 className="truncate text-base font-bold text-slate-950">
                {room.title || `Phòng ${room.room_code}`}
              </h5>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate">{room.building.name}</span>
              </p>
            </div>
            {room.commission ? (
              <span className="w-fit rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                HH {room.commission}
              </span>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-end">
            <div>
              <p className="text-xl font-black text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
              {room.deposit_amount ? (
                <p className="mt-1 text-sm text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
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

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
            <p className="truncate">{location || room.building.address}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800"
                href={`/broker/rooms/${room.id}`}
              >
                Xem chi tiết
              </Link>
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
      className="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
      {label}
    </span>
  );
}

function InfoItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-2">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
