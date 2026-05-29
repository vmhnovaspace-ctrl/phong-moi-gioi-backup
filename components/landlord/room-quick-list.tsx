"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Copy, Eye, Pencil } from "lucide-react";
import { quickUpdateRoomAction } from "@/app/landlord/actions";
import { roomStatusLabels, roomStatusOptions } from "@/lib/landlord/format";
import type { RoomListItem, RoomStatus } from "@/lib/landlord/types";

const fieldClass =
  "h-8 rounded-md border border-[#CBD5E1] bg-white px-2.5 text-sm text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] hover:border-[#94A3B8] focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]";

const statusDotClasses: Record<RoomStatus, string> = {
  available: "bg-[#047857]",
  coming_soon: "bg-[#1D4ED8]",
  reserved: "bg-[#B45309]",
  rented: "bg-[#475569]",
  hidden: "bg-[#64748B]"
};

export function RoomQuickList({ rooms }: { rooms: RoomListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
      <table className="min-w-[900px] w-full table-fixed text-left text-sm">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="w-[160px] px-4 py-2.5 font-semibold">Phòng</th>
            <th className="w-[190px] px-3 py-2.5 font-semibold">Tình trạng</th>
            <th className="w-[140px] px-3 py-2.5 font-semibold">Giá phòng</th>
            <th className="w-[140px] px-3 py-2.5 font-semibold">Tiền cọc</th>
            <th className="w-[150px] px-3 py-2.5 font-semibold">Ngày trống</th>
            <th className="w-[190px] px-4 py-2.5 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {rooms.map((room) => (
            <QuickRoomRow key={room.id} room={room} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickRoomRow({ room }: { room: RoomListItem }) {
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus>(room.status);
  const formId = `quick-room-${room.id}`;

  return (
    <tr className="h-[76px] align-middle transition hover:bg-[#F8FAFC]">
      <td className="px-4 py-2">
        <p className="text-sm font-semibold leading-5 text-slate-950">{room.room_code}</p>
        <p className="mt-0.5 text-xs leading-4 text-slate-500">
          {room.floor ? `Tầng ${room.floor}` : "Chưa nhập tầng"}
          {room.area_m2 ? ` • ${formatCompactArea(room.area_m2)}` : ""}
        </p>
        {room.min_lease_months ? (
          <p className="mt-0.5 text-xs leading-4 text-slate-400">
            Tối thiểu {room.min_lease_months} tháng
          </p>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <div className="flex w-[160px] items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-2">
          <span
            aria-label={roomStatusLabels[selectedStatus]}
            className={clsx("size-2.5 shrink-0 rounded-full", statusDotClasses[selectedStatus])}
          />
          <select
            className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
            form={formId}
            name="status"
            onChange={(event) => setSelectedStatus(event.target.value as RoomStatus)}
            value={selectedStatus}
          >
            {roomStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          className={clsx(fieldClass, "w-[118px] text-right tabular-nums")}
          defaultValue={formatNumberInput(room.rent_price)}
          form={formId}
          inputMode="numeric"
          name="rent_price"
          type="text"
        />
      </td>
      <td className="px-3 py-2">
        <input
          className={clsx(fieldClass, "w-[118px] text-right tabular-nums")}
          defaultValue={formatNumberInput(room.deposit_amount)}
          form={formId}
          inputMode="numeric"
          name="deposit_amount"
          type="text"
        />
      </td>
      <td className="px-3 py-2">
        {selectedStatus === "coming_soon" ? (
          <input
            className={clsx(fieldClass, "w-[132px]")}
            defaultValue={room.available_from ?? ""}
            form={formId}
            name="available_from"
            type="date"
          />
        ) : (
          <span className="text-xs font-medium text-slate-400">Không áp dụng</span>
        )}
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <form action={quickUpdateRoomAction} id={formId}>
            <input name="room_id" type="hidden" value={room.id} />
            <button
              className="inline-flex h-8 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#0B4FB5]"
              type="submit"
            >
              Lưu
            </button>
          </form>
          <IconActionLink
            href={`/landlord/rooms/${room.id}`}
            icon={<Eye className="size-4" aria-hidden />}
            label="Xem chi tiết"
          />
          <IconActionLink
            href={`/landlord/rooms/${room.id}/edit`}
            icon={<Pencil className="size-4" aria-hidden />}
            label="Sửa phòng"
          />
          <IconActionLink
            href={`/landlord/rooms/${room.id}/duplicate`}
            icon={<Copy className="size-4" aria-hidden />}
            label="Sao chép phòng"
          />
        </div>
      </td>
    </tr>
  );
}

function IconActionLink({
  href,
  icon,
  label
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-md border border-[#D8E2F0] bg-white text-[#334155] transition hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#0F5FD7]"
      href={href}
      title={label}
    >
      {icon}
    </Link>
  );
}

function formatNumberInput(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return value.toLocaleString("vi-VN");
}

function formatCompactArea(value: number | string) {
  return `${Number(value).toLocaleString("vi-VN")}m²`;
}
