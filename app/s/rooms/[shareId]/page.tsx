import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getShareRoomsData, getShareRoomsDescription, getShareSiteUrl } from "@/lib/share/rooms-share";
import { ShareRoomsRedirect } from "./share-rooms-redirect";

const SHARE_TITLE = "Xem thông tin chi tiết phòng trống";

type ShareRoomsPageProps = {
  params: Promise<{ shareId: string }>;
};

export async function generateMetadata({ params }: ShareRoomsPageProps): Promise<Metadata> {
  const { shareId } = await params;
  const data = await getShareRoomsData(shareId);
  const siteUrl = getShareSiteUrl();
  const sharePath = `/s/rooms/${encodeURIComponent(shareId)}`;
  const ogImagePath = `${sharePath}/opengraph-image`;
  const description = getShareRoomsDescription(data);

  return {
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: sharePath,
    },
    title: SHARE_TITLE,
    description,
    openGraph: {
      type: "website",
      url: sharePath,
      title: SHARE_TITLE,
      description,
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: SHARE_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SHARE_TITLE,
      description,
      images: [ogImagePath],
    },
  };
}

export default async function ShareRoomsPage({ params }: ShareRoomsPageProps) {
  const { shareId } = await params;
  const data = await getShareRoomsData(shareId);

  if (!data) {
    notFound();
  }

  const siteUrl = getShareSiteUrl();
  const brokerUrl = `${siteUrl}${data.brokerPath}`;
  const location = data.primaryBuilding
    ? [data.primaryBuilding.name, data.primaryBuilding.district].filter(Boolean).join(" · ")
    : "Kho Phòng Realtime";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-xl rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#0F5FD7]">
          Danh sách phòng
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight">{SHARE_TITLE}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Phòng trống mới cập nhật từ {location}. Đang chuyển tới trang kho phòng môi giới.
        </p>
        <div className="mt-5">
          <ShareRoomsRedirect brokerPath={data.brokerPath} brokerUrl={brokerUrl} />
        </div>
      </section>
    </main>
  );
}
