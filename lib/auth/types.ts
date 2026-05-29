export type UserRole = "admin" | "landlord" | "broker";
export type UserStatus = "pending" | "active" | "blocked";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url: string | null;
  public_slug: string;
  landlord_zalo_group_url: string | null;
  landlord_zalo_group_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthState = {
  error?: string;
  message?: string;
};
