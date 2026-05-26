import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SellListView } from "@/components/landlord/sell-list-view";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordBuilding, getLandlordSellList } from "@/lib/landlord/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuildingSellListPage({ params }: PageProps) {
  const [{ id }, profile] = await Promise.all([params, requireRole(["landlord"])]);
  const building = await getLandlordBuilding(id, profile.id);

  if (!building) {
    notFound();
  }

  const groups = await getLandlordSellList(profile.id, id);

  return (
    <div className="space-y-5">
      <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" href={`/landlord/buildings/${id}`}>
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại căn nhà
      </Link>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Phòng sell của {building.name}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ gồm phòng đang trống và sắp trống trong căn này.
        </p>
      </div>
      <SellListView groups={groups} />
    </div>
  );
}
