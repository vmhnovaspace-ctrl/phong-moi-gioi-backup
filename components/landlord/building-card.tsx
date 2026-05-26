import Link from "next/link";
import { Building2, MapPin, Pencil, Rows3 } from "lucide-react";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import type { BuildingSummary } from "@/lib/landlord/types";

export function BuildingCard({ building }: { building: BuildingSummary }) {
  const location = [building.ward, building.district, building.city]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-teal-700">
            <Building2 className="size-4" aria-hidden />
            <h2 className="text-base font-semibold text-slate-950">{building.name}</h2>
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

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
          href={`/landlord/buildings/${building.id}`}
        >
          <Rows3 className="size-4" aria-hidden />
          Chi tiết
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href={`/landlord/buildings/${building.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa
        </Link>
        <CopyLinkButton className="w-full" label="Copy link" path={`/b/${building.public_slug}`} />
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
