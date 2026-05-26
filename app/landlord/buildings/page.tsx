import Link from "next/link";
import { Plus } from "lucide-react";
import { BuildingCard } from "@/components/landlord/building-card";
import { EmptyState } from "@/components/landlord/empty-state";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuildingSummaries } from "@/lib/landlord/queries";

export default async function LandlordBuildingsPage() {
  const profile = await requireRole(["landlord"]);
  const buildings = await getLandlordBuildingSummaries(profile.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Danh sách căn nhà</h2>
          <p className="mt-1 text-sm text-slate-600">
            Chỉ hiển thị các căn nhà thuộc chủ nhà đang đăng nhập.
          </p>
        </div>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          href="/landlord/buildings/new"
        >
          <Plus className="size-4" aria-hidden />
          Thêm căn nhà
        </Link>
      </div>

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
    </div>
  );
}
