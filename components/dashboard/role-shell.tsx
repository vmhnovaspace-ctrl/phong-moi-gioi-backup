import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { RoleNav, type RoleNavItem } from "@/components/dashboard/role-nav";
import { roleLabels, statusLabels } from "@/lib/auth/roles";
import type { Profile } from "@/lib/auth/types";

type RoleShellProps = {
  profile: Profile;
  title: string;
  description: string;
  navItems: RoleNavItem[];
  children: React.ReactNode;
};

export function RoleShell({
  children,
  description,
  navItems,
  profile,
  title
}: RoleShellProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0F5FD7]">Kho Phòng Realtime</p>
            <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">{title}</h1>
            <p className="mt-1 text-sm leading-6 text-[#334155]">{description}</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:min-w-72">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{profile.full_name}</p>
              <p className="text-xs text-[#64748B]">
                {roleLabels[profile.role]} · {statusLabels[profile.status]}
                {profile.phone ? ` · ${profile.phone}` : ""}
              </p>
            </div>
            <Link
              aria-label="Đổi mật khẩu"
              className="flex size-11 items-center justify-center rounded-xl border border-[#D8E2F0] bg-white text-[#334155] hover:bg-[#EFF6FF] hover:text-[#0F5FD7]"
              href="/account/change-password"
            >
              <KeyRound className="size-4" aria-hidden />
            </Link>
            <form action={logoutAction}>
              <button
                aria-label="Đăng xuất"
                className="flex size-11 items-center justify-center rounded-xl border border-[#D8E2F0] bg-white text-[#334155] hover:bg-[#EFF6FF] hover:text-[#0F5FD7]"
                type="submit"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>

        <RoleNav items={navItems} />
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}
