import type { RoomFeature } from "@/lib/landlord/types";

type RoomFeatureRecord = Omit<RoomFeature, "id" | "room_id">;

export type RoomFeatureKey = keyof RoomFeatureRecord;
export type RoomFeatureFlags = Partial<RoomFeatureRecord> | null | undefined;
export type RoomLayoutOption = {
  key: string;
  label: string;
  legacyFeatureKey?: RoomFeatureKey;
};
export type RoomAmenityOption = {
  key: string;
  label: string;
  featureKey: RoomFeatureKey;
};

export const ROOM_LAYOUT_OPTIONS = [
  { key: "studio", label: "Studio" },
  { key: "one_bedroom", label: "01 phòng ngủ" },
  { key: "two_bedroom", label: "02 phòng ngủ" },
  { key: "three_bedroom", label: "03 phòng ngủ" },
  { key: "balcony", label: "Có ban công", legacyFeatureKey: "has_balcony" },
  { key: "window", label: "Có cửa sổ", legacyFeatureKey: "has_window" },
  { key: "loft", label: "Có gác" },
  { key: "duplex", label: "Duplex / thông tầng" },
  { key: "penthouse", label: "Penthouse / áp mái" },
  { key: "corner_room", label: "Phòng góc" },
  { key: "nice_view", label: "Phòng view đẹp" },
  { key: "low_floor", label: "Phòng tầng thấp" },
  { key: "high_floor", label: "Phòng tầng cao" },
  { key: "drying_yard", label: "Có sân phơi" },
  { key: "loggia", label: "Có logia" },
  { key: "private_kitchen", label: "Có bếp riêng", legacyFeatureKey: "has_private_kitchen" },
  { key: "private_bathroom", label: "Có WC riêng", legacyFeatureKey: "has_private_bathroom" }
] as const satisfies readonly RoomLayoutOption[];

export const ROOM_AMENITY_OPTIONS = [
  { key: "washing_machine", label: "Máy giặt", featureKey: "has_washing_machine" },
  { key: "air_conditioner", label: "Máy lạnh", featureKey: "has_air_conditioner" },
  { key: "fridge", label: "Tủ lạnh", featureKey: "has_fridge" },
  { key: "bed", label: "Giường", featureKey: "has_bed" },
  { key: "wardrobe", label: "Tủ đồ", featureKey: "has_wardrobe" },
  { key: "elevator", label: "Thang máy", featureKey: "has_elevator" },
  { key: "furnished", label: "Full nội thất", featureKey: "is_furnished" },
  { key: "parking", label: "Có chỗ để xe", featureKey: "has_parking" },
  { key: "security", label: "Bảo vệ", featureKey: "has_security" },
  { key: "pet_allowed", label: "Cho nuôi pet", featureKey: "allows_pet" }
] as const satisfies readonly RoomAmenityOption[];

export type RoomLayoutKey = (typeof ROOM_LAYOUT_OPTIONS)[number]["key"];
export type RoomLayoutLabel = (typeof ROOM_LAYOUT_OPTIONS)[number]["label"];
export type RoomAmenityKey = (typeof ROOM_AMENITY_OPTIONS)[number]["key"];
export type RoomAmenityLabel = (typeof ROOM_AMENITY_OPTIONS)[number]["label"];

const ROOM_LAYOUT_ORDER = new Map<string, number>(
  ROOM_LAYOUT_OPTIONS.map(({ key }, index) => [key, index])
);
const ROOM_LAYOUT_KEY_SET = new Set<string>(ROOM_LAYOUT_OPTIONS.map(({ key }) => key));
const ROOM_LAYOUT_KEY_TO_LABEL = new Map<string, RoomLayoutLabel>(
  ROOM_LAYOUT_OPTIONS.map(({ key, label }) => [key, label])
);

const LEGACY_ROOM_LAYOUT_OPTIONS = ROOM_LAYOUT_OPTIONS.filter(
  (
    option
  ): option is (typeof ROOM_LAYOUT_OPTIONS)[number] & {
    legacyFeatureKey: RoomFeatureKey;
  } => "legacyFeatureKey" in option && typeof option.legacyFeatureKey === "string"
);

const LEGACY_ROOM_LAYOUT_KEY_SET = new Set<string>(
  LEGACY_ROOM_LAYOUT_OPTIONS.map(({ key }) => key)
);

const ROOM_LAYOUT_ALIASES = new Map<string, RoomLayoutKey>();
const ROOM_AMENITY_ALIASES = new Map<string, RoomAmenityKey>();

for (const option of ROOM_LAYOUT_OPTIONS) {
  ROOM_LAYOUT_ALIASES.set(normalizeAliasKey(option.key), option.key);
  ROOM_LAYOUT_ALIASES.set(normalizeAliasKey(option.label), option.key);
}

for (const option of ROOM_AMENITY_OPTIONS) {
  ROOM_AMENITY_ALIASES.set(normalizeAliasKey(option.key), option.key);
  ROOM_AMENITY_ALIASES.set(normalizeAliasKey(option.label), option.key);
  ROOM_AMENITY_ALIASES.set(normalizeAliasKey(option.featureKey), option.key);
}

registerRoomLayoutAlias("1 phòng ngủ", "one_bedroom");
registerRoomLayoutAlias("2 phòng ngủ", "two_bedroom");
registerRoomLayoutAlias("3 phòng ngủ", "three_bedroom");
registerRoomLayoutAlias("ban công", "balcony");
registerRoomLayoutAlias("cửa sổ", "window");
registerRoomLayoutAlias("bếp riêng", "private_kitchen");
registerRoomLayoutAlias("wc riêng", "private_bathroom");
registerRoomLayoutAlias("nhà vệ sinh riêng", "private_bathroom");

registerRoomAmenityAlias("pets_allowed", "pet_allowed");
registerRoomAmenityAlias("allows_pet", "pet_allowed");
registerRoomAmenityAlias("fully_furnished", "furnished");
registerRoomAmenityAlias("is_furnished", "furnished");

function registerRoomLayoutAlias(alias: string, key: RoomLayoutKey) {
  ROOM_LAYOUT_ALIASES.set(normalizeAliasKey(alias), key);
}

function registerRoomAmenityAlias(alias: string, key: RoomAmenityKey) {
  ROOM_AMENITY_ALIASES.set(normalizeAliasKey(alias), key);
}

function cleanValue(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAliasKey(value: string) {
  return cleanValue(value).toLocaleLowerCase("vi");
}

function normalizeRoomLayoutValue(value: string | null | undefined) {
  const canonical = ROOM_LAYOUT_ALIASES.get(normalizeAliasKey(cleanValue(value)));
  return canonical && ROOM_LAYOUT_KEY_SET.has(canonical) ? canonical : null;
}

function normalizeRoomAmenityValue(value: string | null | undefined) {
  return ROOM_AMENITY_ALIASES.get(normalizeAliasKey(cleanValue(value))) ?? null;
}

export function normalizeRoomLayoutValues(
  values: Array<string | null | undefined> | null | undefined
) {
  const uniqueKeys = Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeRoomLayoutValue(value))
        .filter((value): value is RoomLayoutKey => value !== null)
    )
  );

  return uniqueKeys.sort((left, right) => {
    const leftOrder = ROOM_LAYOUT_ORDER.get(left);
    const rightOrder = ROOM_LAYOUT_ORDER.get(right);

    if (leftOrder !== undefined && rightOrder !== undefined) {
      return leftOrder - rightOrder;
    }

    if (leftOrder !== undefined) {
      return -1;
    }

    if (rightOrder !== undefined) {
      return 1;
    }

    return left.localeCompare(right, "vi");
  });
}

export const normalizeRoomLayouts = normalizeRoomLayoutValues;

export function formatRoomLayoutLabels(values: Array<string | null | undefined> | null | undefined) {
  return normalizeRoomLayoutValues(values).map((key) => ROOM_LAYOUT_KEY_TO_LABEL.get(key) ?? key);
}

export function getLegacyLayoutKeysFromFeatures(features: RoomFeatureFlags) {
  if (!features) {
    return [];
  }

  return LEGACY_ROOM_LAYOUT_OPTIONS.filter((option) => Boolean(features[option.legacyFeatureKey])).map(
    (option) => option.key
  );
}

export function getLegacyRoomLayoutValues(features: RoomFeatureFlags) {
  return formatRoomLayoutLabels(getLegacyLayoutKeysFromFeatures(features));
}

export function getLegacyRoomLayoutFeatureFlags(
  roomLayouts: Array<string> | null | undefined
): Partial<Record<RoomFeatureKey, boolean>> {
  const selectedLayouts = new Set(normalizeRoomLayoutValues(roomLayouts));

  return LEGACY_ROOM_LAYOUT_OPTIONS.reduce<Partial<Record<RoomFeatureKey, boolean>>>(
    (flags, option) => ({
      ...flags,
      [option.legacyFeatureKey]: selectedLayouts.has(option.key)
    }),
    {}
  );
}

export function getEffectiveRoomLayoutKeys(
  roomLayouts: Array<string> | null | undefined,
  features: RoomFeatureFlags
) {
  return normalizeRoomLayoutValues([
    ...normalizeRoomLayoutValues(roomLayouts),
    ...getLegacyLayoutKeysFromFeatures(features)
  ]);
}

export function getEffectiveRoomLayoutValues(
  roomLayouts: Array<string> | null | undefined,
  features: RoomFeatureFlags
) {
  return formatRoomLayoutLabels(getEffectiveRoomLayoutKeys(roomLayouts, features));
}

export function getRoomLayoutSummaryText(
  roomLayouts: Array<string> | null | undefined,
  features: RoomFeatureFlags
) {
  const values = getEffectiveRoomLayoutValues(roomLayouts, features);

  if (values.length === 0) {
    return "Chưa nhập";
  }

  if (values.length <= 2) {
    return values.join(" · ");
  }

  return `${values.slice(0, 2).join(" · ")} +${values.length - 2}`;
}

export function hasNonLegacyRoomLayoutValues(roomLayouts: Array<string> | null | undefined) {
  return normalizeRoomLayoutValues(roomLayouts).some((key) => !LEGACY_ROOM_LAYOUT_KEY_SET.has(key));
}

export function hasRoomLayoutValue(
  roomLayouts: Array<string> | null | undefined,
  label: RoomLayoutLabel
) {
  const key = normalizeRoomLayoutValue(label);
  return key ? normalizeRoomLayoutValues(roomLayouts).includes(key) : false;
}

export function parseRoomLayoutsFromFormData(formData: FormData) {
  return normalizeRoomLayoutValues(
    formData
      .getAll("room_layouts")
      .filter((value): value is string => typeof value === "string")
  );
}

export function normalizeRoomAmenityValues(
  values: Array<string | null | undefined> | null | undefined
) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => normalizeRoomAmenityValue(value))
        .filter((value): value is RoomAmenityKey => value !== null)
    )
  );
}

export const normalizeRoomAmenities = normalizeRoomAmenityValues;

export function formatRoomAmenityLabels(values: Array<string | null | undefined> | null | undefined) {
  const labelByKey = new Map<string, RoomAmenityLabel>(
    ROOM_AMENITY_OPTIONS.map(({ key, label }) => [key, label])
  );

  return normalizeRoomAmenityValues(values).map((key) => labelByKey.get(key) ?? key);
}

export function getAmenityKeysFromFeatures(features: RoomFeatureFlags) {
  if (!features) {
    return [];
  }

  return ROOM_AMENITY_OPTIONS.filter((option) => Boolean(features[option.featureKey])).map(
    (option) => option.key
  );
}

export function getRoomAmenityLabels(features: RoomFeatureFlags) {
  return formatRoomAmenityLabels(getAmenityKeysFromFeatures(features));
}
