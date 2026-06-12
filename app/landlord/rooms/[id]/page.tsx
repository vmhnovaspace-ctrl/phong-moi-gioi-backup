import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Plus } from "lucide-react";
import { PriceDisplay } from "@/components/landlord/price-display";
import { StatusBadge } from "@/components/landlord/status-badge";
import { CopyTextButton } from "@/components/share/copy-text-button";
import { getSiteUrl } from "@/lib/env";
import { feeRows, formatArea, formatCurrencyVnd, formatDate } from "@/lib/landlord/format";
import { requireRole } from "@/lib/auth/profile";
import { getLandlordRoom } from "@/lib/landlord/queries";
import {
  getEffectiveRoomLayoutValues,
  getRoomAmenityLabels
} from "@/lib/rooms/room-metadata";
import { buildRoomShareText } from "@/lib/share/templates";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
};

export default async function RoomDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query, profile] = await Promise.all([
    params,
    searchParams,
    requireRole(["landlord"])
  ]);
  const room = await getLandlordRoom(id, profile.id);

  if (!room) {
    notFound();
  }

  const roomLayouts = getEffectiveRoomLayoutValues(room.room_layouts, room.features);
  const activeFeatures = getRoomAmenityLabels(room.features);
  const fees = feeRows(room.effective_fees);
  const shareText = buildRoomShareText({ building: room.building, room }, getSiteUrl());

  return (
    <div className="space-y-5">
      {(query.created || query.updated) ? (
        <div className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] p-4 text-sm text-[#047857]">
          {query.created ? "Đã tạo phòng thành công." : "Đã lưu phòng thành công."}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0F5FD7] px-3 font-semibold text-white" href={`/landlord/buildings/${room.building.id}/rooms/new`}>
              <Plus className="size-4" aria-hidden />
              Thêm phòng khác
            </Link>
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border border-[#A7F3D0] bg-white px-3 font-semibold text-[#047857] hover:bg-[#ECFDF5]" href={`/landlord/rooms/${room.id}/duplicate`}>
              <Copy className="size-4" aria-hidden />
              Sao chép phòng này
            </Link>
            <Link className="inline-flex h-10 items-center rounded-md border border-[#A7F3D0] bg-white px-3 font-semibold text-[#047857] hover:bg-[#ECFDF5]" href={`/landlord/buildings/${room.building.id}`}>
              Quay lại danh sách phòng
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <CopyTextButton label="Copy tin phòng" text={shareText} />
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href={`/landlord/buildings/${room.building.id}`}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại căn nhà
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
          href={`/landlord/rooms/${room.id}/edit`}
        >
          <Pencil className="size-4" aria-hidden />
          Sửa phòng
        </Link>
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href={`/landlord/rooms/${room.id}/duplicate`}
        >
          <Copy className="size-4" aria-hidden />
          Sao chép
        </Link>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {room.title || `Phòng ${room.room_code}`}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {room.building.name} · {room.building.address}
            </p>
          </div>
          <StatusBadge status={room.status} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Detail label="Giá thuê" value={<PriceDisplay value={room.rent_price} />} />
          <Detail label="Tiền cọc" value={formatCurrencyVnd(room.deposit_amount)} />
          <Detail label="Diện tích" value={formatArea(room.area_m2)} />
          <Detail label="Có thể vào" value={formatDate(room.available_from)} />
          <Detail label="Thuê tối thiểu" value={room.min_lease_months ? `${room.min_lease_months} tháng` : "Chưa nhập"} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextBlock title="Mô tả" value={room.description} />
          <TextBlock title="Điểm mạnh" value={room.strengths} />
          <TextBlock title="Điểm yếu" value={room.weaknesses} />
          <TextBlock title="Hoa hồng" value={room.commission} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">
          Phí {room.fee_mode === "room_override" ? "riêng của phòng" : "chung căn nhà"}
        </h2>
        {fees.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {fees.map((fee) => (
              <Detail key={fee.label} label={fee.label} value={fee.value} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa nhập phí.</p>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Ảnh phòng</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {room.room_drive_folder_url ? (
            <a className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" href={room.room_drive_folder_url} rel="noreferrer" target="_blank">
              Mở Drive phòng
            </a>
          ) : null}
          {room.images.map((image, index) => (
            <a className="inline-flex h-10 items-center rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50" href={image.image_url} key={image.id} rel="noreferrer" target="_blank">
              Ảnh {index + 1}
            </a>
          ))}
          {!room.room_drive_folder_url && room.images.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có ảnh/link ảnh.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Dạng phòng</h2>
            {roomLayouts.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {roomLayouts.map((layout) => (
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700"
                    key={layout}
                  >
                    {layout}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Chưa chọn dạng phòng.</p>
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">Tiện ích</h2>
            {activeFeatures.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFeatures.map((feature) => (
                  <span
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700"
                    key={feature}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Chưa chọn tiện ích.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-950">{value}</div>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}
