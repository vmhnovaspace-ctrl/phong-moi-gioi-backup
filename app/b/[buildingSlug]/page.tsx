import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuildingShareView } from "@/components/share/share-pages";
import { getBuildingSharePageData } from "@/lib/share/queries";

type BuildingSharePageProps = {
  params: Promise<{ buildingSlug: string }>;
};

export async function generateMetadata({ params }: BuildingSharePageProps): Promise<Metadata> {
  const { buildingSlug } = await params;
  const data = await getBuildingSharePageData(buildingSlug);

  if (!data) {
    return {
      title: "Căn nhà không tồn tại"
    };
  }

  const location = [data.building.ward, data.building.district, data.building.city]
    .filter(Boolean)
    .join(", ");

  return {
    description: `${location ? `${location}. ` : ""}${data.building.rooms.length} phòng đang trống/sắp trống.`,
    title: `${data.building.name} - Phòng trống cập nhật`
  };
}

export default async function BuildingSharePage({ params }: BuildingSharePageProps) {
  const { buildingSlug } = await params;
  const data = await getBuildingSharePageData(buildingSlug);

  if (!data) {
    notFound();
  }

  return <BuildingShareView data={data} />;
}
