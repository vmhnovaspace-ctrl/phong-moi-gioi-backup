import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Clock3, DoorOpen, Plus } from "lucide-react";
import { BuildingCard } from "@/components/landlord/building-card";
import { EmptyState } from "@/components/landlord/empty-state";
import { LandlordCloseToast } from "@/components/landlord/landlord-close-toast";
import { LandlordZaloGroupForm } from "@/components/landlord/landlord-zalo-group-form";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuildingSummaries, getLandlordCloseToastItems } from "@/lib/landlord/queries";

export default async function LandlordPage() {
  const profile = await requireRole(["landlord"]);
  const [buildings, closeToasts] = await Promise.all([
    getLandlordBuildingSummaries(profile.id),
    getLandlordCloseToastItems(profile.id)
  ]);

  const totals = buildings.reduce(
    (acc, building) => {
      acc.totalRooms += building.total_rooms;
      acc.availableRooms += building.available_rooms;
      acc.comingSoonRooms += building.coming_soon_rooms;
      return acc;
    },
    {
      availableRooms: 0,
      comingSoonRooms: 0,
      totalRooms: 0
    }
  );

  return (
    <div className="space-y-5">
      <LandlordCloseToast items={closeToasts} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Bảng điều khiển chủ nhà</h2>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi nhanh số căn, số phòng và các phòng đang có thể sell.
          </p>
        </div>

        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0F5FD7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
          href="/landlord/buildings/new"
        >
          <Plus className="size-4" aria-hidden />
          Thêm căn nhà
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<Building2 className="size-4" aria-hidden />} label="Tổng căn" value={buildings.length} />
        <Metric icon={<DoorOpen className="size-4" aria-hidden />} label="Tổng phòng" value={totals.totalRooms} />
        <Metric
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          label="Đang trống"
          tone="green"
          value={totals.availableRooms}
        />
        <Metric
          icon={<Clock3 className="size-4" aria-hidden />}
          label="Sắp trống"
          tone="blue"
          value={totals.comingSoonRooms}
        />
      </section>

      {buildings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {buildings.map((building) => (
            <BuildingCard building={building} key={building.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          actionHref="/landlord/buildings/new"
          actionLabel="Thêm căn nhà"
          description="Mỗi căn nhà là một địa chỉ cụ thể. Tạo căn trước rồi thêm phòng bên trong."
          title="Chưa có căn nhà"
        />
      )}

      <LandlordZaloGroupForm
        groupName={profile.landlord_zalo_group_name}
        groupUrl={profile.landlord_zalo_group_url}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  tone = "slate",
  value
}: {
  icon: ReactNode;
  label: string;
  tone?: "blue" | "green" | "slate";
  value: number;
}) {
  const toneClasses = {
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    green: "bg-[#ECFDF5] text-[#047857]",
    slate: "bg-[#F8FAFC] text-[#64748B]"
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
        <span className={`flex size-8 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-950">{value.toLocaleString("vi-VN")}</p>
    </div>
  );
}
