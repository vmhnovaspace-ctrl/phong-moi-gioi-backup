"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateBuildingZaloGroupAction } from "@/app/landlord/actions";
import type { LandlordFormState } from "@/lib/landlord/types";

type BuildingZaloGroupPanelProps = {
  buildingId: string;
  groupName?: string | null;
  groupUrl?: string | null;
  landlordGroupName?: string | null;
  landlordGroupUrl?: string | null;
};

type BuildingZaloInlineEditorProps = {
  buildingId: string;
  groupName?: string | null;
  groupUrl?: string | null;
  triggerLabel: string;
};

export function BuildingZaloGroupPanel({
  buildingId,
  groupName,
  groupUrl,
  landlordGroupName,
  landlordGroupUrl
}: BuildingZaloGroupPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [usesTotal, setUsesTotal] = useState(false);
  const hasOwnGroup = Boolean(groupUrl);
  const hasTotalGroup = Boolean(landlordGroupUrl);

  return (
    <section
      className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
      id="nhom-zalo-can"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Nhóm Zalo của căn</h2>
          {hasOwnGroup ? (
            <div className="mt-1 space-y-1 text-sm text-slate-600">
              <p>{groupName ? `Đang dùng: ${groupName}` : "Đã lưu link nhóm Zalo riêng."}</p>
              <p className="text-xs font-medium text-[#0F5FD7]">Đã lưu link nhóm</p>
            </div>
          ) : hasTotalGroup ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Căn này chưa có nhóm Zalo riêng. Khi gửi phòng của căn này, hệ thống có thể dùng Nhóm
              Zalo tổng hoặc bạn có thể nhập nhóm riêng cho căn.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Bạn chưa lưu Nhóm Zalo tổng và căn này cũng chưa có nhóm riêng. Hãy nhập nhóm riêng
              cho căn hoặc lưu Nhóm Zalo tổng ở cuối trang Căn nhà.
            </p>
          )}
        </div>

        {hasOwnGroup ? (
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Sửa nhóm Zalo
          </button>
        ) : null}
      </div>

      {!hasOwnGroup && !isEditing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {hasTotalGroup ? (
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 text-sm font-semibold text-[#0B3B82] hover:bg-[#EFF6FF]"
              onClick={() => setUsesTotal(true)}
              type="button"
            >
              Dùng nhóm Zalo tổng
            </button>
          ) : (
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              href="/landlord#nhom-zalo-tong"
            >
              Về mục Nhóm Zalo tổng
            </Link>
          )}
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Nhập nhóm riêng
          </button>
        </div>
      ) : null}

      {usesTotal && !hasOwnGroup && !isEditing ? (
        <p className="mt-3 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#0B3B82]">
          Khi gửi Zalo cho căn này, hệ thống sẽ dùng{" "}
          {landlordGroupName ? `Nhóm Zalo tổng: ${landlordGroupName}` : "Nhóm Zalo tổng đã lưu"}.
        </p>
      ) : null}

      {isEditing ? (
        <BuildingZaloForm
          buildingId={buildingId}
          groupName={groupName}
          groupUrl={groupUrl}
          onCancel={() => setIsEditing(false)}
        />
      ) : null}
    </section>
  );
}

export function BuildingZaloInlineEditor({
  buildingId,
  groupName,
  groupUrl,
  triggerLabel
}: BuildingZaloInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <BuildingZaloForm
          buildingId={buildingId}
          groupName={groupName}
          groupUrl={groupUrl}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      onClick={() => setIsEditing(true)}
      type="button"
    >
      {triggerLabel}
    </button>
  );
}

function BuildingZaloForm({
  buildingId,
  groupName,
  groupUrl,
  onCancel
}: {
  buildingId: string;
  groupName?: string | null;
  groupUrl?: string | null;
  onCancel: () => void;
}) {
  const router = useRouter();
  const updateAction = updateBuildingZaloGroupAction.bind(null, buildingId);
  const [state, formAction] = useActionState(updateAction, {} satisfies LandlordFormState);

  useEffect(() => {
    if (state.message) {
      router.refresh();
      onCancel();
    }
  }, [onCancel, router, state.message]);

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <TextField
        defaultValue={groupUrl ?? ""}
        label="Link nhóm Zalo của căn này"
        name="zalo_group_url"
        type="url"
      />
      <TextField
        defaultValue={groupName ?? ""}
        label="Tên nhóm Zalo"
        name="zalo_group_name"
      />

      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-sm text-[#047857]">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <SaveButton />
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          onClick={onCancel}
          type="button"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
      disabled={pending}
      type="submit"
    >
      {pending ? "Đang lưu..." : "Lưu"}
    </button>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  type = "text"
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue ?? ""}
        name={name}
        type={type}
      />
    </label>
  );
}
