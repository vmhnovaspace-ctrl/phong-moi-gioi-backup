"use client";

import { useActionState } from "react";
import { verifyForgotPasswordOtpAction } from "@/app/(auth)/actions";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";

export function VerifyOtpForm() {
  const [state, formAction] = useActionState(verifyForgotPasswordOtpAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <FormField
        autoComplete="one-time-code"
        label="Mã OTP"
        name="token"
        placeholder="123456"
        required
        type="text"
      />

      <SubmitButton>Xác nhận OTP</SubmitButton>
    </form>
  );
}
