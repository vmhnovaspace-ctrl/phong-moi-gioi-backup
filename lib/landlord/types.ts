export type RoomStatus =
  | "available"
  | "coming_soon"
  | "reserved"
  | "rented"
  | "hidden";

export type FeeMode = "building_default" | "room_override";

export type ImageSourceType = "uploaded" | "google_drive_link" | "external_url";

export type Building = {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  ward: string | null;
  district: string | null;
  city: string;
  latitude: number | string | null;
  longitude: number | string | null;
  formatted_address: string | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  description: string | null;
  common_amenities: string | null;
  house_rules: string | null;
  building_drive_folder_url: string | null;
  cover_image_url: string | null;
  public_slug: string;
  visibility: "visible" | "hidden";
  created_at: string;
  updated_at: string;
};

export type Room = {
  id: string;
  building_id: string;
  room_code: string;
  title: string | null;
  floor: string | null;
  area_m2: number | string | null;
  rent_price: number;
  deposit_amount: number | null;
  max_people: number | null;
  status: RoomStatus;
  available_from: string | null;
  commission: string | null;
  min_lease_months: number | null;
  fee_mode: FeeMode;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  room_drive_folder_url: string | null;
  cover_image_url: string | null;
  public_slug: string;
  visibility: "visible" | "hidden";
  created_at: string;
  updated_at: string;
};

export type FeeFields = {
  electricity_price: string | null;
  electricity_unit: string;
  water_price: string | null;
  water_unit: string;
  bicycle_parking_fee: string | null;
  motorbike_parking_fee: string | null;
  car_parking_fee: string | null;
  service_fee: string | null;
  internet_fee: string | null;
  management_fee: string | null;
  other_fees: string | null;
};

export type BuildingFee = FeeFields & {
  id?: string;
  building_id: string;
};

export type RoomFee = FeeFields & {
  id?: string;
  room_id: string;
  parking_fee?: string | null;
};

export type RoomFeature = {
  id?: string;
  room_id: string;
  has_window: boolean;
  has_balcony: boolean;
  has_private_bathroom: boolean;
  has_private_kitchen: boolean;
  has_washing_machine: boolean;
  has_elevator: boolean;
  has_air_conditioner: boolean;
  has_fridge: boolean;
  has_bed: boolean;
  has_wardrobe: boolean;
  allows_pet: boolean;
  is_furnished: boolean;
  has_parking: boolean;
  has_security: boolean;
};

export type RoomImage = {
  id: string;
  room_id: string;
  image_url: string;
  storage_path: string | null;
  source_type: ImageSourceType;
  image_type: "main" | "room" | "bathroom" | "kitchen" | "balcony" | "building" | "other";
  sort_order: number;
  is_cover: boolean;
  created_at: string;
};

export type BuildingSummary = Building & {
  total_rooms: number;
  available_rooms: number;
  coming_soon_rooms: number;
};

export type RoomListItem = Room & {
  image_count: number;
};

export type RoomWithBuilding = Room & {
  building: Pick<
    Building,
    | "id"
    | "landlord_id"
    | "name"
    | "address"
    | "ward"
    | "district"
    | "city"
    | "building_drive_folder_url"
  >;
  building_fees: BuildingFee | null;
  effective_fees: BuildingFee | RoomFee | null;
  fees: RoomFee | null;
  features: RoomFeature | null;
  images: RoomImage[];
};

export type BuildingDetail = BuildingSummary & {
  building_fees: BuildingFee | null;
  rooms: RoomListItem[];
  rented_rooms: number;
};

export type SellListGroup = {
  building: Building;
  rooms: RoomWithBuilding[];
};

export type LandlordFormState = {
  error?: string;
  message?: string;
};
