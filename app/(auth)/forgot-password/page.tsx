import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Nhập số điện thoại đã đăng ký để nhận mã OTP SMS đặt lại mật khẩu."
      footerHref="/login"
      footerLabel="Quay lại đăng nhập"
      footerText="Đã nhớ mật khẩu?"
      title="Quên mật khẩu"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
