import type { BrokerPostChannel } from "@/lib/broker/types";
import type { FeeFields, ImageSourceType, RoomFeature, RoomStatus } from "@/lib/landlord/types";

export type RoomPostFeatureInput = Partial<Omit<RoomFeature, "id" | "room_id">> | null;

export type RoomPostImageInput = {
  image_url: string;
  source_type?: ImageSourceType;
  image_type?: string;
  is_cover?: boolean;
  sort_order?: number;
} | null;

export type RoomPostRoomInput = {
  id: string;
  room_code: string;
  title: string | null;
  floor: string | null;
  area_m2: number | string | null;
  rent_price: number;
  deposit_amount: number | null;
  max_people?: number | null;
  status: RoomStatus;
  available_from: string | null;
  commission: string | null;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  room_drive_folder_url: string | null;
  cover_image_url: string | null;
  public_slug?: string | null;
};

export type RoomPostBuildingInput = {
  name: string;
  address: string;
  ward: string | null;
  district: string | null;
  city: string | null;
  google_maps_url?: string | null;
  common_amenities?: string | null;
  description?: string | null;
  house_rules?: string | null;
  building_drive_folder_url?: string | null;
};

export type GenerateRoomPostInput = {
  room: RoomPostRoomInput;
  building: RoomPostBuildingInput;
  fees?: Partial<FeeFields> | null;
  features?: RoomPostFeatureInput;
  images?: RoomPostImageInput[];
  channel: BrokerPostChannel;
};

export type GeneratedRoomPost = {
  title: string;
  body: string;
};

export const postChannelLabels: Record<BrokerPostChannel, string> = {
  chotot: "Chợ Tốt",
  facebook: "Facebook",
  mogi: "Mogi",
  zalo: "Zalo"
};

const featureLabels: Array<{ key: keyof Omit<RoomFeature, "id" | "room_id">; label: string; highlight?: string }> = [
  { key: "is_furnished", label: "Full nội thất", highlight: "full nội thất" },
  { key: "has_balcony", label: "Ban công", highlight: "có ban công" },
  { key: "has_window", label: "Cửa sổ", highlight: "có cửa sổ" },
  { key: "has_elevator", label: "Thang máy", highlight: "có thang máy" },
  { key: "has_private_bathroom", label: "WC riêng" },
  { key: "has_private_kitchen", label: "Bếp riêng" },
  { key: "has_washing_machine", label: "Máy giặt" },
  { key: "has_air_conditioner", label: "Máy lạnh" },
  { key: "has_fridge", label: "Tủ lạnh" },
  { key: "has_bed", label: "Giường" },
  { key: "has_wardrobe", label: "Tủ quần áo" },
  { key: "allows_pet", label: "Cho nuôi thú cưng" },
  { key: "has_parking", label: "Chỗ để xe" },
  { key: "has_security", label: "An ninh/camera", highlight: "an ninh/camera" }
];

export function generateRoomPost({
  building,
  channel,
  features,
  fees,
  room
}: GenerateRoomPostInput): GeneratedRoomPost {
  const tenantLocation = buildTenantSafeLocation(building);
  const district = building.district || building.ward || "";
  const area = formatAreaForPost(room.area_m2);
  const price = formatCurrencyVND(room.rent_price);
  const amenities = mapRoomFeaturesToVietnamese(features);
  const highlights = getHighlights(room, building, features);
  const feeLines = getFeeLines(fees);
  const title = buildSeoTitle({ area, building, highlights, price, tenantLocation });
  const cta = channel === "zalo"
    ? "Anh/chị xem qua phòng này nhé. Nếu phù hợp em gửi thêm hình ảnh/video và hẹn lịch xem phòng."
    : channel === "facebook"
      ? "Inbox/Zalo để xem phòng thực tế và nhận thêm danh sách phòng phù hợp."
      : "Liên hệ để xem phòng thực tế và nhận thêm hình ảnh/video chi tiết.";

  if (channel === "zalo") {
    return {
      title,
      body: compactLines([
        tenantLocation ? `Em gửi anh/chị một phòng tại khu vực ${tenantLocation}.` : "Em gửi anh/chị một phòng phù hợp để tham khảo.",
        price ? `Giá thuê: ${price}/tháng` : null,
        area ? `Diện tích: ${area}` : null,
        room.deposit_amount ? `Cọc: ${formatCurrencyVND(room.deposit_amount)}` : null,
        room.max_people ? `Phù hợp: ${room.max_people} người` : null,
        highlights.length > 0 ? `Điểm nổi bật: ${highlights.slice(0, 3).join(", ")}` : null,
        amenities.length > 0 ? `Tiện ích: ${amenities.slice(0, 6).join(", ")}` : null,
        feeLines.length > 0 ? ["Chi phí:", ...feeLines.slice(0, 4).map((line) => `- ${line}`)].join("\n") : null,
        cta
      ])
    };
  }

  return {
    title,
    body: compactLines([
      tenantLocation
        ? `Cho thuê phòng tại khu vực ${tenantLocation}. Phòng phù hợp cho khách cần không gian sạch sẽ, tiện di chuyển và có thể vào ở thuận tiện.`
        : "Cho thuê phòng phù hợp cho khách cần không gian sạch sẽ, tiện di chuyển và có thể vào ở thuận tiện.",
      channel === "mogi" ? buildMogiParagraph({ amenities, area, district, tenantLocation }) : null,
      section("Thông tin chính", [
        tenantLocation ? `Khu vực: ${tenantLocation}` : null,
        price ? `Giá thuê: ${price}/tháng` : null,
        area ? `Diện tích: ${area}` : null,
        room.deposit_amount ? `Cọc: ${formatCurrencyVND(room.deposit_amount)}` : null,
        room.max_people ? `Số người phù hợp: ${room.max_people} người` : null
      ]),
      highlights.length > 0 ? section("Điểm nổi bật", highlights) : null,
      amenities.length > 0 ? section("Tiện ích", amenities) : null,
      feeLines.length > 0 ? section("Chi phí", feeLines) : null,
      cta
    ])
  };
}

export function sanitizeAddressForTenant(address: string) {
  const trimmed = address.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)*(?:[\s,.-]+|$)/, "").trim();
}

export function buildTenantSafeLocation(building: RoomPostBuildingInput) {
  const sanitizedAddress = sanitizeAddressForTenant(building.address);

  return uniqueLocationParts([sanitizedAddress, building.ward, building.district, building.city]).join(", ");
}

export function mapRoomFeaturesToVietnamese(features: RoomPostFeatureInput | undefined) {
  if (!features) {
    return [];
  }

  return featureLabels
    .filter((feature) => Boolean(features[feature.key]))
    .map((feature) => feature.label);
}

export function formatCurrencyVND(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value)}đ`;
}

function buildSeoTitle({
  area,
  building,
  highlights,
  price,
  tenantLocation
}: {
  area: string;
  building: RoomPostBuildingInput;
  highlights: string[];
  price: string;
  tenantLocation: string;
}) {
  const street = tenantLocation.split(",")[0]?.trim();
  const district = building.district || building.ward || "";
  const safeLocation = street && district ? `đường ${street}, ${district}` : district || tenantLocation;
  const topFeatures = truncateText(highlights.slice(0, 2).join(", ") || "phòng đẹp, dễ đi lại", 44);
  const parts = ["Cho thuê phòng", safeLocation, area, price ? `giá ${price}/tháng` : null]
    .filter(Boolean)
    .join(" ");

  return truncateText(`${parts}${topFeatures ? ` - ${topFeatures}` : ""}`, 95);
}

function buildMogiParagraph({
  amenities,
  area,
  district,
  tenantLocation
}: {
  amenities: string[];
  area: string;
  district: string;
  tenantLocation: string;
}) {
  return compactInline([
    tenantLocation ? `Vị trí thuộc ${tenantLocation}` : district ? `Vị trí thuộc ${district}` : null,
    area ? `diện tích ${area}` : null,
    amenities.length > 0 ? `có ${amenities.slice(0, 4).join(", ").toLowerCase()}` : null,
    "phù hợp khách cần nơi ở gọn gàng, tiện nghi và thuận tiện di chuyển."
  ]);
}

function getHighlights(
  room: RoomPostRoomInput,
  building: RoomPostBuildingInput,
  features: RoomPostFeatureInput | undefined
) {
  const featureHighlights = featureLabels
    .filter((feature) => Boolean(features?.[feature.key]) && feature.highlight)
    .map((feature) => sentenceCase(feature.highlight as string));
  const textHighlights = [room.strengths, room.description, building.common_amenities]
    .flatMap((value) => splitTextHighlights(value, room))
    .slice(0, 4);
  const locationHighlight = building.district ? `Khu vực ${building.district} thuận tiện di chuyển` : null;

  return uniqueStrings([...featureHighlights, ...textHighlights, locationHighlight]).slice(0, 7);
}

function getFeeLines(fees: Partial<FeeFields> | null | undefined) {
  if (!fees) {
    return [];
  }

  const electricityUnit = "electricity_unit" in fees ? fees.electricity_unit : "kWh";
  const waterUnit = "water_unit" in fees ? fees.water_unit : "m3";
  const parkingFee =
    "parking_fee" in fees && typeof fees.parking_fee === "string"
      ? fees.parking_fee
      : compactInline(
          [
            "bicycle_parking_fee" in fees ? fees.bicycle_parking_fee : null,
            "motorbike_parking_fee" in fees ? fees.motorbike_parking_fee : null,
            "car_parking_fee" in fees ? fees.car_parking_fee : null
          ],
          " / "
        );

  return [
    fees.electricity_price ? `Điện: ${fees.electricity_price}/${electricityUnit || "kWh"}` : null,
    fees.water_price ? `Nước: ${fees.water_price}/${waterUnit || "m3"}` : null,
    parkingFee ? `Xe: ${parkingFee}` : null,
    fees.service_fee ? `Dịch vụ: ${fees.service_fee}` : null,
    fees.internet_fee ? `Internet: ${fees.internet_fee}` : null,
    fees.management_fee ? `Quản lý: ${fees.management_fee}` : null,
    fees.other_fees ? `Phí khác: ${fees.other_fees}` : null
  ].filter((line): line is string => Boolean(line));
}

function section(title: string, lines: Array<string | null>) {
  const visibleLines = lines.filter((line): line is string => Boolean(line));

  if (visibleLines.length === 0) {
    return null;
  }

  return [`${title}:`, ...visibleLines.map((line) => `- ${line}`)].join("\n");
}

function splitTextHighlights(value: string | null | undefined, room: RoomPostRoomInput) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n.;]/)
    .map((item) => stripInternalRoomTokens(item.trim(), room))
    .filter((item) => item.length > 0)
    .map((item) => truncateText(item, 90));
}

function stripInternalRoomTokens(value: string, room: RoomPostRoomInput) {
  if (!value) {
    return "";
  }

  const escapedCode = escapeRegExp(room.room_code.trim());
  const withoutRoomCode = escapedCode
    ? value
        .replace(new RegExp(`\\b(?:phòng|mã phòng|p\\.?|room)\\s*${escapedCode}\\b`, "giu"), "phòng")
        .replace(new RegExp(`\\b${escapedCode}\\b`, "gu"), "")
    : value;

  return withoutRoomCode
    .replace(room.commission ?? "", "")
    .replace(room.available_from ?? "", "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatAreaForPost(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return "";
  }

  return `${numberValue.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}m²`;
}

function uniqueLocationParts(values: Array<string | null | undefined>) {
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();

    if (!trimmed) {
      continue;
    }

    const normalized = normalizeText(trimmed);

    if (result.some((item) => normalizeText(item).includes(normalized) || normalized.includes(normalizeText(item)))) {
      continue;
    }

    result.push(trimmed);
  }

  return result;
}

function compactLines(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
}

function compactInline(values: Array<string | null | undefined>, separator = ", ") {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(separator);
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
