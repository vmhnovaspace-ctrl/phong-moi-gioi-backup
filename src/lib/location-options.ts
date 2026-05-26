export type GeoMode = "old" | "current";

export type AdminUnitType = "phuong" | "xa" | "dac_khu";

export type CurrentAdminUnit = {
  name: string;
  type: AdminUnitType;
  label: string;
  value: string;
};

export function slugifyVietnamese(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CURRENT_ADMIN_UNIT_LABELS = [
  // 113 PHUONG
  "Phường Sài Gòn",
  "Phường Tân Định",
  "Phường Bến Thành",
  "Phường Cầu Ông Lãnh",
  "Phường Bàn Cờ",
  "Phường Xuân Hòa",
  "Phường Nhiêu Lộc",
  "Phường Xóm Chiếu",
  "Phường Khánh Hội",
  "Phường Vĩnh Hội",
  "Phường Chợ Quán",
  "Phường An Đông",
  "Phường Chợ Lớn",
  "Phường Bình Tây",
  "Phường Bình Tiên",
  "Phường Bình Phú",
  "Phường Phú Lâm",
  "Phường Tân Thuận",
  "Phường Phú Thuận",
  "Phường Tân Mỹ",
  "Phường Tân Hưng",
  "Phường Chánh Hưng",
  "Phường Phú Định",
  "Phường Bình Đông",
  "Phường Diên Hồng",
  "Phường Vườn Lài",
  "Phường Hòa Hưng",
  "Phường Minh Phụng",
  "Phường Bình Thới",
  "Phường Hòa Bình",
  "Phường Phú Thọ",
  "Phường Đông Hưng Thuận",
  "Phường Trung Mỹ Tây",
  "Phường Tân Thới Hiệp",
  "Phường Thới An",
  "Phường An Phú Đông",
  "Phường An Lạc",
  "Phường Bình Tân",
  "Phường Tân Tạo",
  "Phường Bình Trị Đông",
  "Phường Bình Hưng Hòa",
  "Phường Gia Định",
  "Phường Bình Thạnh",
  "Phường Bình Lợi Trung",
  "Phường Thạnh Mỹ Tây",
  "Phường Bình Quới",
  "Phường Hạnh Thông",
  "Phường An Nhơn",
  "Phường Gò Vấp",
  "Phường An Hội Đông",
  "Phường Thông Tây Hội",
  "Phường An Hội Tây",
  "Phường Đức Nhuận",
  "Phường Cầu Kiệu",
  "Phường Phú Nhuận",
  "Phường Tân Sơn Hòa",
  "Phường Tân Sơn Nhất",
  "Phường Tân Hòa",
  "Phường Bảy Hiền",
  "Phường Tân Bình",
  "Phường Tân Sơn",
  "Phường Tây Thạnh",
  "Phường Tân Sơn Nhì",
  "Phường Phú Thọ Hòa",
  "Phường Tân Phú",
  "Phường Phú Thạnh",
  "Phường Hiệp Bình",
  "Phường Thủ Đức",
  "Phường Tam Bình",
  "Phường Linh Xuân",
  "Phường Tăng Nhơn Phú",
  "Phường Long Bình",
  "Phường Long Phước",
  "Phường Long Trường",
  "Phường Cát Lái",
  "Phường Bình Trưng",
  "Phường Phước Long",
  "Phường An Khánh",
  "Phường Đông Hòa",
  "Phường Dĩ An",
  "Phường Tân Đông Hiệp",
  "Phường An Phú",
  "Phường Bình Hòa",
  "Phường Lái Thiêu",
  "Phường Thuận An",
  "Phường Thuận Giao",
  "Phường Thủ Dầu Một",
  "Phường Phú Lợi",
  "Phường Chánh Hiệp",
  "Phường Bình Dương",
  "Phường Hòa Lợi",
  "Phường Phú An",
  "Phường Tây Nam",
  "Phường Long Nguyên",
  "Phường Bến Cát",
  "Phường Chánh Phú Hòa",
  "Phường Vĩnh Tân",
  "Phường Bình Cơ",
  "Phường Tân Uyên",
  "Phường Tân Hiệp",
  "Phường Tân Khánh",
  "Phường Vũng Tàu",
  "Phường Tam Thắng",
  "Phường Rạch Dừa",
  "Phường Phước Thắng",
  "Phường Long Hương",
  "Phường Bà Rịa",
  "Phường Tam Long",
  "Phường Tân Hải",
  "Phường Tân Phước",
  "Phường Phú Mỹ",
  "Phường Tân Thành",
  "Phường Thới Hòa",

  // 54 XA
  "Xã Vĩnh Lộc",
  "Xã Tân Vĩnh Lộc",
  "Xã Bình Lợi",
  "Xã Tân Nhựt",
  "Xã Bình Chánh",
  "Xã Hưng Long",
  "Xã Bình Hưng",
  "Xã Bình Khánh",
  "Xã An Thới Đông",
  "Xã Cần Giờ",
  "Xã Củ Chi",
  "Xã Tân An Hội",
  "Xã Thái Mỹ",
  "Xã An Nhơn Tây",
  "Xã Nhuận Đức",
  "Xã Phú Hòa Đông",
  "Xã Bình Mỹ",
  "Xã Đông Thạnh",
  "Xã Hóc Môn",
  "Xã Xuân Thới Sơn",
  "Xã Bà Điểm",
  "Xã Nhà Bè",
  "Xã Hiệp Phước",
  "Xã Thường Tân",
  "Xã Bắc Tân Uyên",
  "Xã Phú Giáo",
  "Xã Phước Hòa",
  "Xã Phước Thành",
  "Xã An Long",
  "Xã Trừ Văn Thố",
  "Xã Bàu Bàng",
  "Xã Long Hòa",
  "Xã Thanh An",
  "Xã Dầu Tiếng",
  "Xã Minh Thạnh",
  "Xã Châu Pha",
  "Xã Long Hải",
  "Xã Long Điền",
  "Xã Phước Hải",
  "Xã Đất Đỏ",
  "Xã Nghĩa Thành",
  "Xã Ngãi Giao",
  "Xã Kim Long",
  "Xã Châu Đức",
  "Xã Bình Giã",
  "Xã Xuân Sơn",
  "Xã Hồ Tràm",
  "Xã Xuyên Mộc",
  "Xã Hòa Hội",
  "Xã Bàu Lâm",
  "Xã Long Sơn",
  "Xã Hòa Hiệp",
  "Xã Bình Châu",
  "Xã Thạnh An",

  // 1 DAC KHU
  "Đặc khu Côn Đảo",
];

function getUnitType(label: string): AdminUnitType {
  if (label.startsWith("Xã ")) return "xa";
  if (label.startsWith("Đặc khu ")) return "dac_khu";
  return "phuong";
}

function getUnitName(label: string) {
  return label
    .replace(/^Phường\s+/i, "")
    .replace(/^Xã\s+/i, "")
    .replace(/^Đặc khu\s+/i, "")
    .trim();
}

export const CURRENT_ADMIN_UNITS_HCMC: CurrentAdminUnit[] =
  CURRENT_ADMIN_UNIT_LABELS.map((label) => {
    const name = getUnitName(label);

    return {
      name,
      type: getUnitType(label),
      label,
      value: slugifyVietnamese(name),
    };
  });

export const CURRENT_ADMIN_UNIT_OPTIONS = [
  { label: "Tất cả", value: "all" },
  ...CURRENT_ADMIN_UNITS_HCMC.map((unit) => ({
    label: unit.label,
    value: unit.value,
  })),
];

export const OLD_DISTRICT_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Quận 1", value: "quan-1" },
  { label: "Quận 3", value: "quan-3" },
  { label: "Quận 4", value: "quan-4" },
  { label: "Quận 5", value: "quan-5" },
  { label: "Quận 6", value: "quan-6" },
  { label: "Quận 7", value: "quan-7" },
  { label: "Quận 8", value: "quan-8" },
  { label: "Quận 10", value: "quan-10" },
  { label: "Quận 11", value: "quan-11" },
  { label: "Quận 12", value: "quan-12" },
  { label: "Bình Tân", value: "binh-tan" },
  { label: "Bình Thạnh", value: "binh-thanh" },
  { label: "Gò Vấp", value: "go-vap" },
  { label: "Phú Nhuận", value: "phu-nhuan" },
  { label: "Tân Bình", value: "tan-binh" },
  { label: "Tân Phú", value: "tan-phu" },
  { label: "Thủ Đức", value: "thu-duc" },
  { label: "Bình Chánh", value: "binh-chanh" },
  { label: "Cần Giờ", value: "can-gio" },
  { label: "Củ Chi", value: "cu-chi" },
  { label: "Hóc Môn", value: "hoc-mon" },
  { label: "Nhà Bè", value: "nha-be" },
];
