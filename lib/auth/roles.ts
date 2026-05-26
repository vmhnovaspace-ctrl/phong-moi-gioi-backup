import type { Profile, UserRole, UserStatus } from "@/lib/auth/types";

export const roleHomePath: Record<UserRole, string> = {
  admin: "/admin",
  broker: "/broker",
  landlord: "/landlord"
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  broker: "Môi giới",
  landlord: "Chủ nhà"
};

export const statusLabels: Record<UserStatus, string> = {
  active: "Đang hoạt động",
  blocked: "Đã khóa",
  pending: "Chờ duyệt"
};

export function getHomePathForProfile(profile: Pick<Profile, "role" | "status">) {
  if (profile.status === "blocked") {
    return "/blocked";
  }

  if (profile.status === "pending") {
    return "/pending";
  }

  return roleHomePath[profile.role];
}

export function isAssignablePublicRole(role: string): role is Exclude<UserRole, "admin"> {
  return role === "landlord" || role === "broker";
}
