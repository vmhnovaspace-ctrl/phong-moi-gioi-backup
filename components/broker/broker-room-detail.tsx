import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Home,
  MapPin,
  Phone,
  Ruler,
  Users
} from "lucide-react";
import { BrokerRoomActionsPanel } from "@/components/broker/broker-room-actions-panel";
import { BrokerRoomNotePanel } from "@/components/broker/broker-room-note-panel";
import { BrokerRoomReportPanel } from "@/components/broker/broker-room-report-panel";
import { RoomPostGeneratorButton } from "@/components/broker/room-post-generator-button";
import { CopyRoomButton } from "@/components/landlord/copy-room-button";
import { StatusBadge } from "@/components/landlord/status-badge";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import type { BrokerRoomDetail as BrokerRoomDetailData } from "@/lib/broker/types";
import { getSiteUrl } from "@/lib/env";
import { feeRows, formatArea, formatCurrencyVnd, formatDate, roomStatusLabels } from "@/lib/landlord/format";
import { buildGoogleMapsUrl } from "@/lib/maps";
import {
  getEffectiveRoomLayoutValues,
  getRoomAmenityLabels
} from "@/lib/rooms/room-metadata";
import { buildRoomShareText } from "@/lib/share/templates";

type BrokerRoomDetailProps = {
  room: BrokerRoomDetailData;
};

export function BrokerRoomDetail({ room }: BrokerRoomDetailProps) {
  const roomLayouts = getEffectiveRoomLayoutValues(room.room_layouts, room.features);
  const activeFeatures = getRoomAmenityLabels(room.features);
  const fees = feeRows(room.effective_fees);
  const copyText = buildRoomShareText({ building: room.building, room }, getSiteUrl());
  const primaryImage = room.cover_image_url || room.images[0]?.image_url;
  const mapUrl = buildGoogleMapsUrl(room.building);
  const hasRoomText = Boolean(room.description || room.strengths || room.weaknesses);
  const hasBuildingInfo = Boolean(
    room.building.common_amenities || room.building.house_rules || room.building.description
  );
  const address = [room.building.address, room.building.ward, room.building.district, room.building.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          href="/broker/rooms"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Quay lại kho phòng
        </Link>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="bg-slate-100">
            {primaryImage ? (
              <img
                alt={room.title || `Phòng ${room.room_code}`}
                className="h-full min-h-72 w-full object-cover lg:min-h-[460px]"
                src={primaryImage}
              />
            ) : (
              <div className="flex min-h-72 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-400 lg:min-h-[460px]">
                Chưa có ảnh đại diện
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={room.status} />
                {room.commission ? (
                  <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0F5FD7]">
                    HH {room.commission}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">
                {room.title || `Phòng ${room.room_code}`}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                <Home className="size-4 shrink-0 text-slate-400" aria-hidden />
                <span>{room.building.name}</span>
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
                <span>{address}</span>
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
              {room.deposit_amount ? (
                <p className="mt-1 text-sm text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Detail label="Mã phòng" value={room.room_code} />
              <Detail label="Trạng thái" value={roomStatusLabels[room.status]} />
              {room.area_m2 ? (
                <Detail icon={<Ruler className="size-4" aria-hidden />} label="Diện tích" value={formatArea(room.area_m2)} />
              ) : null}
              {room.floor ? <Detail label="Tầng" value={room.floor} /> : null}
              {room.max_people ? (
                <Detail
                  icon={<Users className="size-4" aria-hidden />}
                  label="Số người tối đa"
                  value={`${room.max_people} người`}
                />
              ) : null}
              {room.available_from ? (
                <Detail
                  icon={<CalendarDays className="size-4" aria-hidden />}
                  label="Ngày có thể vào"
                  value={formatDate(room.available_from)}
                />
              ) : null}
              {room.min_lease_months ? <Detail label="Thuê tối thiểu" value={`${room.min_lease_months} tháng`} /> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {mapUrl ? <ExternalButton href={mapUrl} label="Mở Google Maps" /> : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {hasRoomText ? (
            <Section title="Thông tin phòng">
              <TextBlock label="Mô tả" value={room.description} />
              <TextBlock label="Điểm mạnh" value={room.strengths} />
              <TextBlock label="Điểm yếu" value={room.weaknesses} />
            </Section>
          ) : null}

          <Section title={`Phí ${room.fee_mode === "room_override" ? "riêng của phòng" : "chung căn nhà"}`}>
            {fees.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {fees.map((fee) => (
                  <PlainDetail key={fee.label} label={fee.label} value={fee.value} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa nhập phí.</p>
            )}
          </Section>

          <Section title="Dạng phòng">
            {roomLayouts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
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
              <p className="text-sm text-slate-500">Chưa chọn dạng phòng.</p>
            )}
          </Section>

          <Section title="Tiện ích phòng">
            {activeFeatures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
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
              <p className="text-sm text-slate-500">Chưa chọn tiện ích.</p>
            )}
          </Section>

          <Section title="Ảnh và album">
            {room.images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {room.images.map((image, index) => (
                  <a
                    className="group overflow-hidden rounded-md border border-slate-200 bg-slate-50"
                    href={image.image_url}
                    key={image.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={`Ảnh phòng ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                      src={image.image_url}
                    />
                    <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600">
                      <span>Ảnh {index + 1}</span>
                      <ExternalLink className="size-3.5" aria-hidden />
                    </div>
                  </a>
                ))}
              </div>
            ) : null}
            {room.images.length === 0 && !room.room_drive_folder_url && !room.building.building_drive_folder_url ? (
              <p className="text-sm text-slate-500">Chưa có ảnh/link ảnh.</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {room.room_drive_folder_url ? <ExternalButton href={room.room_drive_folder_url} label="Drive phòng" /> : null}
              {room.building.building_drive_folder_url ? (
                <ExternalButton href={room.building.building_drive_folder_url} label="Drive căn nhà" />
              ) : null}
            </div>
          </Section>

          <Section title="Thông tin căn nhà">
            {hasBuildingInfo ? (
              <div>
                <TextBlock label="Tiện ích chung" value={room.building.common_amenities} />
                <TextBlock label="Quy định chung" value={room.building.house_rules} />
                <TextBlock label="Mô tả căn nhà" value={room.building.description} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có thông tin.</p>
            )}
          </Section>

          <BrokerRoomNotePanel initialValue={room.action?.private_note ?? null} roomId={room.id} />
        </div>

        <aside className="space-y-5">
          <Section title="Công cụ nhanh">
            <div className="grid gap-2">
              <RoomPostGeneratorButton
                input={{
                  building: room.building,
                  features: room.features,
                  fees: room.effective_fees,
                  images: room.images,
                  room
                }}
                label="Tạo bài đăng"
                variant="primary"
              />
              <CopyRoomButton label="Copy tin phòng" text={copyText} />
              <CopyLinkButton label="Copy link phòng" path={`/r/${room.public_slug}`} />
            </div>
          </Section>
          <BrokerRoomActionsPanel action={room.action} roomId={room.id} />
          <BrokerRoomReportPanel roomId={room.id} />

          <Section title="Thông tin chủ nhà">
            {room.landlord ? (
              <div className="space-y-3">
                <PlainDetail label="Tên" value={room.landlord.full_name} />
                {room.landlord.phone ? (
                  <PlainDetail
                    label="Điện thoại"
                    value={
                      <a className="font-semibold text-[#0F5FD7] hover:text-[#0B3B82]" href={`tel:${room.landlord.phone}`}>
                        <Phone className="mr-1 inline size-3.5" aria-hidden />
                        {room.landlord.phone}
                      </a>
                    }
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Chưa có thông tin liên hệ phù hợp quyền truy cập.</p>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Detail({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function PlainDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="mb-3 last:mb-0">
      <h4 className="text-sm font-semibold text-slate-950">{label}</h4>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function ExternalButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}
