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
  created_at: string;
  updated_at: string;
};

export type AuthState = {
  error?: string;
  message?: string;
};
