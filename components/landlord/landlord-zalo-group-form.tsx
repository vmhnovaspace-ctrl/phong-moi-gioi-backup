"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateLandlordZaloGroupAction } from "@/app/landlord/actions";
import type { LandlordFormState } from "@/lib/landlord/types";

type LandlordZaloGroupFormProps = {
  groupName?: string | null;
  groupUrl?: string | null;
};

export function LandlordZaloGroupForm({ groupName, groupUrl }: LandlordZaloGroupFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!groupUrl);
  const [state, formAction] = useActionState(
    updateLandlordZaloGroupAction,
    {} satisfies LandlordFormState
  );

  useEffect(() => {
    if (state.message) {
      router.refresh();
      setIsEditing(false);
    }
  }, [router, state.message]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" id="nhom-zalo-tong">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Nhóm Zalo tổng</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Dùng khi bạn có một nhóm Zalo chung cho tất cả căn nhà.
          </p>
          {groupUrl ? (
            <p className="mt-2 text-sm font-medium text-[#0F5FD7]">
              {groupName ? `Đã lưu nhóm Zalo tổng: ${groupName}` : "Đã lưu nhóm Zalo tổng"}
            </p>
          ) : null}
        </div>
        {groupUrl && !isEditing ? (
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Sửa
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <form action={formAction} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              className="sm:col-span-2"
              defaultValue={groupUrl ?? ""}
              label="Link nhóm Zalo tổng"
              name="landlord_zalo_group_url"
              type="url"
            />
            <TextField
              className="sm:col-span-2"
              defaultValue={groupName ?? ""}
              label="Tên nhóm Zalo"
              name="landlord_zalo_group_name"
            />
          </div>

          {state.error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          {state.message ? (
            <p className="mt-3 rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-sm text-[#047857]">
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <SubmitButton />
            {groupUrl ? (
              <button
                className="mt-4 inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                Hủy
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
      disabled={pending}
      type="submit"
    >
      {pending ? "Đang lưu..." : "Lưu nhóm Zalo tổng"}
    </button>
  );
}

function TextField({
  className = "",
  defaultValue,
  label,
  name,
  type = "text"
}: {
  className?: string;
  defaultValue?: string | null;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue ?? ""}
        name={name}
        type={type}
      />
    </label>
  );
}
