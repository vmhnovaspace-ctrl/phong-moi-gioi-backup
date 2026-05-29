"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { duplicateRoomAction } from "@/app/landlord/actions";
import { roomStatusOptions } from "@/lib/landlord/format";
import type { LandlordFormState, RoomWithBuilding } from "@/lib/landlord/types";

export function DuplicateRoomForm({ room }: { room: RoomWithBuilding }) {
  const [state, formAction] = useActionState(
    duplicateRoomAction.bind(null, room.id),
    {} satisfies LandlordFormState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-950">Sao chép từ phòng {room.room_code}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Nhập một hoặc nhiều mã phòng mới, cách nhau bằng dấu phẩy hoặc xuống dòng.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-800">Mã phòng cần tạo</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
          name="room_codes"
          placeholder="101, 201, 301"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-800">Trạng thái mặc định</span>
        <select
          className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
          defaultValue="hidden"
          name="new_status"
        >
          {roomStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Check name="copy_price">Giữ nguyên giá thuê</Check>
        <Check name="copy_deposit">Giữ nguyên tiền cọc</Check>
        <Check name="copy_area">Giữ nguyên diện tích</Check>
        <Check name="copy_features">Giữ nguyên tiện ích</Check>
        <Check name="copy_fees">Giữ nguyên phí</Check>
        <Check name="copy_description">Giữ nguyên mô tả</Check>
        <Check name="copy_images">Giữ nguyên ảnh/link ảnh</Check>
      </div>

      <SubmitButton />
    </form>
  );
}

function Check({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800">
      <input className="size-5" defaultChecked name={name} type="checkbox" />
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-12 w-full items-center justify-center rounded-md bg-[#0F5FD7] px-5 text-sm font-semibold text-white hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Đang tạo..." : "Sao chép phòng"}
    </button>
  );
}
