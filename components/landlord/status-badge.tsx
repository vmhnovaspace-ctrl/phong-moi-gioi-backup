import clsx from "clsx";
import { roomStatusLabels } from "@/lib/landlord/format";
import type { RoomStatus } from "@/lib/landlord/types";

const statusClasses: Record<RoomStatus, string> = {
  available: "border-green-200 bg-green-50 text-green-700",
  coming_soon: "border-blue-200 bg-blue-50 text-blue-700",
  reserved: "border-amber-200 bg-amber-50 text-amber-700",
  rented: "border-slate-200 bg-slate-100 text-slate-600",
  hidden: "border-slate-300 bg-slate-800 text-white"
};

export function StatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusClasses[status]
      )}
    >
      {roomStatusLabels[status]}
    </span>
  );
}
