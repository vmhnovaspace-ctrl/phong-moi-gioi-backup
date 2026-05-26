import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { roleLabels, statusLabels } from "@/lib/auth/roles";
import { logoutAction } from "@/app/(auth)/actions";

export default async function PendingPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          {statusLabels.pending}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Tài khoản đang chờ duyệt</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Profile đã được tạo trong Supabase nhưng chưa active. Sau khi admin đổi status thành
          active, hệ thống sẽ tự redirect vào dashboard đúng vai trò.
        </p>

        {profile ? (
          <dl className="mt-5 space-y-2 rounded-md bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Số điện thoại</dt>
              <dd className="font-medium text-slate-900">{profile.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Vai trò</dt>
              <dd className="font-medium text-slate-900">{roleLabels[profile.role]}</dd>
            </div>
          </dl>
        ) : null}

        <div className="mt-5 flex gap-3">
          <Link
            className="flex h-11 flex-1 items-center justify-center rounded-md border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            href="/"
          >
            Kiểm tra lại
          </Link>
          <form action={logoutAction} className="flex-1">
            <button
              className="h-11 w-full rounded-md bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
              type="submit"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
