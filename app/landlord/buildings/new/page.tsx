import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BuildingForm } from "@/components/landlord/building-form";

export default function NewBuildingPage() {
  return (
    <div className="space-y-4">
      <Link
        className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        href="/landlord/buildings"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại danh sách
      </Link>
      <div>
        <h2 className="text-xl font-bold text-slate-950">Thêm căn nhà</h2>
        <p className="mt-1 text-sm text-slate-600">
          Căn nhà mới sẽ tự gắn với tài khoản chủ nhà hiện tại và hiển thị mặc định.
        </p>
      </div>
      <BuildingForm />
    </div>
  );
}
