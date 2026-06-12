import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/app/(auth)/register/register-form";

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      description="Tạo tài khoản bằng số điện thoại. Admin không đăng ký công khai để tránh tự cấp quyền."
      footerHref={params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login"}
      footerLabel="Đăng nhập"
      footerText="Đã có tài khoản?"
      title="Đăng ký"
    >
      <RegisterForm nextPath={params.next} />
    </AuthShell>
  );
}
