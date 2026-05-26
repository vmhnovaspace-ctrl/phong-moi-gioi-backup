import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/app/(auth)/register/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      description="Tạo tài khoản bằng số điện thoại. Admin không đăng ký công khai để tránh tự cấp quyền."
      footerHref="/login"
      footerLabel="Đăng nhập"
      footerText="Đã có tài khoản?"
      title="Đăng ký"
    >
      <RegisterForm />
    </AuthShell>
  );
}
