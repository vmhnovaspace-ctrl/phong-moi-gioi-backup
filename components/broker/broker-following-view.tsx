import Link from "next/link";
import { CheckCircle2, Home, MapPin, Ruler, Star } from "lucide-react";
import { setBrokerRoomSaved } from "@/app/broker/actions";
import { BrokerAutoRefresh } from "@/components/broker/broker-auto-refresh";
import { StatusBadge } from "@/components/landlord/status-badge";
import type {
  BrokerClosedRoom,
  BrokerClosedRoomPeriod,
  BrokerInventoryRoom,
  BrokerSavedRoom
} from "@/lib/broker/types";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";

type BrokerFollowingViewProps = {
  closedPeriod: BrokerClosedRoomPeriod;
  closedRooms: BrokerClosedRoom[];
  interestedRooms: BrokerInventoryRoom[];
  savedRooms: BrokerSavedRoom[];
};

const closedPeriodOptions: Array<{ label: string; value: BrokerClosedRoomPeriod }> = [
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" }
];

export function BrokerFollowingView({
  closedPeriod,
  closedRooms,
  interestedRooms,
  savedRooms
}: BrokerFollowingViewProps) {
  return (
    <div className="space-y-6">
      <BrokerAutoRefresh intervalMs={10000} />
      <header>
        <h2 className="text-2xl font-black text-slate-950">Phòng theo dõi</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Theo dõi các phòng đã lưu và phòng khách đã quan tâm sau khi Môi giới xử lý.
        </p>
      </header>

      <FollowingSection
        emptyText="Chưa có phòng đang theo dõi."
        rooms={savedRooms}
        title="Phòng đang theo dõi"
        withUnsave
      />

      <ClosedRoomsSection closedPeriod={closedPeriod} rooms={closedRooms} />

      <FollowingSection
        emptyText="Chưa có phòng khách quan tâm đã xử lý."
        rooms={interestedRooms}
        title="Phòng khách quan tâm"
      />
    </div>
  );
}

function ClosedRoomsSection({
  closedPeriod,
  rooms
}: {
  closedPeriod: BrokerClosedRoomPeriod;
  rooms: BrokerClosedRoom[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-950">Phòng đã chốt</h3>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
            {rooms.length} phòng
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {closedPeriodOptions.map((option) => {
            const isActive = option.value === closedPeriod;

            return (
              <Link
                className={`inline-flex min-h-9 items-center justify-center rounded-md px-3 text-sm font-bold ${
                  isActive ? "bg-[#0F5FD7] text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
                href={`/broker/following?closed=${option.value}`}
                key={option.value}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      </div>

      {rooms.length > 0 ? (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <ClosedRoomCard key={room.close_request.id} room={room} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Chưa có phòng đã chốt trong khoảng thời gian này.
        </p>
      )}
    </section>
  );
}

function ClosedRoomCard({ room }: { room: BrokerClosedRoom }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="line-clamp-1 text-base font-black text-slate-950">
              {room.title || `Phòng ${room.room_code}`}
            </h4>
            <StatusBadge status={room.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{room.building.name}</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Chủ nhà xác nhận: {formatConfirmedAt(room.confirmed_at)}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-lg font-black text-slate-950">
            {room.rent_price ? formatCurrencyVnd(room.rent_price) : "Chưa nhập giá"}
          </p>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-bold text-white hover:bg-[#0B4FB5]"
            href={`/broker/rooms/${room.id}`}
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

function FollowingSection({
  emptyText,
  rooms,
  title,
  withUnsave = false
}: {
  emptyText: string;
  rooms: BrokerInventoryRoom[];
  title: string;
  withUnsave?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
          {rooms.length} phòng
        </span>
      </div>

      {rooms.length > 0 ? (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <FollowingRoomCard key={room.id} room={room} withUnsave={withUnsave} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  );
}

function FollowingRoomCard({ room, withUnsave }: { room: BrokerInventoryRoom; withUnsave: boolean }) {
  const location = [room.building.ward, room.building.district, room.building.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="line-clamp-1 text-base font-black text-slate-950">
              {room.title || `Phòng ${room.room_code}`}
            </h4>
            <StatusBadge status={room.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{room.building.name}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="line-clamp-1">{location || room.building.address}</span>
          </p>
        </div>

        {withUnsave ? (
          <form action={setBrokerRoomSaved.bind(null, room.id, false)}>
            <button
              className="inline-flex size-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              title="Bỏ theo dõi"
              type="submit"
            >
              <CheckCircle2 className="size-5" aria-hidden />
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
        <p className="text-lg font-black text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
        {room.deposit_amount ? (
          <p className="text-sm font-medium text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
        ) : null}
        {room.area_m2 ? (
          <p className="inline-flex items-center gap-1 text-sm text-slate-500">
            <Ruler className="size-4" aria-hidden />
            {formatArea(room.area_m2)}
          </p>
        ) : null}
        {room.commission ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
            <Star className="size-3.5" aria-hidden />
            HH {room.commission}
          </span>
        ) : null}
        <Link
          className="ml-auto inline-flex min-h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-bold text-white hover:bg-[#0B4FB5]"
          href={`/broker/rooms/${room.id}`}
        >
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

function formatConfirmedAt(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok"
  }).format(new Date(value));
}
