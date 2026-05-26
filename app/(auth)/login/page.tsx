import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/app/(auth)/login/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      description="Đăng nhập bằng số điện thoại và mật khẩu để vào đúng dashboard theo vai trò."
      footerHref="/register"
      footerLabel="Tạo tài khoản"
      footerText="Chưa có tài khoản?"
      title="Đăng nhập"
    >
      <LoginForm message={params.message} />
    </AuthShell>
  );
}
