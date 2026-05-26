import type { FeeFields, RoomStatus } from "@/lib/landlord/types";

export const roomStatusLabels: Record<RoomStatus, string> = {
  available: "Đang trống",
  coming_soon: "Sắp trống",
  reserved: "Đang giữ cọc",
  rented: "Đã thuê",
  hidden: "Tạm ẩn"
};

export const roomStatusOptions: Array<{ value: RoomStatus; label: string }> = [
  { value: "available", label: roomStatusLabels.available },
  { value: "coming_soon", label: roomStatusLabels.coming_soon },
  { value: "reserved", label: roomStatusLabels.reserved },
  { value: "rented", label: roomStatusLabels.rented },
  { value: "hidden", label: roomStatusLabels.hidden }
];

export function formatCurrencyVnd(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Chưa nhập";
  }

  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export function formatArea(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Chưa nhập";
  }

  return `${Number(value).toLocaleString("vi-VN")} m2`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Chưa nhập";
  }

  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
}

export function parseFloorOrder(floor: string | null | undefined) {
  const raw = floor?.trim().toLowerCase();

  if (!raw) {
    return 10_000;
  }

  if (["g", "ground", "trệt", "tret"].includes(raw)) {
    return 0;
  }

  const numberMatch = raw.match(/\d+/);

  if (numberMatch) {
    return Number(numberMatch[0]);
  }

  return 9_000;
}

export function naturalRoomCodeCompare(a: string, b: string) {
  return a.localeCompare(b, "vi", {
    numeric: true,
    sensitivity: "base"
  });
}

export function roomSortCompare<
  T extends { floor: string | null; room_code: string }
>(a: T, b: T) {
  const floorDiff = parseFloorOrder(a.floor) - parseFloorOrder(b.floor);

  if (floorDiff !== 0) {
    return floorDiff;
  }

  return naturalRoomCodeCompare(a.room_code, b.room_code);
}

export function hasAnyFee(fees: FeeFields | null | undefined) {
  if (!fees) {
    return false;
  }

  return Boolean(
    fees.electricity_price ||
      fees.water_price ||
      fees.bicycle_parking_fee ||
      fees.motorbike_parking_fee ||
      fees.car_parking_fee ||
      fees.service_fee ||
      fees.internet_fee ||
      fees.management_fee ||
      fees.other_fees
  );
}

export function feeRows(fees: FeeFields | null | undefined) {
  if (!fees) {
    return [];
  }

  return [
    fees.electricity_price
      ? { label: "Điện", value: `${fees.electricity_price} đ/${fees.electricity_unit || "kWh"}` }
      : null,
    fees.water_price
      ? { label: "Nước", value: `${fees.water_price}/${fees.water_unit || "m3"}` }
      : null,
    fees.bicycle_parking_fee ? { label: "Xe đạp", value: fees.bicycle_parking_fee } : null,
    fees.motorbike_parking_fee ? { label: "Xe máy", value: fees.motorbike_parking_fee } : null,
    fees.car_parking_fee ? { label: "Ô tô", value: fees.car_parking_fee } : null,
    fees.internet_fee ? { label: "Internet", value: fees.internet_fee } : null,
    fees.service_fee ? { label: "Dịch vụ", value: fees.service_fee } : null,
    fees.management_fee ? { label: "Quản lý", value: fees.management_fee } : null,
    fees.other_fees ? { label: "Phí khác", value: fees.other_fees } : null
  ].filter((row): row is { label: string; value: string } => row !== null);
}
