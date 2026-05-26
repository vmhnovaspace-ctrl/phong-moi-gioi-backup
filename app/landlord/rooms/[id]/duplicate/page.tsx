import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DuplicateRoomForm } from "@/components/landlord/duplicate-room-form";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordRoom } from "@/lib/landlord/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DuplicateRoomPage({ params }: PageProps) {
  const [{ id }, profile] = await Promise.all([params, requireRole(["landlord"])]);
  const room = await getLandlordRoom(id, profile.id);

  if (!room) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link
        className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        href={`/landlord/rooms/${room.id}`}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quay lại phòng
      </Link>
      <DuplicateRoomForm room={room} />
    </div>
  );
}
