import { logoutAction } from "@/app/(auth)/actions";

export default function BlockedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Đã khóa</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Tài khoản không thể truy cập</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Tài khoản đang ở trạng thái blocked trong bảng profiles. Vui lòng liên hệ admin vận hành.
        </p>
        <form action={logoutAction} className="mt-5">
          <button
            className="h-11 w-full rounded-md bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
            type="submit"
          >
            Đăng xuất
          </button>
        </form>
      </section>
    </main>
  );
}
