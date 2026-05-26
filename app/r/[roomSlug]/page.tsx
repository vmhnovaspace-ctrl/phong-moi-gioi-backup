import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomShareView } from "@/components/share/share-pages";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";
import { getRoomSharePageData } from "@/lib/share/queries";

type RoomSharePageProps = {
  params: Promise<{ roomSlug: string }>;
};

export async function generateMetadata({ params }: RoomSharePageProps): Promise<Metadata> {
  const { roomSlug } = await params;
  const data = await getRoomSharePageData(roomSlug);

  if (!data || data.unavailable) {
    return {
      title: "Phòng không còn khả dụng"
    };
  }

  const name = data.room.title || `Phòng ${data.room.room_code}`;
  const location = [data.building.ward, data.building.district].filter(Boolean).join(", ");
  const area = data.room.area_m2 ? formatArea(data.room.area_m2) : "";

  return {
    description: [area, location].filter(Boolean).join(" · "),
    title: `${name} - ${formatCurrencyVnd(data.room.rent_price)}`
  };
}

export default async function RoomSharePage({ params }: RoomSharePageProps) {
  const { roomSlug } = await params;
  const data = await getRoomSharePageData(roomSlug);

  if (!data) {
    notFound();
  }

  return <RoomShareView data={data} />;
}
