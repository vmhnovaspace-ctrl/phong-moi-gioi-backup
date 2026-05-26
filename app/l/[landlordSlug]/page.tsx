import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandlordShareView } from "@/components/share/share-pages";
import { getLandlordSharePageData } from "@/lib/share/queries";

type LandlordSharePageProps = {
  params: Promise<{ landlordSlug: string }>;
};

export async function generateMetadata({ params }: LandlordSharePageProps): Promise<Metadata> {
  const { landlordSlug } = await params;
  const data = await getLandlordSharePageData(landlordSlug);

  if (!data) {
    return {
      title: "Kho phòng không tồn tại"
    };
  }

  return {
    description: `${data.total_sellable_rooms} phòng đang trống/sắp trống tại ${data.visible_buildings} căn nhà visible.`,
    title: `Kho phòng của ${data.landlord.full_name}`
  };
}

export default async function LandlordSharePage({ params }: LandlordSharePageProps) {
  const { landlordSlug } = await params;
  const data = await getLandlordSharePageData(landlordSlug);

  if (!data) {
    notFound();
  }

  return <LandlordShareView data={data} />;
}
