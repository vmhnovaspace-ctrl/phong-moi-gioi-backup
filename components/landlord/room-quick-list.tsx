import Link from "next/link";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Copy, Eye, Pencil } from "lucide-react";
import { quickUpdateRoomAction } from "@/app/landlord/actions";
import { roomStatusLabels, roomStatusOptions } from "@/lib/landlord/format";
import type { RoomListItem, RoomStatus } from "@/lib/landlord/types";

const fieldClass =
  "h-8 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-700 focus:ring-2 focus:ring-teal-100";

const statusDotClasses: Record<RoomStatus, string> = {
  available: "bg-green-500",
  coming_soon: "bg-amber-500",
  reserved: "bg-violet-500",
  rented: "bg-slate-400",
  hidden: "bg-slate-500"
};

export function RoomQuickList({ rooms }: { rooms: RoomListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[900px] w-full table-fixed text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-[160px] px-4 py-2.5 font-semibold">Phòng</th>
            <th className="w-[190px] px-3 py-2.5 font-semibold">Tình trạng</th>
            <th className="w-[140px] px-3 py-2.5 font-semibold">Giá phòng</th>
            <th className="w-[140px] px-3 py-2.5 font-semibold">Tiền cọc</th>
            <th className="w-[150px] px-3 py-2.5 font-semibold">Ngày trống</th>
            <th className="w-[190px] px-4 py-2.5 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rooms.map((room) => {
            const formId = `quick-room-${room.id}`;

            return (
              <tr className="h-[76px] align-middle transition hover:bg-slate-50/70" key={room.id}>
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
                  <div className="flex w-[160px] items-center gap-2 rounded-md border border-slate-200 bg-white px-2">
                    <span
                      aria-label={roomStatusLabels[room.status]}
                      className={clsx("size-2.5 shrink-0 rounded-full", statusDotClasses[room.status])}
                    />
                    <select
                      className="h-8 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none"
                      defaultValue={room.status}
                      form={formId}
                      name="status"
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
                  <input
                    className={clsx(fieldClass, "w-[132px]")}
                    defaultValue={room.available_from ?? ""}
                    form={formId}
                    name="available_from"
                    type="date"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                    <form action={quickUpdateRoomAction} id={formId}>
                      <input name="room_id" type="hidden" value={room.id} />
                      <button
                        className="inline-flex h-8 items-center justify-center rounded-md bg-teal-700 px-3 text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
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
          })}
        </tbody>
      </table>
    </div>
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
      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
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
