import Link from "next/link";
import {
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  VisibilityBadge,
  formatDateTime
} from "@/components/admin/admin-ui";
import { AdminActionSubmit } from "@/components/admin/admin-action-submit";
import { updateBuildingVisibilityFormAction } from "@/app/admin/actions";
import { adminVisibilityLabels } from "@/lib/admin/labels";
import { getAdminBuildings, parseAdminBuildingFilters } from "@/lib/admin/queries";
import type { AdminBuildingRow } from "@/lib/admin/types";

type AdminBuildingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBuildingsPage({ searchParams }: AdminBuildingsPageProps) {
  const params = await searchParams;
  const filters = parseAdminBuildingFilters(params);
  const data = await getAdminBuildings(filters);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        description="Kiểm tra toàn bộ căn nhà theo chủ nhà, khu vực, visibility và số phòng đang sell."
        title="Quản lý căn nhà"
      />
      <AdminNotice error={params.error} message={params.message} />
      <BuildingFilters districts={data.districts} filters={filters} />

      {data.buildings.length === 0 ? (
        <AdminEmptyState
          description="Không có căn nhà nào khớp bộ lọc hiện tại."
          title="Chưa có căn nhà để hiển thị"
        />
      ) : (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            Đang hiển thị {data.buildings.length.toLocaleString("vi-VN")} / {data.count.toLocaleString("vi-VN")} căn gần nhất.
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Căn nhà</th>
                  <th className="px-4 py-3">Chủ nhà</th>
                  <th className="px-4 py-3">Khu vực</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Phòng</th>
                  <th className="px-4 py-3">Cập nhật</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.buildings.map((building) => (
                  <BuildingTableRow building={building} key={building.id} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-0 divide-y divide-slate-100 xl:hidden">
            {data.buildings.map((building) => (
              <BuildingCard building={building} key={building.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BuildingFilters({
  districts,
  filters
}: {
  districts: string[];
  filters: ReturnType<typeof parseAdminBuildingFilters>;
}) {
  return (
    <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_180px_180px_auto]" action="/admin/buildings">
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.q ?? ""}
          name="q"
          placeholder="Tên căn, địa chỉ, chủ nhà"
        />
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
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chủ nhà</span>
        <input
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={filters.landlord ?? ""}
          name="landlord"
          placeholder="Tên/SĐT"
        />
      </label>
      <div className="flex items-end gap-2">
        <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800" type="submit">
          Lọc
        </button>
        <a className="inline-flex h-11 items-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" href="/admin/buildings">
          Xóa
        </a>
      </div>
    </form>
  );
}

function BuildingTableRow({ building }: { building: AdminBuildingRow }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <BuildingName building={building} />
      </td>
      <td className="px-4 py-4 text-slate-700">
        <p className="font-medium text-slate-900">{building.landlord?.full_name ?? "Không rõ chủ nhà"}</p>
        <p className="mt-1 text-xs text-slate-500">{building.landlord?.phone ?? building.landlord?.email ?? "Thiếu liên hệ"}</p>
      </td>
      <td className="px-4 py-4 text-slate-700">{locationText(building)}</td>
      <td className="px-4 py-4"><VisibilityBadge visibility={building.visibility} /></td>
      <td className="px-4 py-4 text-slate-700">
        <p>{building.total_rooms} phòng</p>
        <p className="mt-1 text-xs text-slate-500">
          {building.available_rooms} trống · {building.coming_soon_rooms} sắp trống
        </p>
      </td>
      <td className="px-4 py-4 text-slate-600">{formatDateTime(building.updated_at)}</td>
      <td className="px-4 py-4"><BuildingActions building={building} /></td>
    </tr>
  );
}

function BuildingCard({ building }: { building: AdminBuildingRow }) {
  return (
    <article className="space-y-3 p-4">
      <BuildingName building={building} />
      <div className="flex flex-wrap gap-2">
        <VisibilityBadge visibility={building.visibility} />
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {building.total_rooms} phòng
        </span>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="Chủ nhà" value={building.landlord?.full_name ?? "Không rõ"} />
        <Info label="Liên hệ" value={building.landlord?.phone ?? building.landlord?.email ?? "Thiếu liên hệ"} />
        <Info label="Khu vực" value={locationText(building)} />
        <Info label="Phòng sell" value={`${building.available_rooms} trống · ${building.coming_soon_rooms} sắp trống`} />
        <Info label="Cập nhật" value={formatDateTime(building.updated_at)} />
      </dl>
      <BuildingActions building={building} />
    </article>
  );
}

function BuildingName({ building }: { building: AdminBuildingRow }) {
  return (
    <div>
      <p className="font-semibold text-slate-950">{building.name}</p>
      <p className="mt-1 max-w-md text-sm leading-5 text-slate-600">{building.address}</p>
    </div>
  );
}

function BuildingActions({ building }: { building: AdminBuildingRow }) {
  const nextVisibility = building.visibility === "visible" ? "hidden" : "visible";

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        href={`/b/${building.public_slug}`}
      >
        Xem share
      </Link>
      <Link
        className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        href={`/admin/rooms?q=${encodeURIComponent(building.name)}`}
      >
        Xem phòng
      </Link>
      <form action={updateBuildingVisibilityFormAction}>
        <input name="building_id" type="hidden" value={building.id} />
        <input name="visibility" type="hidden" value={nextVisibility} />
        <AdminActionSubmit pendingText="Đang cập nhật..." variant={nextVisibility === "hidden" ? "danger" : "primary"}>
          {nextVisibility === "hidden" ? "Ẩn căn" : "Hiện căn"}
        </AdminActionSubmit>
      </form>
    </div>
  );
}

function locationText(building: AdminBuildingRow) {
  return [building.ward, building.district, building.city].filter(Boolean).join(", ") || "Chưa nhập khu vực";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-700">{value}</dd>
    </div>
  );
}
