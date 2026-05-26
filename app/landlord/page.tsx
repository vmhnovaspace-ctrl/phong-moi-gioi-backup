import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { BuildingCard } from "@/components/landlord/building-card";
import { EmptyState } from "@/components/landlord/empty-state";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordDashboard } from "@/lib/landlord/queries";

export default async function LandlordPage() {
  const profile = await requireRole(["landlord"]);
  const dashboard = await getLandlordDashboard(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Tổng quan kho phòng</h2>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý căn nhà và phòng thuộc tài khoản chủ nhà hiện tại.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <CopyLinkButton label="Copy link kho" path={`/l/${profile.public_slug}`} />
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
            href="/landlord/buildings/new"
          >
            <Plus className="size-4" aria-hidden />
            Thêm căn nhà
          </Link>
          <Link
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            href="/landlord/sell-list"
          >
            <Send className="size-4" aria-hidden />
            Danh sách phòng sell
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Tổng căn nhà" value={dashboard.total_buildings} />
        <Metric label="Tổng phòng" value={dashboard.total_rooms} />
        <Metric label="Đang trống" value={dashboard.available_rooms} />
        <Metric label="Sắp trống" value={dashboard.coming_soon_rooms} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Căn nhà của bạn</h2>
          <Link
            className="text-sm font-semibold text-teal-700 hover:text-teal-900"
            href="/landlord/buildings"
          >
            Xem tất cả
          </Link>
        </div>
        {dashboard.buildings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.buildings.slice(0, 4).map((building) => (
              <BuildingCard building={building} key={building.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            actionHref="/landlord/buildings/new"
            actionLabel="Tạo căn nhà đầu tiên"
            description="Sau khi có căn nhà, bạn có thể tạo từng phòng bên trong đúng địa chỉ đó."
            title="Chưa có căn nhà"
          />
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
