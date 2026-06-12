import Link from "next/link";
import { Building2, ExternalLink, Home, MapPin } from "lucide-react";
import { EmptyState } from "@/components/landlord/empty-state";
import { StatusBadge } from "@/components/landlord/status-badge";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { CopyTextButton } from "@/components/share/copy-text-button";
import { SafeImage } from "@/components/share/safe-image";
import { getSiteUrl } from "@/lib/env";
import {
  feeRows,
  formatArea,
  formatCurrencyVnd,
  formatDate,
  roomStatusLabels
} from "@/lib/landlord/format";
import {
  getEffectiveRoomLayoutValues,
  getRoomAmenityLabels
} from "@/lib/rooms/room-metadata";
import type {
  BuildingSharePageData,
  LandlordSharePageData,
  RoomSharePageData,
  ShareBuilding,
  ShareImage,
  ShareRoom
} from "@/lib/share/types";
import {
  buildBuildingShareText,
  buildLandlordShareText,
  buildRoomShareText
} from "@/lib/share/templates";

export function LandlordShareView({ data }: { data: LandlordSharePageData }) {
  const shareText = buildLandlordShareText(data, getSiteUrl());

  return (
    <ShareShell
      actions={
        <>
          <CopyTextButton label="Copy tin chủ nhà" text={shareText} />
          <CopyLinkButton label="Copy link chủ nhà" path={`/l/${data.landlord.public_slug}`} />
        </>
      }
      eyebrow="Kho chủ nhà"
      subtitle={`${data.visible_buildings} căn nhà visible · ${data.total_sellable_rooms} phòng đang sell`}
      title={`Kho phòng của ${data.landlord.full_name}`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Căn nhà" value={data.visible_buildings} />
        <Stat label="Phòng đang sell" value={data.total_sellable_rooms} />
        <Stat label="Đang trống" value={data.available_rooms} />
        <Stat label="Sắp trống" value={data.coming_soon_rooms} />
      </div>

      {data.buildings.length > 0 ? (
        <div className="grid gap-4">
          {data.buildings.map((building) => (
            <BuildingSection building={building} key={building.id} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Chủ nhà này hiện chưa có căn visible hoặc chưa có phòng đang trống/sắp trống phù hợp quyền truy cập của bạn."
          title="Chưa có phòng đang sell"
        />
      )}
    </ShareShell>
  );
}

export function BuildingShareView({ data }: { data: BuildingSharePageData }) {
  const building = data.building;
  const images = displayImages(building.cover_image_url, building.images);
  const shareText = buildBuildingShareText(building, getSiteUrl());

  return (
    <ShareShell
      actions={
        <>
          <CopyTextButton label="Copy tin căn" text={shareText} />
          <CopyLinkButton label="Copy link căn nhà" path={`/b/${building.public_slug}`} />
        </>
      }
      eyebrow="Căn nhà"
      subtitle={formatLocation(building)}
      title={building.name}
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SafeImage
          alt={building.name}
          className="aspect-[16/9] w-full object-cover"
          fallbackClassName="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400"
          src={images[0]}
        />
        <div className="p-4">
          <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden />
            <span>{formatFullAddress(building)}</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Phòng sell" value={building.rooms.length} />
            <Stat label="Đang trống" value={building.available_rooms} />
            <Stat label="Sắp trống" value={building.coming_soon_rooms} />
          </div>
          <TextBlock title="Mô tả" value={building.description} />
          <TextBlock title="Tiện ích chung" value={building.common_amenities} />
          <TextBlock title="Quy định chung" value={building.house_rules} />
          {building.building_drive_folder_url ? (
            <div className="mt-4">
              <DriveButton href={building.building_drive_folder_url} label="Mở album Google Drive căn nhà" />
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950">Phòng trống/sắp trống</h2>
          {data.landlord ? (
            <Link
              className="text-sm font-semibold text-teal-700 hover:text-teal-900"
              href={`/l/${data.landlord.public_slug}`}
            >
              Kho chủ nhà
            </Link>
          ) : null}
        </div>
        {building.rooms.length > 0 ? (
          <div className="grid gap-3">
            {building.rooms.map((room) => (
              <RoomSummaryCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="Căn này hiện không có phòng visible ở trạng thái đang trống hoặc sắp trống."
            title="Chưa có phòng đang sell"
          />
        )}
      </section>
    </ShareShell>
  );
}

export function RoomShareView({ data }: { data: RoomSharePageData }) {
  if (data.unavailable) {
    return (
      <ShareShell eyebrow="Link phòng" title="Phòng này hiện không còn khả dụng">
        <EmptyState
          description="Phòng có thể đã được thuê, bị ẩn, hoặc căn nhà không còn visible. Vui lòng kiểm tra lại kho phòng mới nhất."
          title="Không còn phòng đang sell"
        />
      </ShareShell>
    );
  }

  const { building, landlord, room } = data;
  const images = displayImages(room.cover_image_url, room.images);
  const roomLayouts = getEffectiveRoomLayoutValues(room.room_layouts, room.features);
  const amenities = getRoomAmenityLabels(room.features);
  const fees = feeRows(room.effective_fees);
  const shareText = buildRoomShareText({ building, room }, getSiteUrl());

  return (
    <ShareShell
      actions={
        <>
          <CopyTextButton label="Copy tin phòng" text={shareText} />
          <CopyLinkButton label="Copy link phòng" path={`/r/${room.public_slug}`} />
        </>
      }
      eyebrow="Chi tiết phòng"
      subtitle={formatFullAddress(building)}
      title={room.title || `Phòng ${room.room_code}`}
    >
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SafeImage
          alt={room.title || `Phòng ${room.room_code}`}
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/8]"
          src={images[0]}
        />
        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 p-3">
            {images.slice(1, 8).map((image, index) => (
              <SafeImage
                alt={`Ảnh phòng ${index + 2}`}
                className="size-20 shrink-0 rounded-md object-cover"
                fallbackClassName="flex size-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400"
                key={`${image}-${index}`}
                src={image}
              />
            ))}
          </div>
        ) : null}

        <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={room.status} />
              {room.commission ? <Chip label={`HH ${room.commission}`} /> : null}
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {formatCurrencyVnd(room.rent_price)}
            </p>
            {room.deposit_amount ? (
              <p className="mt-1 text-sm text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Info label="Mã phòng" value={room.room_code} />
              {room.floor ? <Info label="Tầng" value={room.floor} /> : null}
              {room.area_m2 ? <Info label="Diện tích" value={formatArea(room.area_m2)} /> : null}
              {room.max_people ? <Info label="Tối đa" value={`${room.max_people} người`} /> : null}
              <Info label="Trạng thái" value={roomStatusLabels[room.status]} />
              {room.available_from ? <Info label="Ngày vào" value={formatDate(room.available_from)} /> : null}
              {room.min_lease_months ? <Info label="Thuê tối thiểu" value={`${room.min_lease_months} tháng`} /> : null}
            </div>
          </div>

          <div className="space-y-2">
            <LinkButton href={`/b/${building.public_slug}`} label="Quay về căn nhà" />
            {landlord ? <LinkButton href={`/l/${landlord.public_slug}`} label="Quay về kho chủ nhà" /> : null}
            {room.room_drive_folder_url ? (
              <DriveButton href={room.room_drive_folder_url} label="Mở album Google Drive phòng" />
            ) : null}
            {building.building_drive_folder_url ? (
              <DriveButton href={building.building_drive_folder_url} label="Mở album Google Drive căn" />
            ) : null}
          </div>
        </div>
      </section>

      <Section title="Căn nhà">
        <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <Home className="mt-1 size-4 shrink-0 text-slate-400" aria-hidden />
          <span>
            <strong className="text-slate-900">{building.name}</strong>
            <br />
            {formatFullAddress(building)}
          </span>
        </p>
      </Section>

      <Section title="Thông tin phòng">
        <TextBlock title="Mô tả" value={room.description} />
        <TextBlock title="Điểm mạnh" value={room.strengths} />
        <TextBlock title="Điểm yếu" value={room.weaknesses} />
        {!room.description && !room.strengths && !room.weaknesses ? (
          <p className="text-sm text-slate-500">Chưa có mô tả chi tiết.</p>
        ) : null}
      </Section>

      <Section title={`Phí ${room.fee_mode === "room_override" ? "riêng của phòng" : "chung căn nhà"}`}>
        {fees.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {fees.map((fee) => (
              <Info key={fee.label} label={fee.label} value={fee.value} />
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
              <Chip key={layout} label={layout} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa chọn dạng phòng.</p>
        )}
      </Section>

      <Section title="Tiện ích phòng">
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {amenities.map((feature) => (
              <Chip key={feature} label={feature} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa chọn tiện ích.</p>
        )}
      </Section>
    </ShareShell>
  );
}

function BuildingSection({ building }: { building: ShareBuilding }) {
  const images = displayImages(building.cover_image_url, building.images);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
        <SafeImage
          alt={building.name}
          className="aspect-[4/3] h-full w-full object-cover"
          fallbackClassName="flex aspect-[4/3] h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400"
          src={images[0]}
        />
        <div className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
                <Building2 className="size-5 text-teal-700" aria-hidden />
                <span className="truncate">{building.name}</span>
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{formatFullAddress(building)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton label="Copy link căn" path={`/b/${building.public_slug}`} />
              <LinkButton href={`/b/${building.public_slug}`} label="Xem căn" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Phòng sell" value={building.rooms.length} />
            <Stat label="Đang trống" value={building.available_rooms} />
            <Stat label="Sắp trống" value={building.coming_soon_rooms} />
          </div>

          {building.building_drive_folder_url ? (
            <div className="mt-4">
              <DriveButton href={building.building_drive_folder_url} label="Mở album Google Drive" />
            </div>
          ) : null}
        </div>
      </div>

      {building.rooms.length > 0 ? (
        <div className="grid gap-3 border-t border-slate-100 p-4">
          {building.rooms.map((room) => (
            <RoomSummaryCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="border-t border-slate-100 p-4 text-sm text-slate-500">
          Căn này hiện không có phòng đang trống hoặc sắp trống.
        </div>
      )}
    </article>
  );
}

function RoomSummaryCard({ room }: { room: ShareRoom }) {
  const images = displayImages(room.cover_image_url, room.images);
  const roomLayouts = getEffectiveRoomLayoutValues(room.room_layouts, room.features).slice(0, 3);

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="grid gap-3 sm:grid-cols-[96px_minmax(0,1fr)]">
        <SafeImage
          alt={room.title || `Phòng ${room.room_code}`}
          className="aspect-[4/3] w-full rounded-xl object-cover"
          fallbackClassName="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400"
          src={images[0]}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-slate-950">
                {room.title || `Phòng ${room.room_code}`}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Mã {room.room_code}
                {room.floor ? ` · Tầng ${room.floor}` : ""}
              </p>
            </div>
            <StatusBadge status={room.status} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Info label="Giá thuê" value={formatCurrencyVnd(room.rent_price)} />
            {room.area_m2 ? <Info label="Diện tích" value={formatArea(room.area_m2)} /> : null}
            {room.available_from ? <Info label="Ngày vào" value={formatDate(room.available_from)} /> : null}
            {room.commission ? <Info label="Hoa hồng" value={room.commission} /> : null}
          </div>

          {roomLayouts.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {roomLayouts.map((layout) => (
                <Chip key={layout} label={layout} />
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <CopyLinkButton label="Copy link phòng" path={`/r/${room.public_slug}`} />
            <LinkButton href={`/r/${room.public_slug}`} label="Xem phòng" />
          </div>
        </div>
      </div>
    </article>
  );
}

function ShareShell({
  actions,
  children,
  eyebrow,
  subtitle,
  title
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  eyebrow: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
          </div>
          {actions ? <div className="grid grid-cols-1 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">{actions}</div> : null}
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-5">{children}</div>
    </main>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TextBlock({ title, value }: { title: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
      {label}
    </span>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
      href={href}
    >
      {label}
    </Link>
  );
}

function DriveButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-800 hover:bg-blue-100 sm:w-auto"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}

function displayImages(coverImageUrl: string | null, images: ShareImage[]) {
  const rawImages = [
    coverImageUrl,
    ...images
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

  return rawImages.filter((image) => {
    if (seen.has(image)) {
      return false;
    }

    seen.add(image);
    return true;
  });
}

function formatLocation(building: Pick<ShareBuilding, "ward" | "district" | "city">) {
  return [building.ward, building.district, building.city].filter(Boolean).join(", ");
}

function formatFullAddress(
  building: Pick<ShareBuilding, "address" | "ward" | "district" | "city">
) {
  return [building.address, building.ward, building.district, building.city]
    .filter(Boolean)
    .join(", ");
}
