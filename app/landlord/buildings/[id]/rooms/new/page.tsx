import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RoomForm } from "@/components/landlord/room-form";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuildingDetail } from "@/lib/landlord/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewRoomPage({ params }: PageProps) {
  const [{ id }, profile] = await Promise.all([params, requireRole(["landlord"])]);
  const building = await getLandlordBuildingDetail(id, profile.id);

  if (!building) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        href={`/landlord/buildings/${building.id}`}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại căn nhà
      </Link>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Thêm phòng</h2>
        <p className="mt-1 text-sm text-slate-600">
          Phòng mới sẽ nằm trong đúng căn nhà đã chọn.
        </p>
      </div>
      <RoomForm building={building} buildingFees={building.building_fees} />
    </div>
  );
}
