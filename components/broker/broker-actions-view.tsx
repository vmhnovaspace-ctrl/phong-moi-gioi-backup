"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookmarkMinus,
  ClipboardList,
  ExternalLink,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { setBrokerRoomSaved } from "@/app/broker/actions";
import { RoomPostGeneratorButton } from "@/components/broker/room-post-generator-button";
import { StatusBadge } from "@/components/landlord/status-badge";
import type { BrokerActionWorkspaceRoom } from "@/lib/broker/types";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";

type BrokerActionFilter = "all" | "saved" | "recent" | "has_image" | "has_drive" | "no_photo";

type BrokerActionsViewProps = {
  rooms: BrokerActionWorkspaceRoom[];
};

const filters: Array<{ label: string; value: BrokerActionFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Phòng theo dõi", value: "saved" },
  { label: "Mới cập nhật", value: "recent" },
  { label: "Có ảnh", value: "has_image" },
  { label: "Có Drive", value: "has_drive" },
  { label: "Chưa có ảnh", value: "no_photo" }
];

export function BrokerActionsView({ rooms }: BrokerActionsViewProps) {
  const [filter, setFilter] = useState<BrokerActionFilter>("all");
  const filteredRooms = useMemo(
    () => rooms.filter((room) => matchesActionFilter(room, filter)),
    [filter, rooms]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Hành động môi giới</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Chọn phòng để tạo bài đăng, mở ảnh hoặc ghi chú khách.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            className={
              filter === item.value
                ? "h-10 whitespace-nowrap rounded-full bg-[#0F5FD7] px-4 text-sm font-semibold text-white"
                : "h-10 whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            }
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {rooms.length === 0 ? (
        <EmptyState />
      ) : filteredRooms.length > 0 ? (
        <section className="grid gap-3">
          {filteredRooms.map((room) => (
            <ActionRoomCard key={room.id} room={room} />
          ))}
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Không có phòng khớp bộ lọc này.
        </section>
      )}
    </div>
  );
}

function ActionRoomCard({ room }: { room: BrokerActionWorkspaceRoom }) {
  const imageStatus = getImageStatus(room);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const driveUrl = room.room_drive_folder_url || room.building.building_drive_folder_url;
  const title = room.title || `Phòng ${room.room_code}`;
  const location = [room.building.district, room.building.ward].filter(Boolean).join(" · ");
  const meta = [location || room.building.name, room.area_m2 ? formatArea(room.area_m2) : null]
    .filter(Boolean)
    .join(" · ");

  function toggleFollow() {
    startTransition(async () => {
      await setBrokerRoomSaved(room.id, !room.action?.is_saved);
      setMenuOpen(false);
      router.refresh();
    });
  }

  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md sm:p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={room.status} />
            {sourceBadges(room).map((badge) => (
              <span
                className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                key={badge}
              >
                {badge}
              </span>
            ))}
            <span className={imageStatus.className}>{imageStatus.label}</span>
          </div>

          <div className="mt-2 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-slate-950">{title}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">{meta || room.building.name}</p>
            </div>
            <p className="text-lg font-black text-slate-950 sm:text-right">{formatCurrencyVnd(room.rent_price)}</p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{hasAnyAction(room) ? "Đã thao tác" : "Chưa thao tác"}</span>
            {room.action?.private_note || room.action?.customer_note ? <span>Có ghi chú</span> : null}
          </div>
        </div>

        <button
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => setMenuOpen((value) => !value)}
          type="button"
        >
          <MoreHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">Hành động</span>
        </button>
      </div>

      {menuOpen ? (
        <div className="absolute right-3 top-14 z-20 w-[min(calc(100vw-2rem),310px)] rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          <RoomPostGeneratorButton
            input={{
              building: room.building,
              features: room.features,
              fees: room.effective_fees,
              images: room.images,
              room
            }}
            label="Tạo bài đăng"
            variant="menu"
          />
          <ActionMenuLink href={`/broker/rooms/${room.id}`} icon={<Eye className="size-4" aria-hidden />}>
            Xem chi tiết / ghi chú
          </ActionMenuLink>
          {driveUrl ? (
            <ActionMenuExternal href={driveUrl} icon={<ExternalLink className="size-4" aria-hidden />}>
              Mở Drive ảnh
            </ActionMenuExternal>
          ) : null}
          <button
            className="flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={isPending}
            onClick={toggleFollow}
            type="button"
          >
            {room.action?.is_saved ? (
              <BookmarkMinus className="size-4 text-slate-400" aria-hidden />
            ) : (
              <Bookmark className="size-4 text-slate-400" aria-hidden />
            )}
            {room.action?.is_saved ? "Bỏ theo dõi" : "Theo dõi phòng"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ActionMenuLink({
  children,
  href,
  icon
}: {
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </Link>
  );
}

function ActionMenuExternal({
  children,
  href,
  icon
}: {
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </a>
  );
}

function matchesActionFilter(room: BrokerActionWorkspaceRoom, filter: BrokerActionFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "has_image") {
    return hasPostImages(room);
  }

  if (filter === "has_drive") {
    return hasDrive(room);
  }

  if (filter === "no_photo") {
    return !hasPostImages(room) && !hasDrive(room);
  }

  return room.action_sources.includes(filter);
}

function sourceBadges(room: BrokerActionWorkspaceRoom) {
  return [
    room.action_sources.includes("saved") ? "Phòng theo dõi" : null,
    room.action_sources.includes("recent") ? "Mới cập nhật" : null,
    room.action_sources.includes("tracked") ? "Đã thao tác" : null
  ].filter((badge): badge is string => Boolean(badge));
}

function hasAnyAction(room: BrokerActionWorkspaceRoom) {
  const action = room.action;

  return Boolean(
    action?.posted_chotot ||
      action?.posted_mogi ||
      action?.posted_facebook ||
      action?.sent_to_customer ||
      action?.private_note ||
      action?.customer_note
  );
}

function getImageStatus(room: BrokerActionWorkspaceRoom) {
  if (hasPostImages(room) && hasDrive(room)) {
    return {
      className: "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700",
      label: "Có ảnh + Drive"
    };
  }

  if (hasPostImages(room)) {
    return {
      className: "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700",
      label: "Có ảnh"
    };
  }

  if (hasDrive(room)) {
    return {
      className: "rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]",
      label: "Có Drive"
    };
  }

  return {
    className: "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700",
    label: "Chưa có ảnh"
  };
}

function hasPostImages(room: BrokerActionWorkspaceRoom) {
  return Boolean(room.cover_image_url || room.images.length > 0);
}

function hasDrive(room: BrokerActionWorkspaceRoom) {
  return Boolean(room.room_drive_folder_url || room.building.building_drive_folder_url);
}

function EmptyState() {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
      <ClipboardList className="mx-auto size-9 text-slate-300" aria-hidden />
      <h3 className="mt-3 text-base font-semibold text-slate-950">Bạn chưa có phòng để thao tác.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Theo dõi phòng hoặc mở kho phòng để chọn phòng cần đăng/gửi khách.
      </p>
      <Link
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
        href="/broker/rooms"
      >
        Mở kho phòng
        <ArrowRight className="ml-2 size-4" aria-hidden />
      </Link>
    </section>
  );
}
