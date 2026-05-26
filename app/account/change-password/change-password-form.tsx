"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </div>
      ) : null}

      <FormField
        autoComplete="current-password"
        label="Mật khẩu hiện tại"
        name="current_password"
        required
        type="password"
      />
      <FormField
        autoComplete="new-password"
        label="Mật khẩu mới"
        minLength={6}
        name="new_password"
        required
        type="password"
      />
      <FormField
        autoComplete="new-password"
        label="Nhập lại mật khẩu mới"
        minLength={6}
        name="confirm_new_password"
        required
        type="password"
      />

      <SubmitButton>Đổi mật khẩu</SubmitButton>
    </form>
  );
}
