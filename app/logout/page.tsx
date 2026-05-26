import { logoutAction } from "@/app/(auth)/actions";

export default function LogoutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form action={logoutAction} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Đăng xuất</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Bấm nút bên dưới để thoát khỏi tài khoản hiện tại.
        </p>
        <button
          className="mt-5 h-12 w-full rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Đăng xuất
        </button>
      </form>
    </main>
  );
}
