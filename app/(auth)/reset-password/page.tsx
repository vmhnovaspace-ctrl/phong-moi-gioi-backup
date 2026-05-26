import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      description="Đặt mật khẩu mới cho tài khoản số điện thoại của bạn."
      footerHref="/login"
      footerLabel="Quay lại đăng nhập"
      footerText="Không cần đổi mật khẩu?"
      title="Đặt mật khẩu mới"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
