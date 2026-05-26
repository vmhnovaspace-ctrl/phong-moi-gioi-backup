import Link from "next/link";
import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  RoomStatusBadge,
  VisibilityBadge,
  formatDateTime
} from "@/components/admin/admin-ui";
import { AdminActionSubmit } from "@/components/admin/admin-action-submit";
import { updateRoomVisibilityFormAction } from "@/app/admin/actions";
import { adminRoomStatusLabels, adminVisibilityLabels } from "@/lib/admin/labels";
import { getAdminRooms, parseAdminRoomFilters } from "@/lib/admin/queries";
import type { AdminRoomRow } from "@/lib/admin/types";
import { formatArea, formatCurrencyVnd, formatDate } from "@/lib/landlord/format";

type AdminRoomsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRoomsPage({ searchParams }: AdminRoomsPageProps) {
  const params = await searchParams;
  const filters = parseAdminRoomFilters(params);
  const data = await getAdminRooms(filters);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        description="Xem toàn bộ phòng theo căn nhà, chủ nhà, khu vực, giá thuê, trạng thái và visibility."
        title="Quản lý phòng"
      />
      <AdminNotice error={params.error} message={params.message} />
      <RoomFilters districts={data.districts} filters={filters} />

      {data.rooms.length === 0 ? (
        <AdminEmptyState
          description="Không có phòng nào khớp bộ lọc hiện tại."
          title="Chưa có phòng để hiển thị"
        />
      ) : (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            Đang hiển thị {data.rooms.length.toLocaleString("vi-VN")} / {data.count.toLocaleString("vi-VN")} phòng gần nhất.
          </div>
          <div className="hidden overflow-x-auto 2xl:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Phòng</th>
                  <th className="px-4 py-3">Căn nhà</th>
                  <th className="px-4 py-3">Chủ nhà</th>
                  <th className="px-4 py-3">Giá/Diện tích</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Ngày vào</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rooms.map((room) => (
                  <RoomTableRow key={room.id} room={room} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-0 divide-y divide-slate-100 2xl:hidden">
            {data.rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RoomFilters({
  districts,
  filters
}: {
  districts: string[];
  filters: ReturnType<typeof parseAdminRoomFilters>;
}) {
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1fr_160px_160px_160px_130px_130px_auto]" action="/admin/rooms">
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Mã phòng, căn, địa chỉ, chủ nhà"
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.status ?? "all"}
          name="status"
        >
          <option value="all">Tất cả</option>
          {(["available", "coming_soon", "reserved", "rented", "hidden"] as const).map((status) => (
            <option key={status} value={status}>
              {adminRoomStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visibility</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.visibility ?? "all"}
          name="visibility"
        >
          <option value="all">Tất cả</option>
          {(["visible", "hidden"] as const).map((visibility) => (
            <option key={visibility} value={visibility}>
              {adminVisibilityLabels[visibility]}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quận</span>
        <select
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.district ?? ""}
          name="district"
        >
          <option value="">Tất cả quận</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Giá từ</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.minPrice ?? ""}
          inputMode="numeric"
          name="minPrice"
          placeholder="0"
        />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Giá đến</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.maxPrice ?? ""}
          inputMode="numeric"
          name="maxPrice"
          placeholder="10000000"
        />
      </label>
      <div className="flex items-end gap-2">
        <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800" type="submit">
          Lọc
        </button>
        <a className="inline-flex h-11 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/admin/rooms">
          Xóa
        </a>
      </div>
    </form>
  );
}

function RoomTableRow({ room }: { room: AdminRoomRow }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4"><RoomName room={room} /></td>
      <td className="px-4 py-4 text-slate-700">
        <p className="font-medium text-slate-900">{room.building?.name ?? "Không rõ căn"}</p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">{room.building?.address ?? "Thiếu địa chỉ"}</p>
      </td>
      <td className="px-4 py-4 text-slate-700">{room.landlord?.full_name ?? "Không rõ"}</td>
      <td className="px-4 py-4 text-slate-700">
        <p className="font-semibold text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
        <p className="mt-1 text-xs text-slate-500">{formatArea(room.area_m2)}</p>
      </td>
      <td className="px-4 py-4"><RoomStatusBadge status={room.status} /></td>
      <td className="px-4 py-4"><VisibilityBadge visibility={room.visibility} /></td>
      <td className="px-4 py-4 text-slate-600">{formatDate(room.available_from)}</td>
      <td className="px-4 py-4 text-slate-600">{formatDateTime(room.updated_at)}</td>
      <td className="px-4 py-4"><RoomActions room={room} /></td>
    </tr>
  );
}

function RoomCard({ room }: { room: AdminRoomRow }) {
  return (
    <article className="space-y-3 p-4">
      <RoomName room={room} />
      <div className="flex flex-wrap gap-2">
        <RoomStatusBadge status={room.status} />
        <VisibilityBadge visibility={room.visibility} />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Căn nhà" value={room.building?.name ?? "Không rõ căn"} />
        <Info label="Địa chỉ" value={room.building?.address ?? "Thiếu địa chỉ"} />
        <Info label="Chủ nhà" value={room.landlord?.full_name ?? "Không rõ"} />
        <Info label="Khu vực" value={[room.building?.ward, room.building?.district].filter(Boolean).join(", ") || "Chưa nhập"} />
        <Info label="Giá thuê" value={formatCurrencyVnd(room.rent_price)} />
        <Info label="Diện tích" value={formatArea(room.area_m2)} />
        <Info label="Ngày vào" value={formatDate(room.available_from)} />
        <Info label="Cập nhật" value={formatDateTime(room.updated_at)} />
      </dl>
      <RoomActions room={room} />
    </article>
  );
}

function RoomName({ room }: { room: AdminRoomRow }) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{room.room_code}</p>
      <p className="mt-1 max-w-sm text-sm leading-5 text-slate-600">{room.title || "Chưa có tiêu đề"}</p>
    </div>
  );
}

function RoomActions({ room }: { room: AdminRoomRow }) {
  const nextVisibility = room.visibility === "visible" ? "hidden" : "visible";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        href={`/r/${room.public_slug}`}
      >
        Xem share
      </Link>
      {room.building ? (
        <Link
          className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={`/admin/buildings?q=${encodeURIComponent(room.building.name)}`}
        >
          Xem căn
        </Link>
      ) : null}
      <form action={updateRoomVisibilityFormAction}>
        <input name="room_id" type="hidden" value={room.id} />
        <input name="visibility" type="hidden" value={nextVisibility} />
        <AdminActionSubmit pendingText="Đang cập nhật..." variant={nextVisibility === "hidden" ? "danger" : "primary"}>
          {nextVisibility === "hidden" ? "Ẩn phòng" : "Hiện phòng"}
        </AdminActionSubmit>
      </form>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
