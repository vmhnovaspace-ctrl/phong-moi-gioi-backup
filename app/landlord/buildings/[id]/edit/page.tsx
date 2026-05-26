import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BuildingForm } from "@/components/landlord/building-form";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuilding } from "@/lib/landlord/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBuildingPage({ params }: PageProps) {
  const [{ id }, profile] = await Promise.all([params, requireRole(["landlord"])]);
  const building = await getLandlordBuilding(id, profile.id);

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
        Quay lại chi tiết
      </Link>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Sửa căn nhà</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ chủ nhà sở hữu căn này mới sửa được dữ liệu.
        </p>
      </div>
      <BuildingForm building={building} />
    </div>
  );
}
