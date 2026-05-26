import { Building2, CheckCircle2, Clock3, UserRound } from "lucide-react";
import { BrokerFilterBar } from "@/components/broker/broker-filter-bar";
import { BrokerRoomCard } from "@/components/broker/broker-room-card";
import type { BrokerInventoryResult } from "@/lib/broker/types";

type BrokerInventoryViewProps = {
  inventory: BrokerInventoryResult;
};

export function BrokerInventoryView({ inventory }: BrokerInventoryViewProps) {
  const { rooms, groups } = inventory;
  const availableRooms = rooms.filter((room) => room.status === "available").length;
  const comingSoonRooms = rooms.filter((room) => room.status === "coming_soon").length;
  const buildingCount = new Set(rooms.map((room) => room.building.id)).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Kho phòng broker</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Duyệt phòng theo cây Chủ nhà → Căn nhà → Phòng, chỉ gồm dữ liệu visible và broker có quyền xem.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
          <SmallMetric icon={<CheckCircle2 className="size-4" aria-hidden />} label="Đang trống" value={availableRooms} />
          <SmallMetric icon={<Clock3 className="size-4" aria-hidden />} label="Sắp trống" value={comingSoonRooms} />
          <SmallMetric icon={<Building2 className="size-4" aria-hidden />} label="Căn nhà" value={buildingCount} />
        </div>
      </div>

      <BrokerFilterBar
        filters={inventory.filters}
        options={inventory.options}
        resultCount={rooms.length}
        totalCount={inventory.totalBeforeFilters}
      />

      {groups.length > 0 ? (
        <section className="space-y-4">
          {groups.map((landlordGroup) => (
            <div
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              key={landlordGroup.landlord?.id ?? landlordGroup.buildings[0]?.building.landlord_id}
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                      <UserRound className="size-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-950">
                        {landlordGroup.landlord?.full_name ?? "Chủ nhà"}
                      </h3>
                      {landlordGroup.landlord?.phone ? (
                        <p className="mt-0.5 text-sm text-slate-500">{landlordGroup.landlord.phone}</p>
                      ) : null}
                    </div>
                  </div>
                  <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                    {landlordGroup.total_rooms} phòng sell
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-3 sm:p-4">
                {landlordGroup.buildings.map((buildingGroup) => (
                  <section
                    className="rounded-lg border border-slate-200 bg-white"
                    key={buildingGroup.building.id}
                  >
                    <div className="border-b border-slate-100 px-4 py-3">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-950">{buildingGroup.building.name}</h4>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {buildingGroup.building.address}
                            {buildingGroup.building.ward ? ` · ${buildingGroup.building.ward}` : ""}
                            {buildingGroup.building.district ? ` · ${buildingGroup.building.district}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                            {buildingGroup.available_rooms} đang trống
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                            {buildingGroup.coming_soon_rooms} sắp trống
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 p-3">
                      {buildingGroup.rooms.map((room) => (
                        <BrokerRoomCard key={room.id} room={room} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
          <Building2 className="mx-auto size-9 text-slate-300" aria-hidden />
          <h3 className="mt-3 text-base font-semibold text-slate-950">Không có phòng phù hợp</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Thử xóa bớt bộ lọc hoặc dùng từ khóa rộng hơn để xem các phòng broker có quyền truy cập.
          </p>
        </section>
      )}
    </div>
  );
}

function SmallMetric({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="text-slate-400">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
