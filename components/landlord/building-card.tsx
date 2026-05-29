import Link from "next/link";
import { Building2, MapPin, Pencil, Rows3 } from "lucide-react";
import type { BuildingSummary } from "@/lib/landlord/types";

export function BuildingCard({ building }: { building: BuildingSummary }) {
  const location = [building.ward, building.district, building.city]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#0F5FD7]">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <Building2 className="size-4" aria-hidden />
            </span>
            <h2 className="text-base font-bold text-slate-950">{building.name}</h2>
          </div>
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden />
            <span>
              {building.address}
              {location ? `, ${location}` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Tổng phòng" value={building.total_rooms} />
        <Stat label="Đang trống" value={building.available_rooms} />
        <Stat label="Sắp trống" value={building.coming_soon_rooms} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F5FD7] px-3 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
          href={`/landlord/buildings/${building.id}`}
        >
          <Rows3 className="size-4" aria-hidden />
          Chi tiết
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-white px-3 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF]"
          href={`/landlord/buildings/${building.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa
        </Link>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
