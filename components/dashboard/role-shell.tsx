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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Kho Phòng Realtime</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">{title}</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 sm:min-w-72">
            <div>
              <p className="text-sm font-semibold text-slate-950">{profile.full_name}</p>
              <p className="text-xs text-slate-500">
                {roleLabels[profile.role]} · {statusLabels[profile.status]}
                {profile.phone ? ` · ${profile.phone}` : ""}
              </p>
            </div>
            <Link
              aria-label="Đổi mật khẩu"
              className="flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              href="/account/change-password"
            >
              <KeyRound className="size-4" aria-hidden />
            </Link>
            <form action={logoutAction}>
              <button
                aria-label="Đăng xuất"
                className="flex size-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
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
