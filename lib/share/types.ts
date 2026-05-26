import type {
  BuildingFee,
  FeeMode,
  ImageSourceType,
  RoomFeature,
  RoomFee,
  RoomStatus
} from "@/lib/landlord/types";

export type ShareLandlord = {
  id: string;
  full_name: string;
  public_slug: string;
};

export type ShareImage = {
  id: string;
  image_url: string;
  storage_path: string | null;
  source_type: ImageSourceType;
  image_type: "main" | "room" | "bathroom" | "kitchen" | "balcony" | "building" | "other";
  sort_order: number;
  is_cover: boolean;
  created_at?: string;
};

export type ShareRoom = {
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
  updated_at: string;
  fees: RoomFee | null;
  effective_fees: BuildingFee | RoomFee | null;
  features: RoomFeature | null;
  images: ShareImage[];
};

export type ShareBuilding = {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  ward: string | null;
  district: string | null;
  city: string;
  description: string | null;
  common_amenities: string | null;
  house_rules: string | null;
  building_drive_folder_url: string | null;
  cover_image_url: string | null;
  public_slug: string;
  visibility: "visible" | "hidden";
  updated_at: string;
  building_fees: BuildingFee | null;
  images: ShareImage[];
  rooms: ShareRoom[];
  available_rooms: number;
  coming_soon_rooms: number;
};

export type LandlordSharePageData = {
  landlord: ShareLandlord;
  buildings: ShareBuilding[];
  visible_buildings: number;
  available_rooms: number;
  coming_soon_rooms: number;
  total_sellable_rooms: number;
};

export type BuildingSharePageData = {
  landlord: ShareLandlord | null;
  building: ShareBuilding;
};

export type RoomSharePageData =
  | {
      unavailable: false;
      landlord: ShareLandlord | null;
      building: ShareBuilding;
      room: ShareRoom;
    }
  | {
      unavailable: true;
    };
