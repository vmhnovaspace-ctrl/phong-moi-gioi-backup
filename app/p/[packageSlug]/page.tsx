import { notFound } from "next/navigation";
import { ExternalLink, ImageIcon, ShieldCheck, Users } from "lucide-react";
import { InterestCopyButton } from "@/components/public/interest-copy-button";
import { getPublicCustomerRoomPackage } from "@/lib/broker/queries";
import { sanitizeAddressForTenant } from "@/lib/broker/post-templates";
import type { PublicPackageRoom } from "@/lib/broker/types";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";
import {
  getEffectiveRoomLayoutValues,
  getRoomAmenityLabels
} from "@/lib/rooms/room-metadata";

type PublicPackagePageProps = {
  params: Promise<{ packageSlug: string }>;
};

export default async function PublicPackagePage({ params }: PublicPackagePageProps) {
  const { packageSlug } = await params;
  const data = await getPublicCustomerRoomPackage(packageSlug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 pb-6 pt-8 sm:pt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#0B3B82]">
            <ShieldCheck className="size-3.5" aria-hidden />
            Link phòng đã lọc sẵn
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-normal text-slate-950 sm:text-4xl">
            {data.customer_name
              ? `Phòng phù hợp cho Anh/Chị ${data.customer_name}`
              : "Danh sách phòng phù hợp cho bạn"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Môi giới đã chọn sẵn một số phòng theo nhu cầu của bạn. Xem ảnh, giá, dạng phòng và tiện ích trước khi hẹn lịch đi xem thực tế.
          </p>
          {data.customer_need ? (
            <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Nhu cầu</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{data.customer_need}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-6">
        {data.rooms.map((room, index) => (
          <PublicRoomCard
            index={index + 1}
            key={room.id}
            packageSlug={data.public_slug}
            room={room}
          />
        ))}
      </section>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-2">
        <p className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-sm leading-6 text-[#64748B]">
          Thông tin phòng có thể thay đổi theo tình trạng thực tế. Vui lòng liên hệ môi giới để xác nhận trước khi đi xem phòng.
        </p>
      </footer>
    </main>
  );
}

function PublicRoomCard({
  index,
  packageSlug,
  room
}: {
  index: number;
  packageSlug: string;
  room: PublicPackageRoom;
}) {
  const images = getDisplayImages(room);
  const primaryImage = images[0];
  const driveUrl = room.room_drive_folder_url || room.building_drive_folder_url;
  const roomLayouts = getEffectiveRoomLayoutValues(room.room_layouts, room.features).slice(0, 4);
  const amenities = getRoomAmenityLabels(room.features).slice(0, 5);
  const safeLocation = sanitizeAddressForTenant(room.location);
  const interestText = [
    `Em quan tâm phòng số ${index} trong danh sách.`,
    safeLocation ? `Khu vực: ${safeLocation}` : null,
    `Giá: ${formatCurrencyVnd(room.rent_price)}/tháng`
  ].filter(Boolean).join("\n");

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative bg-slate-100">
        {primaryImage ? (
          <img
            alt={room.title || `Phòng phù hợp ${index}`}
            className="aspect-[4/3] w-full object-cover sm:aspect-[16/8]"
            src={primaryImage}
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400 sm:aspect-[16/8]">
            <ImageIcon className="size-10" aria-hidden />
            <span className="text-sm font-semibold">Chưa có ảnh</span>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-900 shadow-sm">
          Phòng {index}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
          {images.slice(0, 6).map((image, imageIndex) => (
            <img
              alt={`Ảnh phòng ${index}.${imageIndex + 1}`}
              className="size-20 shrink-0 rounded-md object-cover"
              key={`${image}-${imageIndex}`}
              src={image}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-950">
            {room.title || "Phòng phù hợp nhu cầu"}
          </h2>
          {safeLocation ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{safeLocation}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoBox label="Giá thuê" value={`${formatCurrencyVnd(room.rent_price)}/tháng`} />
            {room.deposit_amount ? <InfoBox label="Cọc" value={formatCurrencyVnd(room.deposit_amount)} /> : null}
            {room.area_m2 ? <InfoBox label="Diện tích" value={formatArea(room.area_m2)} /> : null}
            {room.max_people ? <InfoBox label="Phù hợp" value={`${room.max_people} người`} /> : null}
          </div>

          {roomLayouts.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dạng phòng</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roomLayouts.map((layout) => (
                  <span
                    className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#0B3B82]"
                    key={layout}
                  >
                    {layout}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {amenities.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tiện ích</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((feature) => (
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                    key={feature}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {room.strengths || room.description ? (
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
              {room.strengths || room.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <InterestCopyButton packageSlug={packageSlug} roomId={room.id} text={interestText} />
          {driveUrl ? (
            <a
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#BFDBFE] bg-white px-4 text-sm font-bold text-[#0F5FD7] hover:bg-[#EFF6FF]"
              href={driveUrl}
              rel="noreferrer"
              target="_blank"
            >
              Xem album ảnh
              <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : null}
          <p className="flex items-start gap-2 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-500">
            <Users className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
            Liên hệ môi giới để xem phòng thực tế và xác nhận thông tin mới nhất.
          </p>
        </div>
      </div>
    </article>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function getDisplayImages(room: PublicPackageRoom) {
  const images = [
    room.cover_image_url,
    ...room.images
      .slice()
      .sort((a, b) => {
        if (a.is_cover !== b.is_cover) {
          return a.is_cover ? -1 : 1;
        }

        return a.sort_order - b.sort_order;
      })
      .map((image) => image.image_url)
  ].filter((image): image is string => Boolean(image));
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image)) {
      return false;
    }

    seen.add(image);
    return true;
  });
}
