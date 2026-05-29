import clsx from "clsx";
import { roomStatusLabels } from "@/lib/landlord/format";
import type { RoomStatus } from "@/lib/landlord/types";

const statusClasses: Record<RoomStatus, string> = {
  available: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  coming_soon: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  reserved: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  rented: "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]",
  hidden: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]"
};

export function StatusBadge({ className, status }: { className?: string; status: RoomStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
        statusClasses[status],
        className
      )}
    >
      {roomStatusLabels[status]}
    </span>
  );
}
