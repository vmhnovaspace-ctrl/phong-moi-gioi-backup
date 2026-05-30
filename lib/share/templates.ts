import type { FeeFields, RoomFeature, RoomStatus } from "@/lib/landlord/types";

type SlugSource = {
  public_slug?: string | null;
};

type LandlordTemplateRoom = {
  status: RoomStatus;
  visibility?: "visible" | "hidden" | null;
};

type LandlordTemplateBuilding = SlugSource & {
  name?: string | null;
  address?: string | null;
  district?: string | null;
  rooms?: LandlordTemplateRoom[];
};

type BuildingTemplateRoom = SlugSource & {
  room_code?: string | null;
  title?: string | null;
  area_m2?: number | string | null;
  rent_price?: number | null;
  status: RoomStatus;
  visibility?: "visible" | "hidden" | null;
  available_from?: string | null;
  strengths?: string | null;
};

type BuildingTemplateData = SlugSource & {
  name?: string | null;
  address?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  common_amenities?: string | null;
  house_rules?: string | null;
  building_drive_folder_url?: string | null;
  rooms?: BuildingTemplateRoom[];
};

type RoomTemplateData = SlugSource & {
  room_code?: string | null;
  title?: string | null;
  floor?: string | null;
  area_m2?: number | string | null;
  rent_price?: number | null;
  deposit_amount?: number | null;
  max_people?: number | null;
  status: RoomStatus;
  available_from?: string | null;
  commission?: string | null;
  description?: string | null;
  strengths?: string | null;
  room_drive_folder_url?: string | null;
  effective_fees?: Partial<FeeFields & { parking_fee?: string | null }> | null;
  features?: Partial<Omit<RoomFeature, "id" | "room_id">> | null;
};

type RoomTemplateBuilding = SlugSource & {
  name?: string | null;
  address?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  building_drive_folder_url?: string | null;
};

const SELLABLE_STATUSES: RoomStatus[] = ["available", "coming_soon"];

const featureLabels: Array<{ key: keyof Omit<RoomFeature, "id" | "room_id">; label: string }> = [
  { key: "has_window", label: "Cửa sổ" },
  { key: "has_balcony", label: "Ban công" },
  { key: "has_private_bathroom", label: "WC riêng" },
  { key: "has_private_kitchen", label: "Bếp riêng" },
  { key: "has_washing_machine", label: "Máy giặt" },
  { key: "has_elevator", label: "Thang máy" },
  { key: "has_air_conditioner", label: "Máy lạnh" },
  { key: "has_fridge", label: "Tủ lạnh" },
  { key: "has_bed", label: "Giường" },
  { key: "has_wardrobe", label: "Tủ đồ" },
  { key: "allows_pet", label: "Cho nuôi pet" },
  { key: "is_furnished", label: "Nội thất" },
  { key: "has_parking", label: "Chỗ để xe" },
  { key: "has_security", label: "An ninh" }
];

export function formatCurrencyVnd(value: number | string | null | undefined) {
  const numberValue = Number(value);

  if (value === null || value === undefined || value === "" || !Number.isFinite(numberValue)) {
    return "";
  }

  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(numberValue)}đ`;
}

export function formatArea(value: number | string | null | undefined) {
  const numberValue = Number(value);

  if (value === null || value === undefined || value === "" || !Number.isFinite(numberValue)) {
    return "";
  }

  return `${numberValue.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}m²`;
}

export function formatDateVi(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

export function getRoomStatusLabel(status: RoomStatus | null | undefined) {
  switch (status) {
    case "available":
      return "Đang trống";
    case "coming_soon":
      return "Sắp trống";
    case "reserved":
      return "Đang giữ cọc";
    case "rented":
      return "Đã thuê";
    case "hidden":
      return "Tạm ẩn";
    default:
      return "";
  }
}

export function compactAddress(...parts: Array<string | null | undefined>) {
  const result: string[] = [];

  for (const part of parts) {
    const clean = cleanText(part);

    if (!clean) {
      continue;
    }

    const normalized = normalizeForCompare(clean);

    if (result.some((item) => normalizeForCompare(item) === normalized)) {
      continue;
    }

    result.push(clean);
  }

  return result.join(", ");
}

export function removeEmptyLines(text: string) {
  return text
    .replace(/\b(undefined|null|NaN)\b/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildLandlordShareText(
  data: {
    landlord?: ({ full_name?: string | null } & SlugSource) | null;
    buildings?: LandlordTemplateBuilding[];
  },
  baseUrl: string
) {
  const buildings = (data.buildings ?? [])
    .map((building) => {
      const rooms = (building.rooms ?? []).filter(isSellableRoom);
      const available = rooms.filter((room) => room.status === "available").length;
      const comingSoon = rooms.filter((room) => room.status === "coming_soon").length;

      return {
        available,
        building,
        comingSoon,
        total: available + comingSoon
      };
    })
    .filter((item) => item.total > 0);
  const availableTotal = buildings.reduce((total, item) => total + item.available, 0);
  const comingSoonTotal = buildings.reduce((total, item) => total + item.comingSoon, 0);
  const roomTotal = availableTotal + comingSoonTotal;
  const landlordName = cleanText(data.landlord?.full_name) || "Chủ nhà";
  const landlordSlug = data.landlord?.public_slug;

  return compactBlocks([
    "KHO PHÒNG TRỐNG CẬP NHẬT REALTIME",
    `Chủ nhà: ${landlordName}`,
    roomTotal > 0
      ? compactLines([
          `Hiện có ${roomTotal} phòng trống/sắp trống tại ${buildings.length} căn:`,
          ...buildings.slice(0, 10).flatMap((item, index) => [
            `${index + 1}. ${buildingDisplayName(item.building)}`,
            item.available > 0 ? `   - Đang trống: ${item.available} phòng` : null,
            item.comingSoon > 0 ? `   - Sắp trống: ${item.comingSoon} phòng` : null
          ]),
          buildings.length > 10 ? "Xem thêm đầy đủ tại link bên dưới." : null
        ])
      : "Hiện chưa có phòng trống/sắp trống.",
    compactLines(["Xem chi tiết kho phòng:", absoluteShareUrl(baseUrl, `/l/${landlordSlug ?? ""}`)])
  ]);
}

export function buildBuildingShareText(data: BuildingTemplateData, baseUrl: string) {
  const rooms = (data.rooms ?? []).filter(
    (room) => room.visibility !== "hidden" && SELLABLE_STATUSES.includes(room.status)
  );
  const buildingName = cleanText(data.name) || "căn nhà";
  const address = compactAddress(data.address, data.ward, data.district, data.city);

  return compactBlocks([
    `CĂN ${buildingName.toUpperCase()} ĐANG CÓ PHÒNG TRỐNG`,
    address ? `Địa chỉ: ${address}` : null,
    rooms.length > 0
      ? compactLines([
          `Hiện còn ${rooms.length} phòng trống/sắp trống:`,
          ...rooms.slice(0, 10).flatMap((room, index) => roomSummaryLines(room, index)),
          rooms.length > 10 ? "Xem thêm đầy đủ tại link bên dưới." : null
        ])
      : "Căn này hiện chưa có phòng trống/sắp trống.",
    cleanText(data.common_amenities) ? compactLines(["Tiện ích chung:", cleanText(data.common_amenities)]) : null,
    cleanText(data.house_rules) ? compactLines(["Quy định chung:", cleanText(data.house_rules)]) : null,
    compactLines(["Xem ảnh + chi tiết cập nhật realtime:", absoluteShareUrl(baseUrl, `/b/${data.public_slug ?? ""}`)]),
    cleanText(data.building_drive_folder_url)
      ? compactLines(["Album ảnh căn nhà:", cleanText(data.building_drive_folder_url)])
      : null
  ]);
}

export function buildRoomShareText(
  data: {
    room: RoomTemplateData;
    building: RoomTemplateBuilding;
  },
  baseUrl: string
) {
  const { building, room } = data;
  const areaName = cleanText(building.district || building.ward);
  const address = compactAddress(building.address, building.ward, building.district);
  const features = activeFeatureLabels(room.features);
  const feeLines = buildFeeLines(room.effective_fees);
  const roomLine = compactInline([
    room.room_code ? `Phòng ${room.room_code}` : "Phòng",
    room.title
  ], " - ");

  return compactBlocks([
    `CHO THUÊ PHÒNG${areaName ? ` ${areaName.toUpperCase()}` : ""}`,
    compactLines([
      `Phòng: ${roomLine}`,
      cleanText(building.name) ? `Căn: ${cleanText(building.name)}` : null,
      address ? `Địa chỉ: ${address}` : null
    ]),
    compactLines([
      formatCurrencyVnd(room.rent_price) ? `Giá: ${formatCurrencyVnd(room.rent_price)}/tháng` : null,
      formatCurrencyVnd(room.deposit_amount) ? `Cọc: ${formatCurrencyVnd(room.deposit_amount)}` : null,
      formatArea(room.area_m2) ? `Diện tích: ${formatArea(room.area_m2)}` : null,
      cleanText(room.floor) ? `Tầng: ${cleanText(room.floor)}` : null,
      room.max_people ? `Số người tối đa: ${room.max_people} người` : null,
      `Trạng thái: ${getRoomStatusLabel(room.status)}`,
      room.status === "rented" || room.status === "hidden"
        ? `Lưu ý: Phòng đang ở trạng thái ${getRoomStatusLabel(room.status)}, vui lòng kiểm tra trước khi đăng.`
        : null,
      formatDateVi(room.available_from) ? `Ngày vào: ${formatDateVi(room.available_from)}` : null,
      cleanText(room.commission) ? `Hoa hồng: ${cleanText(room.commission)}` : null
    ]),
    cleanText(room.description) ? compactLines(["Mô tả:", cleanText(room.description)]) : null,
    features.length > 0 ? compactLines(["Tiện ích:", ...features.map((feature) => `- ${feature}`)]) : null,
    feeLines.length > 0 ? compactLines(["Chi phí:", ...feeLines.map((fee) => `- ${fee}`)]) : null,
    cleanText(room.strengths) ? compactLines(["Điểm nổi bật:", cleanText(room.strengths)]) : null,
    compactLines(["Xem ảnh + chi tiết cập nhật realtime:", absoluteShareUrl(baseUrl, `/r/${room.public_slug ?? ""}`)]),
    cleanText(room.room_drive_folder_url)
      ? compactLines(["Album ảnh phòng:", cleanText(room.room_drive_folder_url)])
      : null,
    cleanText(building.building_drive_folder_url)
      ? compactLines(["Album ảnh căn:", cleanText(building.building_drive_folder_url)])
      : null
  ]);
}

export function buildLandlordSellZaloText(
  data: {
    landlord?: ({ full_name?: string | null } & SlugSource) | null;
    groups: Array<{ building: BuildingTemplateData; rooms: BuildingTemplateRoom[] }>;
  },
  baseUrl: string
) {
  const groups = data.groups
    .map((group) => ({
      building: group.building,
      rooms: group.rooms.filter(
        (room) => room.visibility !== "hidden" && SELLABLE_STATUSES.includes(room.status)
      )
    }))
    .filter((group) => group.rooms.length > 0);
  const roomTotal = groups.reduce((total, group) => total + group.rooms.length, 0);
  const landlordName = cleanText(data.landlord?.full_name) || "chủ nhà";

  return compactBlocks([
    `Kho phòng đang sell của ${landlordName}:`,
    `Hiện có ${roomTotal} phòng đang trống/sắp trống tại ${groups.length} căn:`,
    ...groups.flatMap((group) => [
      `${buildingDisplayName(group.building)}:`,
      compactLines(group.rooms.map((room) => `- ${shortSellRoomLine(room)}`))
    ]),
    compactLines([
      "Xem toàn bộ kho phòng cập nhật realtime:",
      absoluteShareUrl(baseUrl, `/l/${data.landlord?.public_slug ?? ""}`)
    ])
  ]);
}

export function buildBuildingSellZaloText(
  building: BuildingTemplateData,
  roomsInput: BuildingTemplateRoom[],
  baseUrl: string
) {
  const rooms = roomsInput.filter(
    (room) => room.visibility !== "hidden" && SELLABLE_STATUSES.includes(room.status)
  );
  const buildingName = cleanText(building.name) || "căn";

  return compactBlocks([
    `Căn ${buildingName} hiện có ${rooms.length} phòng đang sell:`,
    compactLines(rooms.map((room) => `- ${shortSellRoomLine(room)}`)),
    compactLines([
      "Xem chi tiết và ảnh cập nhật tại:",
      absoluteShareUrl(baseUrl, `/b/${building.public_slug ?? ""}`)
    ])
  ]);
}

export function buildRoomPushZaloText(
  data: { building: RoomTemplateBuilding; room: RoomTemplateData },
  baseUrl: string
) {
  const { building, room } = data;

  return compactBlocks([
    `Đẩy lại phòng ${cleanText(room.room_code) || ""} - ${cleanText(building.name) || "Căn nhà"}`,
    compactLines([
      formatCurrencyVnd(room.rent_price) ? `Giá: ${formatCurrencyVnd(room.rent_price)}/tháng` : null,
      `Trạng thái: ${roomStatusWithDate(room)}`,
      formatArea(room.area_m2) ? `Diện tích: ${formatArea(room.area_m2)}` : null,
      formatCurrencyVnd(room.deposit_amount) ? `Cọc: ${formatCurrencyVnd(room.deposit_amount)}` : null
    ]),
    compactLines([
      "Xem ảnh và chi tiết:",
      absoluteShareUrl(baseUrl, `/r/${room.public_slug ?? ""}`)
    ])
  ]);
}

export function buildClosedRoomZaloText(
  data: { building: RoomTemplateBuilding; room: RoomTemplateData },
  baseUrl: string
) {
  const { building, room } = data;
  const address = compactAddress(building.address, building.district);

  return compactBlocks([
    `Phòng ${cleanText(room.room_code) || ""} tại ${cleanText(building.name) || "căn nhà"}${address ? ` - ${address}` : ""} đã chốt.`,
    "Cảm ơn anh/chị em sale đã hỗ trợ.",
    compactLines([
      "Kho phòng đã được cập nhật tại:",
      absoluteShareUrl(baseUrl, `/b/${building.public_slug ?? ""}`)
    ])
  ]);
}

function roomSummaryLines(room: BuildingTemplateRoom, index: number) {
  return [
    `${index + 1}. ${compactInline([room.room_code ? `Phòng ${room.room_code}` : "Phòng", room.title], " - ")}`,
    formatCurrencyVnd(room.rent_price) ? `   - Giá: ${formatCurrencyVnd(room.rent_price)}/tháng` : null,
    formatArea(room.area_m2) ? `   - Diện tích: ${formatArea(room.area_m2)}` : null,
    `   - Trạng thái: ${getRoomStatusLabel(room.status)}`,
    formatDateVi(room.available_from) ? `   - Ngày vào: ${formatDateVi(room.available_from)}` : null,
    cleanText(room.strengths) ? `   - Điểm mạnh: ${cleanText(room.strengths)}` : null
  ];
}

function shortSellRoomLine(room: BuildingTemplateRoom) {
  return compactInline(
    [
      cleanText(room.room_code) ? `Phòng ${cleanText(room.room_code)}` : "Phòng",
      formatCurrencyVnd(room.rent_price),
      roomStatusWithDate(room),
      formatArea(room.area_m2)
    ],
    " | "
  );
}

function roomStatusWithDate(room: Pick<BuildingTemplateRoom, "status" | "available_from">) {
  if (room.status === "coming_soon" && formatDateVi(room.available_from)) {
    return `Sắp trống ngày ${formatDateVi(room.available_from)}`;
  }

  return getRoomStatusLabel(room.status);
}

function buildFeeLines(fees: Partial<FeeFields & { parking_fee?: string | null }> | null | undefined) {
  if (!fees) {
    return [];
  }

  const parking = compactInline(
    [fees.parking_fee, fees.bicycle_parking_fee, fees.motorbike_parking_fee, fees.car_parking_fee],
    " / "
  );

  return [
    fees.electricity_price ? `Điện: ${fees.electricity_price}/${fees.electricity_unit || "kWh"}` : null,
    fees.water_price ? `Nước: ${fees.water_price}/${fees.water_unit || "m3"}` : null,
    parking ? `Xe: ${parking}` : null,
    fees.service_fee ? `Dịch vụ: ${fees.service_fee}` : null,
    fees.internet_fee ? `Internet: ${fees.internet_fee}` : null,
    fees.management_fee ? `Quản lý: ${fees.management_fee}` : null,
    fees.other_fees ? `Phí khác: ${fees.other_fees}` : null
  ].filter((line): line is string => Boolean(cleanText(line)));
}

function activeFeatureLabels(features: RoomTemplateData["features"]) {
  if (!features) {
    return [];
  }

  return featureLabels
    .filter((feature) => Boolean(features[feature.key]))
    .map((feature) => feature.label);
}

function isSellableRoom(room: LandlordTemplateRoom) {
  return room.visibility !== "hidden" && SELLABLE_STATUSES.includes(room.status);
}

function buildingDisplayName(building: LandlordTemplateBuilding) {
  return compactInline([building.name, building.district], " - ") || cleanText(building.address) || "Căn nhà";
}

function absoluteShareUrl(baseUrl: string, path: string) {
  const normalizedBase =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  try {
    return new URL(path, normalizedBase.endsWith("/") ? normalizedBase : `${normalizedBase}/`).toString();
  } catch {
    return path;
  }
}

function compactBlocks(blocks: Array<string | null | undefined>) {
  return removeEmptyLines(
    blocks
      .map((block) => block?.trim())
      .filter((block): block is string => Boolean(block))
      .join("\n\n")
  );
}

function compactLines(lines: Array<string | null | undefined>) {
  return removeEmptyLines(
    lines
      .map((line) => line?.trimEnd())
      .filter((line): line is string => Boolean(line?.trim()))
      .join("\n")
  );
}

function compactInline(values: Array<string | null | undefined>, separator = ", ") {
  return values
    .map(cleanText)
    .filter(Boolean)
    .join(separator);
}

function cleanText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeForCompare(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
