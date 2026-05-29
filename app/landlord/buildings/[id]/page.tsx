import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Send } from "lucide-react";
import { BuildingFeesForm } from "@/components/landlord/building-fees-form";
import { BuildingZaloGroupPanel } from "@/components/landlord/building-zalo-group-panel";
import { EmptyState } from "@/components/landlord/empty-state";
import { RoomQuickList } from "@/components/landlord/room-quick-list";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuildingDetail } from "@/lib/landlord/queries";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duplicated?: string }>;
};

export default async function BuildingDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query, profile] = await Promise.all([
    params,
    searchParams,
    requireRole(["landlord"])
  ]);
  const building = await getLandlordBuildingDetail(id, profile.id);

  if (!building) {
    notFound();
  }

  const location = [building.ward, building.district, building.city].filter(Boolean).join(", ");
  const duplicatedCodes = query.duplicated?.split(",").filter(Boolean) ?? [];

  return (
    <div className="space-y-5">
      {duplicatedCodes.length > 0 ? (
        <div className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] p-4 text-sm font-medium text-[#047857]">
          Đã tạo {duplicatedCodes.length} phòng: {duplicatedCodes.join(", ")}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href="/landlord/buildings"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href={`/landlord/buildings/${building.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa căn nhà
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
          href={`/landlord/buildings/${building.id}/rooms/new`}
        >
          <Plus className="size-4" aria-hidden />
          Thêm phòng
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-blue-300 bg-[#EFF6FF] px-3 text-sm font-semibold text-[#0B3B82] hover:bg-[#EFF6FF]"
          href={`/landlord/buildings/${building.id}/sell-list`}
        >
          <Send className="size-4" aria-hidden />
          Sell phòng
        </Link>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">{building.name}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {building.address}
          {location ? `, ${location}` : ""}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Tổng phòng" value={building.total_rooms} />
          <Stat label="Đang trống" value={building.available_rooms} />
          <Stat label="Sắp trống" value={building.coming_soon_rooms} />
          <Stat label="Đã thuê" value={building.rented_rooms} />
        </div>
        <Info title="Mô tả" value={building.description} />
        <Info title="Tiện ích chung" value={building.common_amenities} />
        <Info title="Quy định" value={building.house_rules} />
      </section>

      <BuildingZaloGroupPanel
        buildingId={building.id}
        groupName={building.zalo_group_name}
        groupUrl={building.zalo_group_url}
        landlordGroupName={profile.landlord_zalo_group_name}
        landlordGroupUrl={profile.landlord_zalo_group_url}
      />

      <section>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Danh sách phòng</h2>
            <p className="text-sm text-slate-600">
              Sắp xếp theo tầng và mã phòng. Có thể đổi nhanh trạng thái, giá, cọc và ngày trống.
            </p>
            <p className="mt-2 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm font-medium text-[#0B3B82]">
              Phòng ‘Đang trống’ hoặc ‘Sắp trống’ sẽ tự xuất hiện trong danh sách Sell phòng cho môi giới.
            </p>
          </div>
        </div>
        {building.rooms.length > 0 ? (
          <RoomQuickList rooms={building.rooms} />
        ) : (
          <EmptyState
            actionHref={`/landlord/buildings/${building.id}/rooms/new`}
            actionLabel="Thêm phòng đầu tiên"
            description="Phòng luôn thuộc một căn nhà cụ thể để tránh nhầm địa chỉ."
            title="Căn này chưa có phòng"
          />
        )}
      </section>

      <BuildingFeesForm buildingId={building.id} fees={building.building_fees} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
