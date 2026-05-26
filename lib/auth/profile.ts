import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/auth/types";
import { getHomePathForProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function syncProfileFromUser(user: User) {
  const supabase = await createClient();
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? user.phone ?? "New user";
  const phone =
    typeof user.user_metadata.phone === "string"
      ? user.user_metadata.phone
      : user.phone ?? null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!existing) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: existing.full_name || fullName,
      phone: existing.phone ?? phone,
      email: existing.email ?? user.email ?? null
    })
    .eq("id", user.id)
    .select("*")
    .single<Profile>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profile = await getProfile(user.id);

  if (!profile) {
    return syncProfileFromUser(user);
  }

  return profile;
}

export async function requireAuthProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status === "pending") {
    redirect("/pending");
  }

  if (profile.status === "blocked") {
    redirect("/blocked");
  }

  return profile;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await requireAuthProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect(getHomePathForProfile(profile));
  }

  return profile;
}
