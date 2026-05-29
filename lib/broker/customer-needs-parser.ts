import type { BrokerInventoryFeatureSummary, BrokerInventoryRoom } from "@/lib/broker/types";
import { normalizeBrokerSearchText } from "@/lib/broker/search";
import { formatCurrencyVnd } from "@/lib/landlord/format";

type FeatureKey = keyof BrokerInventoryFeatureSummary;

export type CustomerNeedFeature = {
  key?: FeatureKey;
  label: string;
  patterns: string[];
};

export type CustomerNeedDistrict = {
  label: string;
  patterns: string[];
};

export type ParsedCustomerNeeds = {
  chips: string[];
  districts: CustomerNeedDistrict[];
  features: CustomerNeedFeature[];
  hasStructuredCriteria: boolean;
  maxAreaM2: number | null;
  maxPrice: number | null;
  minAreaM2: number | null;
  minPeople: number | null;
  minPrice: number | null;
  normalized: string;
  rawKeywords: string[];
  statuses: Array<"available" | "coming_soon">;
  targetAreaM2: number | null;
};

export type CustomerNeedRoomMatch = BrokerInventoryRoom & {
  matchLevel: "strong" | "near" | "keyword";
  matchReasons: string[];
  score: number;
};

const DISTRICT_PATTERNS: CustomerNeedDistrict[] = [
  { label: "Quận 1", patterns: ["q1", "q 1", "q.1", "quan 1"] },
  { label: "Quận 7", patterns: ["q7", "q 7", "q.7", "quan 7"] },
  { label: "Phú Nhuận", patterns: ["pn", "phu nhuan"] },
  { label: "Tân Bình", patterns: ["tb", "tan binh"] },
  { label: "Bình Thạnh", patterns: ["bt", "binh thanh"] },
  { label: "Gò Vấp", patterns: ["gv", "go vap"] },
  { label: "Thủ Đức", patterns: ["td", "t d", "thu duc", "tp thu duc", "thanh pho thu duc"] },
  { label: "Bình Tân", patterns: ["binh tan"] },
  { label: "Tân Phú", patterns: ["tan phu"] }
];

const FEATURE_PATTERNS: CustomerNeedFeature[] = [
  { key: "is_furnished", label: "Full nội thất", patterns: ["full nt", "full noi that", "noi that", "du noi that"] },
  { key: "has_balcony", label: "Ban công", patterns: ["ban cong", "bc"] },
  { key: "has_window", label: "Cửa sổ", patterns: ["cua so", "cs", "thoang"] },
  { key: "has_elevator", label: "Thang máy", patterns: ["thang may", "tm", "elevator"] },
  { label: "Gác lửng", patterns: ["gac", "gac lung"] },
  { key: "has_private_kitchen", label: "Bếp riêng", patterns: ["bep rieng"] },
  { key: "has_private_bathroom", label: "WC riêng", patterns: ["wc rieng", "toilet rieng", "ve sinh rieng"] },
  { key: "has_air_conditioner", label: "Máy lạnh", patterns: ["may lanh", "dieu hoa"] },
  { key: "has_fridge", label: "Tủ lạnh", patterns: ["tu lanh"] },
  { key: "has_bed", label: "Giường", patterns: ["giuong"] },
  { key: "has_washing_machine", label: "Máy giặt", patterns: ["may giat"] },
  { key: "has_parking", label: "Chỗ để xe", patterns: ["cho de xe", "giu xe", "de xe"] },
  { key: "allows_pet", label: "Cho nuôi thú cưng", patterns: ["pet", "meo", "cho", "nuoi meo", "nuoi cho", "thu cung"] },
  { key: "has_security", label: "An ninh", patterns: ["an ninh", "bao ve"] },
  { label: "Giờ tự do", patterns: ["gio tu do", "tu do gio giac"] }
];

const STATUS_PATTERNS = {
  available: ["trong", "dang trong", "co ngay"],
  coming_soon: ["sap trong", "dau thang", "giua thang"]
} as const;

export function parseCustomerNeeds(input: string): ParsedCustomerNeeds {
  const normalized = normalizeNeedText(input);
  const price = parsePrice(normalized);
  const area = parseArea(normalized);
  const districts = DISTRICT_PATTERNS.filter((district) =>
    district.patterns.some((pattern) => includesPattern(normalized, pattern))
  );
  const features = FEATURE_PATTERNS.filter((feature) =>
    feature.patterns.some((pattern) => includesPattern(normalized, pattern))
  );
  const statuses = parseStatuses(normalized);
  const minPeople = parsePeople(normalized);
  const rawKeywords = extractRawKeywords(normalized, districts, features);
  const chips = buildCustomerNeedChips({
    ...price,
    ...area,
    districts,
    features,
    minPeople,
    statuses
  });

  return {
    chips,
    districts,
    features,
    hasStructuredCriteria:
      chips.length > 0 ||
      Boolean(price.maxPrice || price.minPrice || area.minAreaM2 || area.maxAreaM2 || area.targetAreaM2 || minPeople),
    maxAreaM2: area.maxAreaM2,
    maxPrice: price.maxPrice,
    minAreaM2: area.minAreaM2,
    minPeople,
    minPrice: price.minPrice,
    normalized,
    rawKeywords,
    statuses,
    targetAreaM2: area.targetAreaM2
  };
}

export function rankCustomerNeedRooms(
  rooms: BrokerInventoryRoom[],
  input: string
): { matches: CustomerNeedRoomMatch[]; parsed: ParsedCustomerNeeds } {
  const parsed = parseCustomerNeeds(input);
  const hasInput = parsed.normalized.length > 0;
  const matches = rooms
    .map((room) => scoreCustomerNeedRoom(room, parsed))
    .filter((room) => !hasInput || room.score > 0)
    .sort((a, b) => b.score - a.score || a.rent_price - b.rent_price)
    .slice(0, 30);

  return { matches, parsed };
}

export function scoreCustomerNeedRoom(
  room: BrokerInventoryRoom,
  parsed: ParsedCustomerNeeds
): CustomerNeedRoomMatch {
  let score = 0;
  const reasons: string[] = [];
  const area = numberValue(room.area_m2);
  const haystack = normalizeNeedText(
    [
      room.room_code,
      room.title,
      room.description,
      room.strengths,
      room.weaknesses,
      room.building.name,
      room.building.address,
      room.building.formatted_address,
      room.building.ward,
      room.building.district,
      room.building.city
    ].join(" ")
  );

  if (room.status === "available") {
    score += 6;
  } else if (room.status === "coming_soon") {
    score += 3;
  }

  if (parsed.statuses.length > 0) {
    if (
      (room.status === "available" || room.status === "coming_soon") &&
      parsed.statuses.includes(room.status)
    ) {
      score += 8;
      reasons.push(room.status === "available" ? "Đang trống đúng nhu cầu" : "Sắp trống đúng nhu cầu");
    } else {
      score -= 2;
    }
  }

  if (parsed.minPrice !== null || parsed.maxPrice !== null) {
    const minPrice = parsed.minPrice ?? 0;
    const maxPrice = parsed.maxPrice ?? Number.POSITIVE_INFINITY;

    if (room.rent_price >= minPrice && room.rent_price <= maxPrice) {
      score += 24;
      reasons.push("Giá trong nhu cầu");
    } else if (parsed.maxPrice !== null && room.rent_price <= parsed.maxPrice * 1.15) {
      score += 6;
      reasons.push("Giá gần nhu cầu");
    } else {
      score -= 12;
    }
  }

  if (parsed.minAreaM2 !== null) {
    if (area !== null && area >= parsed.minAreaM2) {
      score += 14;
      reasons.push("Diện tích phù hợp");
    } else if (area !== null && area >= parsed.minAreaM2 - 3) {
      score += 4;
      reasons.push("Diện tích gần nhu cầu");
    } else {
      score -= 6;
    }
  }

  if (parsed.maxAreaM2 !== null) {
    if (area !== null && area <= parsed.maxAreaM2) {
      score += 8;
    } else {
      score -= 4;
    }
  }

  if (parsed.targetAreaM2 !== null && area !== null) {
    if (Math.abs(area - parsed.targetAreaM2) <= 3) {
      score += 12;
      reasons.push("Diện tích gần mức khách muốn");
    } else if (area >= parsed.targetAreaM2) {
      score += 6;
    }
  }

  for (const district of parsed.districts) {
    if (districtMatches(haystack, district)) {
      score += 22;
      reasons.push(`Đúng khu vực ${district.label}`);
    } else {
      score -= 8;
    }
  }

  for (const feature of parsed.features) {
    if (featureMatches(room, haystack, feature)) {
      score += 8;
      reasons.push(`Có ${feature.label.toLowerCase()}`);
    } else {
      score -= 3;
    }
  }

  if (parsed.minPeople !== null) {
    if (room.max_people && room.max_people >= parsed.minPeople) {
      score += 8;
      reasons.push(`Phù hợp ${parsed.minPeople} người`);
    } else if (!room.max_people) {
      score += 1;
    } else {
      score -= 8;
    }
  }

  for (const keyword of parsed.rawKeywords) {
    if (keyword.length >= 2 && haystack.includes(keyword)) {
      score += 2;
      reasons.push(`Khớp từ khóa "${keyword}"`);
    }
  }

  const uniqueReasons = Array.from(new Set(reasons)).slice(0, 5);
  const matchLevel = score >= 30 ? "strong" : score >= 12 ? "near" : "keyword";

  return {
    ...room,
    matchLevel,
    matchReasons: uniqueReasons.length > 0 ? uniqueReasons : ["Gần phù hợp với dữ liệu hiện có"],
    score
  };
}

function normalizeNeedText(value: string | number | null | undefined) {
  return normalizeBrokerSearchText(String(value ?? "").replace(/m²/g, "m2").replace(/mÂ²/g, "m2"));
}

function includesPattern(normalized: string, pattern: string) {
  const normalizedPattern = normalizeNeedText(pattern);
  const escaped = escapeRegex(normalizedPattern).replace(/\s+/g, "\\s+");
  return new RegExp(`(^|\\s)${escaped}(?=\\s|$)`).test(normalized);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePrice(normalized: string) {
  const range = normalized.match(/\b(\d+(?:[,.]\d+)?)\s*(?:-|den|toi)\s*(\d+(?:[,.]\d+)?)\s*(?:tr|trieu|m)\b/);
  if (range?.[1] && range[2]) {
    return {
      maxPrice: toMillion(range[2]),
      minPrice: toMillion(range[1])
    };
  }

  const maxPrefix = /\b(?:duoi|max|toi da|khong qua|<=|<)\s*(\d+(?:[,.]\d+)?)\s*(tr|trieu|m|k)\b/.exec(normalized);
  if (maxPrefix?.[1] && maxPrefix[2]) {
    return { maxPrice: toPrice(maxPrefix[1], maxPrefix[2]), minPrice: null };
  }

  const millionMatches = Array.from(normalized.matchAll(/\b(\d+(?:[,.]\d+)?)\s*(tr|trieu|m)\b/g))
    .filter((match) => match[2] !== "m" || Number(match[1].replace(",", ".")) <= 15);

  if (millionMatches[0]?.[1] && millionMatches[0][2]) {
    return { maxPrice: toPrice(millionMatches[0][1], millionMatches[0][2]), minPrice: null };
  }

  const kMatch = normalized.match(/\b(\d+(?:[,.]\d+)?)\s*k\b/);
  if (kMatch?.[1]) {
    return { maxPrice: toPrice(kMatch[1], "k"), minPrice: null };
  }

  return { maxPrice: null, minPrice: null };
}

function parseArea(normalized: string) {
  const prefixed = normalized.match(/\b(tren|tu|duoi|tam|khoang)\s*(\d+(?:[,.]\d+)?)\s*(?:m2|m|met)\b/);
  if (prefixed?.[1] && prefixed[2]) {
    const value = toNumber(prefixed[2]);
    if (prefixed[1] === "duoi") {
      return { maxAreaM2: value, minAreaM2: null, targetAreaM2: null };
    }

    if (prefixed[1] === "tam" || prefixed[1] === "khoang") {
      return { maxAreaM2: null, minAreaM2: null, targetAreaM2: value };
    }

    return { maxAreaM2: null, minAreaM2: value, targetAreaM2: null };
  }

  const areaMatches = Array.from(normalized.matchAll(/\b(\d+(?:[,.]\d+)?)\s*(m2|m|met)\b/g))
    .filter((match) => match[2] !== "m" || Number(match[1].replace(",", ".")) > 15);

  if (areaMatches[0]?.[1]) {
    return { maxAreaM2: null, minAreaM2: toNumber(areaMatches[0][1]), targetAreaM2: null };
  }

  return { maxAreaM2: null, minAreaM2: null, targetAreaM2: null };
}

function parseStatuses(normalized: string): Array<"available" | "coming_soon"> {
  const statuses = new Set<"available" | "coming_soon">();

  if (STATUS_PATTERNS.available.some((pattern) => includesPattern(normalized, pattern))) {
    statuses.add("available");
  }

  if (STATUS_PATTERNS.coming_soon.some((pattern) => includesPattern(normalized, pattern))) {
    statuses.add("coming_soon");
  }

  return Array.from(statuses);
}

function parsePeople(normalized: string) {
  const direct = normalized.match(/\b(\d+)\s*(?:nguoi|ng)\b/);
  if (direct?.[1]) {
    return Number(direct[1]);
  }

  const short = normalized.match(/\b(?:o|nam o|nu o)\s*(\d+)\b/);
  if (short?.[1]) {
    return Number(short[1]);
  }

  if (includesPattern(normalized, "cap doi") || includesPattern(normalized, "vo chong")) {
    return 2;
  }

  return null;
}

function extractRawKeywords(
  normalized: string,
  districts: CustomerNeedDistrict[],
  features: CustomerNeedFeature[]
) {
  let text = normalized
    .replace(/\b(?:tim|phong|can|co|cho|gan|gia|tam|khoang|duoi|tren|tu|den|toi|da|max|trieu|tr|m2|met|nguoi|ng|o)\b/g, " ")
    .replace(/\b\d+(?:[,.]\d+)?\s*(?:trieu|tr|m2|met|nguoi|ng|k|m)?\b/g, " ");

  for (const district of districts) {
    for (const pattern of district.patterns) {
      text = text.replace(new RegExp(`\\b${escapeRegex(normalizeNeedText(pattern)).replace(/\s+/g, "\\s+")}\\b`, "g"), " ");
    }
  }

  for (const feature of features) {
    for (const pattern of feature.patterns) {
      text = text.replace(new RegExp(`\\b${escapeRegex(normalizeNeedText(pattern)).replace(/\s+/g, "\\s+")}\\b`, "g"), " ");
    }
  }

  return Array.from(new Set(text.split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 3))).slice(0, 8);
}

function buildCustomerNeedChips(input: {
  districts: CustomerNeedDistrict[];
  features: CustomerNeedFeature[];
  maxAreaM2: number | null;
  maxPrice: number | null;
  minAreaM2: number | null;
  minPeople: number | null;
  minPrice: number | null;
  statuses: Array<"available" | "coming_soon">;
  targetAreaM2: number | null;
}) {
  const chips: string[] = [];

  if (input.minPrice !== null && input.maxPrice !== null) {
    chips.push(`${formatCompactPrice(input.minPrice)}-${formatCompactPrice(input.maxPrice)}`);
  } else if (input.maxPrice !== null) {
    chips.push(`≤ ${formatCompactPrice(input.maxPrice)}`);
  }

  if (input.minAreaM2 !== null) {
    chips.push(`≥ ${formatAreaChip(input.minAreaM2)}`);
  }

  if (input.maxAreaM2 !== null) {
    chips.push(`≤ ${formatAreaChip(input.maxAreaM2)}`);
  }

  if (input.targetAreaM2 !== null) {
    chips.push(`Khoảng ${formatAreaChip(input.targetAreaM2)}`);
  }

  chips.push(...input.districts.map((district) => district.label));
  chips.push(...input.features.map((feature) => feature.label));

  if (input.minPeople !== null) {
    chips.push(`${input.minPeople} người`);
  }

  if (input.statuses.includes("available")) {
    chips.push("Có ngay");
  }

  if (input.statuses.includes("coming_soon")) {
    chips.push("Sắp trống");
  }

  return Array.from(new Set(chips)).slice(0, 12);
}

function featureMatches(room: BrokerInventoryRoom, haystack: string, feature: CustomerNeedFeature) {
  if (feature.key && room.features?.[feature.key]) {
    return true;
  }

  return feature.patterns.some((pattern) => includesPattern(haystack, pattern));
}

function districtMatches(haystack: string, district: CustomerNeedDistrict) {
  return [district.label, ...district.patterns].some((pattern) => includesPattern(haystack, pattern));
}

function toPrice(raw: string, unit: string) {
  if (unit === "k") {
    return Math.round(toNumber(raw) * 1000);
  }

  return toMillion(raw);
}

function toMillion(raw: string) {
  return Math.round(toNumber(raw) * 1_000_000);
}

function toNumber(raw: string) {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCompactPrice(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} triệu`;
  }

  return formatCurrencyVnd(value);
}

function formatAreaChip(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}m²`;
}
