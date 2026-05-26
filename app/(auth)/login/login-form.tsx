"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

type LoginFormProps = {
  message?: string;
};

export function LoginForm({ message }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {message === "password-reset-success" ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Đổi mật khẩu thành công, vui lòng đăng nhập lại.
        </div>
      ) : null}

      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <FormField
        autoComplete="tel"
        label="Số điện thoại"
        name="phone"
        placeholder="0912345678"
        required
        type="tel"
      />
      <FormField
        autoComplete="current-password"
        label="Mật khẩu"
        name="password"
        required
        type="password"
      />

      <SubmitButton>Đăng nhập</SubmitButton>

      <div className="text-right">
        <Link className="text-sm font-semibold text-teal-700 hover:text-teal-900" href="/forgot-password">
          Quên mật khẩu?
        </Link>
      </div>
    </form>
  );
}
