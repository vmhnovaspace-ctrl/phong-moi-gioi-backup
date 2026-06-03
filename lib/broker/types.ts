import type {
  Building,
  BuildingFee,
  FeeMode,
  ImageSourceType,
  Room,
  RoomFee,
  RoomFeature,
  RoomStatus
} from "@/lib/landlord/types";

export type BrokerVisibleRoomStatus = Extract<RoomStatus, "available" | "coming_soon">;
export type BoundaryMode = "old" | "new";
export type BrokerPostChannel = "chotot" | "mogi" | "facebook" | "zalo";
export type RoomCloseRequestStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled";

export type BrokerLandlordContact = {
  id: string;
  full_name: string;
  phone: string | null;
};

export type BrokerRoomBuilding = Pick<
  Building,
  | "id"
  | "name"
  | "address"
  | "ward"
  | "district"
  | "city"
  | "landlord_id"
  | "latitude"
  | "longitude"
  | "formatted_address"
  | "google_place_id"
  | "google_maps_url"
>;

export type BrokerRoomListItem = Pick<
  Room,
  | "id"
  | "cover_image_url"
  | "room_code"
  | "title"
  | "floor"
  | "area_m2"
  | "rent_price"
  | "deposit_amount"
  | "max_people"
  | "status"
  | "available_from"
  | "commission"
  | "min_lease_months"
  | "room_drive_folder_url"
  | "description"
  | "strengths"
  | "weaknesses"
  | "updated_at"
> & {
  building: BrokerRoomBuilding;
  landlord: BrokerLandlordContact | null;
};

export type BrokerRoomThumbnail = {
  id: string;
  image_url: string;
  source_type: ImageSourceType;
  is_cover?: boolean;
  sort_order?: number;
};

export type BrokerInventoryFeatureSummary = Pick<
  RoomFeature,
  | "allows_pet"
  | "has_air_conditioner"
  | "has_balcony"
  | "has_bed"
  | "has_elevator"
  | "has_fridge"
  | "has_washing_machine"
  | "has_parking"
  | "has_private_bathroom"
  | "has_private_kitchen"
  | "has_security"
  | "has_wardrobe"
  | "has_window"
  | "is_furnished"
>;

export type BrokerInventoryRoom = BrokerRoomListItem & {
  features: BrokerInventoryFeatureSummary | null;
  thumbnail: BrokerRoomThumbnail | null;
  close_request?: BrokerRoomCloseRequestState | null;
};

export type BrokerInventoryFilters = {
  q?: string;
  landlord?: string;
  boundaryMode?: BoundaryMode;
  district?: string;
  ward?: string;
  status?: BrokerVisibleRoomStatus | "all";
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: boolean;
  allowsPet?: boolean;
};

export type BrokerInventoryOptions = {
  districts: string[];
  wards: string[];
};

export type BrokerBuildingGroup = {
  building: BrokerRoomBuilding;
  available_rooms: number;
  coming_soon_rooms: number;
  rooms: BrokerInventoryRoom[];
};

export type BrokerLandlordGroup = {
  landlord: BrokerLandlordContact | null;
  total_rooms: number;
  buildings: BrokerBuildingGroup[];
};

export type BrokerInventoryResult = {
  filters: BrokerInventoryFilters;
  options: BrokerInventoryOptions;
  rooms: BrokerInventoryRoom[];
  groups: BrokerLandlordGroup[];
  totalBeforeFilters: number;
};

export type BrokerSavedRoom = BrokerInventoryRoom & {
  saved_at: string;
};

export type BrokerRoomImage = {
  id: string;
  image_url: string;
  source_type: ImageSourceType;
  image_type: "main" | "room" | "bathroom" | "kitchen" | "balcony" | "building" | "other";
  is_cover: boolean;
  sort_order: number;
};

export type BrokerRoomActionState = {
  is_saved: boolean;
  posted_chotot: boolean;
  posted_mogi: boolean;
  posted_facebook: boolean;
  sent_to_customer: boolean;
  customer_note: string | null;
  private_note: string | null;
  updated_at: string;
};

export type BrokerRoomCloseRequestState = {
  id: string;
  room_id: string;
  broker_id: string;
  landlord_id: string;
  status: RoomCloseRequestStatus;
  broker_note: string | null;
  landlord_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  broker_acknowledged_at: string | null;
};

export type BrokerClosedRoomPeriod = "today" | "week" | "month";

export type BrokerClosedRoom = BrokerRoomListItem & {
  close_request: BrokerRoomCloseRequestState & { status: "approved" };
  confirmed_at: string;
};

export type BrokerRoomDetail = BrokerRoomListItem &
  Pick<Room, "description" | "strengths" | "weaknesses" | "max_people" | "public_slug" | "created_at"> & {
    building: BrokerRoomBuilding &
      Pick<
        Building,
        "description" | "common_amenities" | "house_rules" | "building_drive_folder_url"
      >;
    building_fees: BuildingFee | null;
    effective_fees: BuildingFee | RoomFee | null;
    fee_mode: FeeMode;
    fees: RoomFee | null;
    features: RoomFeature | null;
    images: BrokerRoomImage[];
    landlord: BrokerLandlordContact | null;
    action: BrokerRoomActionState | null;
    close_request: BrokerRoomCloseRequestState | null;
  };

export type BrokerActionRoom = BrokerInventoryRoom & {
  action: BrokerRoomActionState;
};

export type BrokerActionRoomSource = "saved" | "recent" | "tracked";

export type BrokerActionWorkspaceRoom = BrokerRoomDetail & {
  action_sources: BrokerActionRoomSource[];
};

export type RoomReportType = "rented" | "wrong_price" | "wrong_images" | "wrong_info" | "other";

export type RoomReport = {
  id: string;
  room_id: string;
  broker_id: string;
  report_type: RoomReportType;
  message: string | null;
  status: "open" | "reviewing" | "resolved" | "rejected";
  created_at: string;
};

export type BrokerDashboard = {
  available_rooms: number;
  coming_soon_rooms: number;
  customer_interest_events: CustomerRoomPackageEvent[];
  recent_rooms: BrokerRoomListItem[];
  saved_rooms: BrokerSavedRoom[];
  total_visible_rooms: number;
  unread_customer_interest_count: number;
};

export type CustomerRoomPackageSummary = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_zalo_link: string | null;
  customer_need: string;
  title: string;
  public_slug: string;
  status: "active" | "hidden";
  created_at: string;
  updated_at: string;
  room_count: number;
};

export type CustomerRoomPackageEvent = {
  id: string;
  package_id: string;
  package_public_slug: string;
  room_id: string;
  broker_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_zalo_link: string | null;
  customer_need: string | null;
  room_code: string | null;
  room_name: string | null;
  house_address: string | null;
  action_type: "customer_interested_room";
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type BrokerSendToCustomerData = {
  customer_interest_events: CustomerRoomPackageEvent[];
  packages: CustomerRoomPackageSummary[];
  rooms: BrokerInventoryRoom[];
  unread_customer_interest_count: number;
};

export type PublicPackageFeatureSet = Partial<Omit<RoomFeature, "id" | "room_id">>;

export type PublicPackageImage = {
  id: string;
  image_url: string;
  storage_path: string | null;
  source_type: ImageSourceType;
  image_type: "main" | "room" | "bathroom" | "kitchen" | "balcony" | "building" | "other";
  is_cover: boolean;
  sort_order: number;
};

export type PublicPackageRoom = {
  id: string;
  title: string | null;
  area_m2: number | string | null;
  rent_price: number;
  deposit_amount: number | null;
  max_people: number | null;
  description: string | null;
  strengths: string | null;
  room_drive_folder_url: string | null;
  building_drive_folder_url: string | null;
  cover_image_url: string | null;
  location: string;
  features: PublicPackageFeatureSet | null;
  images: PublicPackageImage[];
};

export type PublicCustomerRoomPackage = {
  id: string;
  customer_name: string | null;
  customer_need: string;
  title: string;
  public_slug: string;
  created_at: string;
  rooms: PublicPackageRoom[];
};
