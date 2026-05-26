import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SellListView } from "@/components/landlord/sell-list-view";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordSellList } from "@/lib/landlord/queries";

export default async function LandlordSellListPage() {
  const profile = await requireRole(["landlord"]);
  const groups = await getLandlordSellList(profile.id);

  return (
    <div className="space-y-5">
      <Link className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" href="/landlord">
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại tổng quan
      </Link>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Danh sách phòng sell</h2>
        <p className="mt-1 text-sm text-slate-600">
          Mặc định chỉ gồm phòng đang trống và sắp trống.
        </p>
      </div>
      <SellListView groups={groups} />
    </div>
  );
}
