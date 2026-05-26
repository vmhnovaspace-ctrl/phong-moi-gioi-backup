import { ChangePasswordForm } from "@/app/account/change-password/change-password-form";
import { ModuleCard } from "@/components/dashboard/module-card";
import { requireAuthProfile } from "@/lib/auth/profile";

export default async function ChangePasswordPage() {
  await requireAuthProfile();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <ModuleCard
          description="Nhập mật khẩu hiện tại để xác thực, sau đó đặt mật khẩu mới cho tài khoản số điện thoại."
          title="Đổi mật khẩu"
        >
          <ChangePasswordForm />
        </ModuleCard>
      </div>
    </main>
  );
}
