import type { BrokerInventoryFeatureSummary, BrokerInventoryRoom } from "@/lib/broker/types";
import { roomStatusLabels } from "@/lib/landlord/format";

type PriceIntent = {
  value: number;
  tolerance: number;
};

type AreaIntent = {
  operator: "around" | "min" | "max";
  value: number;
};

export type BrokerRoomSearchQuery = {
  normalized: string;
  textTerms: string[];
  statuses: Array<"available" | "coming_soon">;
  prices: PriceIntent[];
  areas: AreaIntent[];
  requiredFeatures: Array<keyof BrokerInventoryFeatureSummary>;
};

const FEATURE_PATTERNS: Array<{
  key: keyof BrokerInventoryFeatureSummary;
  patterns: string[];
}> = [
  { key: "has_balcony", patterns: ["ban cong", "balcony"] },
  { key: "has_window", patterns: ["cua so", "thoang"] },
  { key: "is_furnished", patterns: ["noi that", "full noi that", "du noi that"] },
  { key: "allows_pet", patterns: ["thu cung", "nuoi cho", "nuoi meo", "pet"] },
  { key: "has_private_kitchen", patterns: ["bep rieng"] },
  { key: "has_private_bathroom", patterns: ["wc rieng", "toilet rieng", "ve sinh rieng"] },
  { key: "has_elevator", patterns: ["thang may"] },
  { key: "has_air_conditioner", patterns: ["may lanh", "dieu hoa"] },
  { key: "has_fridge", patterns: ["tu lanh"] },
  { key: "has_bed", patterns: ["giuong"] },
  { key: "has_wardrobe", patterns: ["tu do", "tu quan ao"] },
  { key: "has_parking", patterns: ["cho de xe", "giu xe", "de xe"] },
  { key: "has_security", patterns: ["an ninh", "bao ve"] }
];

export function normalizeBrokerSearchText(value: string | number | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0111\u0110]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeVietnamPhoneForSearch(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("84") && digits.length >= 11) {
    return `0${digits.slice(2)}`;
  }

  if (digits.startsWith("0")) {
    return digits;
  }

  if (digits.length === 9) {
    return `0${digits}`;
  }

  return digits;
}

export function matchesBrokerLandlordSearch({
  input,
  landlordName,
  landlordPhone
}: {
  input: string | null | undefined;
  landlordName: string | null | undefined;
  landlordPhone: string | null | undefined;
}) {
  const textNeedle = normalizeBrokerSearchText(input);

  if (!textNeedle) {
    return true;
  }

  if (normalizeBrokerSearchText(landlordName).includes(textNeedle)) {
    return true;
  }

  const phoneNeedle = normalizeVietnamPhoneForSearch(input);
  const phoneHaystack = normalizeVietnamPhoneForSearch(landlordPhone);

  return Boolean(
    phoneNeedle &&
      phoneHaystack &&
      (phoneHaystack.includes(phoneNeedle) || phoneNeedle.includes(phoneHaystack))
  );
}

export function normalizeVietnameseText(value: string | number | null | undefined) {
  return normalizeBrokerSearchText(value)
    .replace(/\b(thanh pho|tp\.?|quan|q\.?|huyen|h\.?|phuong|p\.?|xa|thi tran)\b/g, " ")
    .replace(/[.,/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesLocationValue(
  candidateValue: string | null | undefined,
  selectedValue: string | null | undefined
) {
  const selected = normalizeVietnameseText(selectedValue);

  if (!selected || selected === "all" || selected === "tat ca") {
    return true;
  }

  const candidate = normalizeVietnameseText(candidateValue);

  if (!candidate) {
    return false;
  }

  if (candidate === selected) {
    return true;
  }

  if (containsTokenSequence(candidate, selected) || containsTokenSequence(selected, candidate)) {
    return true;
  }

  const candidateCompact = compactLocationText(candidate);
  const selectedCompact = compactLocationText(selected);
  const hasMultiWordLocation = candidate.includes(" ") || selected.includes(" ");

  if (candidateCompact === selectedCompact) {
    return true;
  }

  return (
    hasMultiWordLocation &&
    selectedCompact.length >= 4 &&
    candidateCompact.length >= 4 &&
    (candidateCompact.includes(selectedCompact) || selectedCompact.includes(candidateCompact))
  );
}

function containsTokenSequence(value: string, sequence: string) {
  const valueTokens = value.split(" ").filter(Boolean);
  const sequenceTokens = sequence.split(" ").filter(Boolean);

  if (sequenceTokens.length === 0 || sequenceTokens.length > valueTokens.length) {
    return false;
  }

  for (let index = 0; index <= valueTokens.length - sequenceTokens.length; index += 1) {
    const matches = sequenceTokens.every((token, offset) => valueTokens[index + offset] === token);

    if (matches) {
      return true;
    }
  }

  return false;
}

function compactLocationText(value: string) {
  return value.replace(/\s+/g, "");
}

type LocationFields = {
  address?: string | null;
  district?: string | null;
  formatted_address?: string | null;
  name?: string | null;
  ward?: string | null;
};

export function matchesDistrictFilter(building: LocationFields, selectedDistrict: string | null | undefined) {
  if (matchesLocationValue(building.district, selectedDistrict)) {
    return true;
  }

  const selected = normalizeVietnameseText(selectedDistrict);

  if (!selected || selected === "all" || selected === "tat ca") {
    return true;
  }

  return [building.address, building.formatted_address, building.name].some((value) =>
    matchesLocationValue(value, selectedDistrict)
  );
}

export function matchesWardFilter(building: LocationFields, selectedWard: string | null | undefined) {
  if (matchesLocationValue(building.ward, selectedWard)) {
    return true;
  }

  const selected = normalizeVietnameseText(selectedWard);

  if (!selected || selected === "all" || selected === "tat ca") {
    return true;
  }

  return [building.address, building.formatted_address].some((value) =>
    matchesLocationValue(value, selectedWard)
  );
}

export function parseBrokerRoomSearchQuery(input: string | null | undefined): BrokerRoomSearchQuery {
  const normalized = normalizeBrokerSearchText(input);
  const statuses: BrokerRoomSearchQuery["statuses"] = [];

  if (normalized.includes("dang trong") || normalized.includes("available")) {
    statuses.push("available");
  }

  if (normalized.includes("sap trong") || normalized.includes("coming soon")) {
    statuses.push("coming_soon");
  }

  const prices = parsePriceIntents(normalized);
  const areas = parseAreaIntents(normalized);
  const requiredFeatures = FEATURE_PATTERNS
    .filter((feature) => feature.patterns.some((pattern) => normalized.includes(pattern)))
    .map((feature) => feature.key);

  const textTerms = normalized
    .split(/[,.;]+/)
    .map((term) =>
      term
        .replace(/\b(tim|phong|co|cho|gan|gia|tam|khoang|duoi|tren|tu|den|trieu|tr|m2|met vuong)\b/g, " ")
        .replace(/\d+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((term) => term.length >= 2)
    .filter(
      (term) =>
        !FEATURE_PATTERNS.some((feature) =>
          feature.patterns.some((pattern) => term.includes(pattern))
        )
    );

  return {
    normalized,
    textTerms,
    statuses: Array.from(new Set(statuses)),
    prices,
    areas,
    requiredFeatures: Array.from(new Set(requiredFeatures))
  };
}

export function matchesBrokerRoomSmartSearch(room: BrokerInventoryRoom, parsed: BrokerRoomSearchQuery) {
  if (!parsed.normalized) {
    return true;
  }

  if (
    parsed.statuses.length > 0 &&
    (room.status !== "available" && room.status !== "coming_soon" || !parsed.statuses.includes(room.status))
  ) {
    return false;
  }

  if (parsed.prices.length > 0) {
    const priceMatch = parsed.prices.some(
      (price) => Math.abs(room.rent_price - price.value) <= price.tolerance
    );

    if (!priceMatch) {
      return false;
    }
  }

  const area = numberValue(room.area_m2);
  for (const areaIntent of parsed.areas) {
    if (area === null) {
      return false;
    }

    if (areaIntent.operator === "min" && area < areaIntent.value) {
      return false;
    }

    if (areaIntent.operator === "max" && area > areaIntent.value) {
      return false;
    }

    if (areaIntent.operator === "around" && Math.abs(area - areaIntent.value) > 3) {
      return false;
    }
  }

  for (const feature of parsed.requiredFeatures) {
    if (!room.features?.[feature]) {
      return false;
    }
  }

  const haystack = normalizeBrokerSearchText(
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
      room.building.city,
      room.landlord?.full_name,
      room.landlord?.phone,
      room.status,
      roomStatusLabels[room.status]
    ].join(" ")
  );

  return parsed.textTerms.every((term) => haystack.includes(term));
}

function parsePriceIntents(normalized: string) {
  const prices: PriceIntent[] = [];
  const millionPattern = /(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)\b/g;
  const plainPattern = /\b([1-9]\d{5,8})\b/g;

  for (const match of normalized.matchAll(millionPattern)) {
    const value = Number(match[1].replace(",", ".")) * 1_000_000;
    if (Number.isFinite(value)) {
      prices.push({ value, tolerance: 500_000 });
    }
  }

  for (const match of normalized.matchAll(plainPattern)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) {
      prices.push({ value, tolerance: value >= 1_000_000 ? 500_000 : 100_000 });
    }
  }

  return prices;
}

function parseAreaIntents(normalized: string) {
  const areas: AreaIntent[] = [];
  const pattern = /\b(tren|duoi)?\s*(\d+(?:[.,]\d+)?)\s*m2\b/g;

  for (const match of normalized.matchAll(pattern)) {
    const value = Number(match[2].replace(",", "."));
    if (!Number.isFinite(value)) {
      continue;
    }

    areas.push({
      operator: match[1] === "tren" ? "min" : match[1] === "duoi" ? "max" : "around",
      value
    });
  }

  return areas;
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
