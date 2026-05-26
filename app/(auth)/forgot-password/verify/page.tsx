import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyOtpForm } from "@/app/(auth)/forgot-password/verify/verify-otp-form";

export default function VerifyForgotPasswordPage() {
  return (
    <AuthShell
      description="Nhập mã OTP SMS vừa được gửi tới số điện thoại của bạn."
      footerHref="/forgot-password"
      footerLabel="Gửi lại OTP"
      footerText="Chưa nhận được mã?"
      title="Xác nhận OTP"
    >
      <VerifyOtpForm />
    </AuthShell>
  );
}
