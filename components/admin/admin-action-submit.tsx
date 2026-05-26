"use client";

import { useFormStatus } from "react-dom";

type AdminActionSubmitProps = {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
};

const classes: Record<NonNullable<AdminActionSubmitProps["variant"]>, string> = {
  danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  primary: "border-teal-700 bg-teal-700 text-white hover:bg-teal-800",
  secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
};

export function AdminActionSubmit({
  children,
  pendingText = "Đang lưu...",
  variant = "secondary"
}: AdminActionSubmitProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${classes[variant]}`}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
