import { CURRENT_ADMIN_UNITS_HCMC } from "./location-options";

export function normalizeVietnameseText(value?: string | number | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\b(thanh pho|tp\.?|quan|q\.?|huyen|h\.?|phuong|p\.?|xa|dac khu)\b/g, "")
    .replace(/[.,/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeVietnameseTextWithAdminWords(value?: string | number | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[.,/_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAllValue(value?: string | number | null) {
  const normalized = normalizeVietnameseText(value);
  return !normalized || normalized === "all" || normalized === "tat ca";
}

export function getCurrentAdminUnitByValue(value?: string | null) {
  if (!value || value === "all") return null;
  return CURRENT_ADMIN_UNITS_HCMC.find((unit) => unit.value === value) ?? null;
}

export function matchesTextLoose(source?: string | number | null, selected?: string | number | null) {
  if (isAllValue(selected)) return true;

  const a = normalizeVietnameseText(source);
  const b = normalizeVietnameseText(selected);

  if (!a || !b) return false;

  return a === b || a.includes(b) || b.includes(a);
}

export const OLD_TO_CURRENT_WARD_MAP = [
  // Tan Binh
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 1", "P1", "1", "Phường 2", "P2", "2", "Phường 3", "P3", "3"],
    current: "Tân Sơn Hòa",
  },
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 4", "P4", "4", "Phường 5", "P5", "5", "Phường 7", "P7", "7"],
    current: "Tân Sơn Nhất",
  },
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 6", "P6", "6", "Phường 8", "P8", "8", "Phường 9", "P9", "9"],
    current: "Tân Hòa",
  },
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 10", "P10", "10", "Phường 11", "P11", "11", "Phường 12", "P12", "12"],
    current: "Bảy Hiền",
  },
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 13", "P13", "13", "Phường 14", "P14", "14"],
    current: "Tân Bình",
  },
  {
    oldDistrict: "Tân Bình",
    oldWards: ["Phường 15", "P15", "15"],
    current: "Tân Bình",
    note: "Phường 15 cũ bị chia một phần sang Tân Sơn. Nếu không có địa chỉ chi tiết, tạm map sang Tân Bình và cần báo cáo dữ liệu để người dùng chỉnh.",
  },

  // Phu Nhuan
  {
    oldDistrict: "Phú Nhuận",
    oldWards: ["Phường 4", "P4", "4", "Phường 5", "P5", "5", "Phường 9", "P9", "9"],
    current: "Đức Nhuận",
  },
  {
    oldDistrict: "Phú Nhuận",
    oldWards: ["Phường 1", "P1", "1", "Phường 2", "P2", "2", "Phường 7", "P7", "7", "Phường 15", "P15", "15"],
    current: "Cầu Kiệu",
  },
  {
    oldDistrict: "Phú Nhuận",
    oldWards: ["Phường 8", "P8", "8", "Phường 10", "P10", "10", "Phường 11", "P11", "11", "Phường 13", "P13", "13"],
    current: "Phú Nhuận",
  },

  // Quan 7
  {
    oldDistrict: "Quận 7",
    oldWards: ["Bình Thuận", "Tân Thuận Đông", "Tân Thuận Tây"],
    current: "Tân Thuận",
  },
  {
    oldDistrict: "Quận 7",
    oldWards: ["Phú Thuận"],
    current: "Phú Thuận",
  },
  {
    oldDistrict: "Quận 7",
    oldWards: ["Tân Phú", "Phú Mỹ"],
    current: "Tân Mỹ",
  },
  {
    oldDistrict: "Quận 7",
    oldWards: ["Tân Phong", "Tân Quy", "Tân Kiểng", "Tân Hưng"],
    current: "Tân Hưng",
  },

  // Binh Thanh
  {
    oldDistrict: "Bình Thạnh",
    oldWards: ["Phường 1", "P1", "1", "Phường 2", "P2", "2", "Phường 7", "P7", "7", "Phường 17", "P17", "17"],
    current: "Gia Định",
  },
  {
    oldDistrict: "Bình Thạnh",
    oldWards: ["Phường 12", "P12", "12", "Phường 14", "P14", "14", "Phường 26", "P26", "26"],
    current: "Bình Thạnh",
  },
  {
    oldDistrict: "Bình Thạnh",
    oldWards: ["Phường 5", "P5", "5", "Phường 11", "P11", "11", "Phường 13", "P13", "13"],
    current: "Bình Lợi Trung",
  },
  {
    oldDistrict: "Bình Thạnh",
    oldWards: ["Phường 19", "P19", "19", "Phường 22", "P22", "22", "Phường 25", "P25", "25"],
    current: "Thạnh Mỹ Tây",
  },
  {
    oldDistrict: "Bình Thạnh",
    oldWards: ["Phường 27", "P27", "27", "Phường 28", "P28", "28"],
    current: "Bình Quới",
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasWholeTokenSequence(source: string, selected: string) {
  if (!source || !selected) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(selected)}(\\s|$)`).test(source);
}

function matchesOldWardField(ward: string, oldWard: string) {
  return ward === oldWard || hasWholeTokenSequence(ward, oldWard);
}

function matchesOldWardInAddress(address: string, oldWardRaw: string) {
  if (!address) return false;

  const normalizedRawWard = normalizeVietnameseTextWithAdminWords(oldWardRaw);
  const normalizedWard = normalizeVietnameseText(oldWardRaw);

  if (hasWholeTokenSequence(address, normalizedRawWard)) {
    return true;
  }

  if (/^\d+$/.test(normalizedWard)) {
    return new RegExp(`(^|\\s)(phuong|p)\\s+${escapeRegExp(normalizedWard)}(\\s|$)`).test(address);
  }

  return hasWholeTokenSequence(address, normalizedWard);
}

export function inferCurrentWardFromOldAddress(input: {
  district?: string | null;
  ward?: string | null;
  address?: string | null;
}) {
  const district = normalizeVietnameseText(input.district);
  const ward = normalizeVietnameseText(input.ward);
  const address = normalizeVietnameseTextWithAdminWords(input.address);

  for (const item of OLD_TO_CURRENT_WARD_MAP) {
    const oldDistrict = normalizeVietnameseText(item.oldDistrict);
    const oldWards = item.oldWards.map(normalizeVietnameseText);

    const districtMatch =
      !!district &&
      !!oldDistrict &&
      (district === oldDistrict || district.includes(oldDistrict) || oldDistrict.includes(district));

    const wardMatch = item.oldWards.some((oldWardRaw, index) => {
      const oldWard = oldWards[index];

      if (!oldWard) return false;
      return matchesOldWardField(ward, oldWard) || matchesOldWardInAddress(address, oldWardRaw);
    });

    if (districtMatch && wardMatch) return item.current;
  }

  return null;
}

export function matchesCurrentAdminUnit(input: {
  selectedCurrentValue?: string | null;
  ward?: string | null;
  district?: string | null;
  address?: string | null;
}) {
  if (isAllValue(input.selectedCurrentValue)) return true;

  const selectedUnit = getCurrentAdminUnitByValue(input.selectedCurrentValue);
  const selectedName = selectedUnit?.name ?? input.selectedCurrentValue;

  if (matchesTextLoose(input.ward, selectedName)) return true;

  const inferred = inferCurrentWardFromOldAddress({
    district: input.district,
    ward: input.ward,
    address: input.address,
  });

  if (matchesTextLoose(inferred, selectedName)) return true;

  return false;
}

export function matchesOldLocation(input: {
  selectedDistrict?: string | null;
  selectedWard?: string | null;
  district?: string | null;
  ward?: string | null;
}) {
  const districtOk =
    isAllValue(input.selectedDistrict) || matchesTextLoose(input.district, input.selectedDistrict);

  const wardOk =
    isAllValue(input.selectedWard) || matchesTextLoose(input.ward, input.selectedWard);

  return districtOk && wardOk;
}

export function matchesLocationFilter(input: {
  geoMode: "old" | "current";
  selectedDistrict?: string | null;
  selectedWard?: string | null;
  district?: string | null;
  ward?: string | null;
  address?: string | null;
}) {
  if (input.geoMode === "current") {
    return matchesCurrentAdminUnit({
      selectedCurrentValue: input.selectedWard,
      ward: input.ward,
      district: input.district,
      address: input.address,
    });
  }

  return matchesOldLocation({
    selectedDistrict: input.selectedDistrict,
    selectedWard: input.selectedWard,
    district: input.district,
    ward: input.ward,
  });
}
