"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <FormField
        autoComplete="name"
        label="Họ tên"
        name="full_name"
        placeholder="Nguyễn Văn A"
        required
      />
      <FormField
        autoComplete="tel"
        label="Số điện thoại"
        name="phone"
        placeholder="0912345678"
        required
        type="tel"
      />
      <FormField
        autoComplete="new-password"
        label="Mật khẩu"
        minLength={6}
        name="password"
        required
        type="password"
      />
      <FormField
        autoComplete="new-password"
        label="Nhập lại mật khẩu"
        minLength={6}
        name="confirm_password"
        required
        type="password"
      />

      <label className="block">
        <span className="text-sm font-medium text-slate-800">Vai trò</span>
        <select
          className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue="broker"
          name="role"
        >
          <option value="broker">Môi giới</option>
          <option value="landlord">Chủ nhà</option>
        </select>
      </label>

      <p className="text-xs leading-5 text-slate-500">
        Tài khoản mới sẽ ở trạng thái chờ duyệt. Hệ thống không hiển thị email nội bộ cho người dùng.
      </p>

      <SubmitButton>Đăng ký</SubmitButton>
    </form>
  );
}
