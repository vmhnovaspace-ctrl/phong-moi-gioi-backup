import Link from "next/link";
import { ArrowRight, Bell, CalendarClock, CheckCircle2, Home, Search } from "lucide-react";
import { markCustomerInterestEventRead } from "@/app/broker/actions";
import { BrokerSavedWatchlist } from "@/components/broker/broker-saved-watchlist";
import { StatusBadge } from "@/components/landlord/status-badge";
import type {
  BrokerDashboard as BrokerDashboardData,
  BrokerRoomListItem,
  CustomerRoomPackageEvent
} from "@/lib/broker/types";
import { formatCurrencyVnd } from "@/lib/landlord/format";

type BrokerDashboardProps = {
  dashboard: BrokerDashboardData;
};

export function BrokerDashboard({ dashboard }: BrokerDashboardProps) {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Đang trống" tone="green" value={dashboard.available_rooms} />
        <Metric label="Sắp trống" tone="blue" value={dashboard.coming_soon_rooms} />
        <Metric label="Tổng phòng sell" tone="slate" value={dashboard.total_visible_rooms} />
      </section>

      {dashboard.customer_interest_events.length > 0 ? (
        <CustomerInterestNotifications
          events={dashboard.customer_interest_events}
          unreadCount={dashboard.unread_customer_interest_count}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-teal-700" aria-hidden />
                <h2 className="text-base font-bold text-slate-950">Phòng mới cập nhật</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                5 phòng visible mới nhất đang trống hoặc sắp trống.
              </p>
            </div>
            <Link
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
              href="/broker/rooms"
            >
              Mở kho phòng
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {dashboard.recent_rooms.length > 0 ? (
            <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
              {dashboard.recent_rooms.slice(0, 5).map((room) => (
                <RecentRoomItem key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <EmptyDashboardState />
          )}
        </section>

        <BrokerSavedWatchlist rooms={dashboard.saved_rooms.slice(0, 5)} />
      </div>
    </div>
  );
}

function CustomerInterestNotifications({
  events,
  unreadCount
}: {
  events: CustomerRoomPackageEvent[];
  unreadCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-amber-200 bg-amber-50 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-amber-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 size-5 text-amber-700" aria-hidden />
          <div>
            <h2 className="text-base font-bold text-slate-950">Thông báo mới</h2>
            <p className="mt-0.5 text-sm text-amber-800">
              {unreadCount > 0
                ? `${unreadCount} khách vừa quan tâm phòng trong gói đã gửi.`
                : "Các quan tâm gần đây từ link gói phòng."}
            </p>
          </div>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          href="/broker/send"
        >
          Mở Gửi khách
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-3 p-3">
        {events.map((event) => (
          <article
            className={
              event.is_read
                ? "rounded-md border border-slate-200 bg-white p-4"
                : "rounded-md border border-amber-300 bg-white p-4 shadow-sm"
            }
            key={event.id}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-slate-950">
                    Khách {event.customer_name || "trong gói"} vừa quan tâm {roomLabel(event)}
                  </h3>
                  {!event.is_read ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      Mới
                    </span>
                  ) : null}
                </div>
                {event.customer_need ? (
                  <p className="mt-2 text-sm leading-6 text-slate-700">Nhu cầu: {event.customer_need}</p>
                ) : null}
                {event.customer_phone ? (
                  <p className="mt-1 text-sm font-semibold text-slate-700">SĐT/Zalo: {event.customer_phone}</p>
                ) : null}
                {event.house_address ? (
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{event.house_address}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">{formatEventTime(event.created_at)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/p/${event.package_public_slug}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Mở gói phòng
                </Link>
                {!event.is_read ? (
                  <form action={markCustomerInterestEventRead.bind(null, event.id)}>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
                      type="submit"
                    >
                      <CheckCircle2 className="size-4" aria-hidden />
                      Đã xử lý
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RecentRoomItem({ room }: { room: BrokerRoomListItem }) {
  const location = [room.building.name, room.building.ward, room.building.district]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="px-4 py-3 transition hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="truncate text-sm font-bold text-slate-950 hover:text-teal-700"
              href={`/broker/rooms/${room.id}`}
            >
              {room.title || `Phòng ${room.room_code}`}
            </Link>
            <StatusBadge status={room.status} />
          </div>
          <p className="mt-1 text-base font-black text-slate-950">
            {formatCurrencyVnd(room.rent_price)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{location || room.building.address}</span>
          </p>
          {room.commission ? (
            <p className="mt-1 text-xs font-semibold text-teal-700">HH {room.commission}</p>
          ) : null}
        </div>
        <p className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {formatUpdatedAt(room.updated_at)}
        </p>
      </div>
    </article>
  );
}

function Metric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "blue" | "green" | "slate";
  value: number;
}) {
  const toneClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    slate: "border-slate-200 bg-white text-slate-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
          Live
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-normal text-slate-950">{value}</p>
    </div>
  );
}

function EmptyDashboardState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <CalendarClock className="size-8 text-slate-300" aria-hidden />
      <h3 className="mt-3 text-sm font-semibold text-slate-950">Chưa có phòng sell</h3>
      <p className="mt-1 text-sm text-slate-500">
        Khi landlord có phòng visible và cấp quyền, danh sách sẽ xuất hiện tại đây.
      </p>
    </div>
  );
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);

  return `${time} - ${dayMonth}`;
}

function roomLabel(event: CustomerRoomPackageEvent) {
  return event.room_name || (event.room_code ? `Phòng ${event.room_code}` : "một phòng");
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}
