import type { BoundaryMode } from "@/lib/broker/types";
import { normalizeVietnameseText } from "@/lib/broker/search";
import { CURRENT_ADMIN_UNITS_HCMC } from "@/src/lib/location-options";

export type LocationMode = "legacy" | "current";

export type HcmcLocationGroup = {
  id: string;
  name: string;
  wards: string[];
};

export const HCMC_LEGACY_LOCATION_GROUPS: HcmcLocationGroup[] = [
  {
    id: "legacy-q1",
    name: "Quận 1",
    wards: ["Bến Nghé", "Bến Thành", "Cầu Kho", "Cầu Ông Lãnh", "Cô Giang", "Đa Kao", "Nguyễn Cư Trinh", "Nguyễn Thái Bình", "Phạm Ngũ Lão", "Tân Định"]
  },
  {
    id: "legacy-q3",
    name: "Quận 3",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"]
  },
  {
    id: "legacy-q4",
    name: "Quận 4",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 8", "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 18"]
  },
  {
    id: "legacy-q5",
    name: "Quận 5",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"]
  },
  {
    id: "legacy-q7",
    name: "Quận 7",
    wards: ["Bình Thuận", "Phú Mỹ", "Phú Thuận", "Tân Hưng", "Tân Kiểng", "Tân Phong", "Tân Phú", "Tân Quy"]
  },
  {
    id: "legacy-q10",
    name: "Quận 10",
    wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"]
  },
  {
    id: "legacy-q11",
    name: "Quận 11",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"]
  },
  {
    id: "legacy-q12",
    name: "Quận 12",
    wards: ["An Phú Đông", "Đông Hưng Thuận", "Hiệp Thành", "Tân Chánh Hiệp", "Tân Hưng Thuận", "Tân Thới Hiệp", "Tân Thới Nhất", "Thạnh Lộc", "Thạnh Xuân", "Thới An", "Trung Mỹ Tây"]
  },
  {
    id: "legacy-binh-tan",
    name: "Bình Tân",
    wards: ["An Lạc", "An Lạc A", "Bình Hưng Hòa", "Bình Hưng Hòa A", "Bình Hưng Hòa B", "Bình Trị Đông", "Bình Trị Đông A", "Bình Trị Đông B", "Tân Tạo", "Tân Tạo A"]
  },
  {
    id: "legacy-binh-thanh",
    name: "Bình Thạnh",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26", "Phường 27", "Phường 28"]
  },
  {
    id: "legacy-go-vap",
    name: "Gò Vấp",
    wards: ["Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"]
  },
  {
    id: "legacy-phu-nhuan",
    name: "Phú Nhuận",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 13", "Phường 15", "Phường 17"]
  },
  {
    id: "legacy-tan-binh",
    name: "Tân Bình",
    wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"]
  },
  {
    id: "legacy-tan-phu",
    name: "Tân Phú",
    wards: ["Hiệp Tân", "Hòa Thạnh", "Phú Thạnh", "Phú Thọ Hòa", "Phú Trung", "Sơn Kỳ", "Tân Quý", "Tân Sơn Nhì", "Tân Thành", "Tân Thới Hòa", "Tây Thạnh"]
  },
  {
    id: "legacy-thu-duc",
    name: "Thành phố Thủ Đức",
    wards: ["An Khánh", "An Lợi Đông", "An Phú", "Bình Chiểu", "Bình Thọ", "Bình Trưng Đông", "Bình Trưng Tây", "Cát Lái", "Hiệp Bình Chánh", "Hiệp Bình Phước", "Hiệp Phú", "Linh Chiểu", "Linh Đông", "Linh Tây", "Linh Trung", "Linh Xuân", "Long Bình", "Long Phước", "Long Thạnh Mỹ", "Long Trường", "Phú Hữu", "Phước Bình", "Phước Long A", "Phước Long B", "Tam Bình", "Tam Phú", "Tăng Nhơn Phú A", "Tăng Nhơn Phú B", "Thảo Điền", "Thạnh Mỹ Lợi", "Thủ Thiêm", "Trường Thạnh"]
  },
  {
    id: "legacy-hoc-mon",
    name: "Hóc Môn",
    wards: ["Bà Điểm", "Đông Thạnh", "Nhị Bình", "Tân Hiệp", "Tân Thới Nhì", "Tân Xuân", "Thới Tam Thôn", "Trung Chánh", "Xuân Thới Đông", "Xuân Thới Sơn", "Xuân Thới Thượng"]
  },
  {
    id: "legacy-binh-chanh",
    name: "Bình Chánh",
    wards: ["An Phú Tây", "Bình Chánh", "Bình Hưng", "Bình Lợi", "Đa Phước", "Hưng Long", "Lê Minh Xuân", "Phong Phú", "Quy Đức", "Tân Kiên", "Tân Nhựt", "Tân Quý Tây", "Vĩnh Lộc A", "Vĩnh Lộc B"]
  },
  {
    id: "legacy-cu-chi",
    name: "Củ Chi",
    wards: ["An Nhơn Tây", "An Phú", "Bình Mỹ", "Hòa Phú", "Nhuận Đức", "Phạm Văn Cội", "Phú Hòa Đông", "Phú Mỹ Hưng", "Phước Hiệp", "Phước Thạnh", "Phước Vĩnh An", "Tân An Hội", "Tân Phú Trung", "Tân Thạnh Đông", "Tân Thạnh Tây", "Tân Thông Hội", "Thái Mỹ", "Trung An"]
  },
  {
    id: "legacy-can-gio",
    name: "Cần Giờ",
    wards: ["An Thới Đông", "Bình Khánh", "Cần Thạnh", "Long Hòa", "Lý Nhơn", "Tam Thôn Hiệp", "Thạnh An"]
  },
  {
    id: "legacy-nha-be",
    name: "Nhà Bè",
    wards: ["Hiệp Phước", "Long Thới", "Nhơn Đức", "Phú Xuân", "Phước Kiển", "Phước Lộc", "Thị trấn Nhà Bè"]
  }
];

export const HCMC_CURRENT_LOCATION_GROUPS: HcmcLocationGroup[] = [
  {
    id: "current-hcmc-expanded",
    name: "TP.HCM mở rộng hiện hành",
    wards: CURRENT_ADMIN_UNITS_HCMC.map((unit) => unit.name)
  }
];

export function getHcmcLocationGroups(mode: BoundaryMode = "old") {
  return mode === "new" ? HCMC_CURRENT_LOCATION_GROUPS : HCMC_LEGACY_LOCATION_GROUPS;
}

export function getHcmcDistricts(mode: BoundaryMode = "old") {
  return getHcmcLocationGroups(mode).map((group) => group.name);
}

export function findHcmcDistrictName(mode: BoundaryMode = "old", district?: string) {
  const normalizedDistrict = normalizeVietnameseText(district);

  if (!normalizedDistrict) {
    return "";
  }

  return (
    getHcmcLocationGroups(mode).find(
      (group) => normalizeVietnameseText(group.name) === normalizedDistrict
    )?.name ?? ""
  );
}

export function getHcmcWards(mode: BoundaryMode = "old", district?: string) {
  if (!district) {
    return [];
  }

  const normalizedDistrict = normalizeVietnameseText(district);

  return (
    getHcmcLocationGroups(mode).find(
      (group) => normalizeVietnameseText(group.name) === normalizedDistrict
    )?.wards ?? []
  );
}
