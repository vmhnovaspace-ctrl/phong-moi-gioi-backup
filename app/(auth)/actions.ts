"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthState, UserRole } from "@/lib/auth/types";
import { getHomePathForProfile } from "@/lib/auth/roles";
import { getCurrentProfile, getProfile, syncProfileFromUser } from "@/lib/auth/profile";
import { normalizeVietnamPhone } from "@/lib/auth/phone";
import { createClient } from "@/lib/supabase/server";
import { isAssignablePublicRole } from "@/lib/auth/roles";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getRedirectPath(role: UserRole, status: "pending" | "active" | "blocked") {
  return getHomePathForProfile({
    role,
    status
  });
}

function getSafeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "";
  }

  if (value.startsWith("/login") || value.startsWith("/register")) {
    return "";
  }

  return value;
}

export async function loginAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phoneInput = getString(formData, "phone");
  const password = getString(formData, "password");
  const nextPath = getSafeNextPath(getString(formData, "next"));
  let phone: string;

  try {
    phone = normalizeVietnamPhone(phoneInput);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Số điện thoại không hợp lệ." };
  }

  if (!password) {
    return { error: "Vui lòng nhập mật khẩu." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    phone,
    password
  });

  if (error || !data.user) {
    return { error: "Số điện thoại hoặc mật khẩu không đúng." };
  }

  const profile =
    (await getProfile(data.user.id)) ?? (await syncProfileFromUser(data.user));

  if (!profile) {
    return {
      error:
        "Tài khoản đã đăng nhập nhưng chưa có profile. Kiểm tra trigger handle_new_user trong Supabase."
    };
  }

  redirect(profile.status === "active" && nextPath ? nextPath : getRedirectPath(profile.role, profile.status));
}

export async function registerAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const fullName = getString(formData, "full_name");
  const phoneInput = getString(formData, "phone");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirm_password");
  const nextPath = getSafeNextPath(getString(formData, "next"));
  const roleInput = getString(formData, "role").toLowerCase();
  const role = isAssignablePublicRole(roleInput) ? roleInput : "broker";
  let phone: string;

  if (!fullName || !phoneInput || !password || !confirmPassword) {
    return { error: "Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu." };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  if (password !== confirmPassword) {
    return { error: "Mật khẩu nhập lại không khớp." };
  }

  try {
    phone = normalizeVietnamPhone(phoneInput);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Số điện thoại không hợp lệ." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      channel: "sms",
      data: {
        full_name: fullName,
        phone,
        role
      }
    }
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "Số điện thoại này đã được đăng ký." };
    }

    return { error: error.message };
  }

  if (!data.session || !data.user) {
    redirect("/pending");
  }

  const profile =
    (await getProfile(data.user.id)) ?? (await syncProfileFromUser(data.user));

  const redirectRole = profile?.role ?? role;
  const redirectStatus = profile?.status ?? "pending";

  redirect(redirectStatus === "active" && nextPath ? nextPath : getRedirectPath(redirectRole, redirectStatus));
}

export async function forgotPasswordAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const phoneInput = getString(formData, "phone");
  let phone: string;

  try {
    phone = normalizeVietnamPhone(phoneInput);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Số điện thoại không hợp lệ." };
  }

  const supabase = await createClient();
  const { data: exists, error: lookupError } = await supabase.rpc(
    "profile_exists_by_phone",
    { target_phone: phone }
  );

  if (lookupError) {
    return {
      error:
        "Chưa thể kiểm tra số điện thoại. Hãy chạy migration phone password auth trong Supabase."
    };
  }

  if (!exists) {
    return { error: "Không tìm thấy tài khoản với số điện thoại này." };
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone
  });

  if (error) {
    return { error: error.message || "Không gửi được mã OTP. Vui lòng thử lại." };
  }

  const cookieStore = await cookies();
  cookieStore.set("forgot_password_phone", phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    path: "/"
  });

  redirect("/forgot-password/verify");
}

export async function verifyForgotPasswordOtpAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = getString(formData, "token");
  const cookieStore = await cookies();
  const phone = cookieStore.get("forgot_password_phone")?.value;

  if (!phone) {
    return { error: "Phiên đặt lại mật khẩu đã hết hạn. Vui lòng nhập lại số điện thoại." };
  }

  if (!token) {
    return { error: "Vui lòng nhập mã OTP." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms"
  });

  if (error) {
    return { error: "Mã OTP không đúng hoặc đã hết hạn." };
  }

  redirect("/reset-password");
}

export async function resetPasswordAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const newPassword = getString(formData, "new_password");
  const confirmNewPassword = getString(formData, "confirm_new_password");

  if (newPassword.length < 6) {
    return { error: "Mật khẩu tối thiểu 6 ký tự." };
  }

  if (newPassword !== confirmNewPassword) {
    return { error: "Mật khẩu nhập lại không khớp." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return { error: error.message || "Không thể đổi mật khẩu." };
  }

  const cookieStore = await cookies();
  cookieStore.delete("forgot_password_phone");
  await supabase.auth.signOut();

  redirect("/login?message=password-reset-success");
}

export async function changePasswordAction(
  _previousState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const currentPassword = getString(formData, "current_password");
  const newPassword = getString(formData, "new_password");
  const confirmNewPassword = getString(formData, "confirm_new_password");

  if (!currentPassword) {
    return { error: "Vui lòng nhập mật khẩu hiện tại." };
  }

  if (newPassword.length < 6) {
    return { error: "Mật khẩu tối thiểu 6 ký tự." };
  }

  if (newPassword !== confirmNewPassword) {
    return { error: "Mật khẩu nhập lại không khớp." };
  }

  const profile = await getCurrentProfile();

  if (!profile?.phone) {
    return { error: "Tài khoản chưa có số điện thoại để xác thực mật khẩu hiện tại." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    phone: profile.phone,
    password: currentPassword
  });

  if (signInError) {
    return { error: "Mật khẩu hiện tại không đúng." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return { error: error.message || "Không thể đổi mật khẩu." };
  }

  return { message: "Đổi mật khẩu thành công." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
