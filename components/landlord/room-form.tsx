"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createRoomAction, updateRoomAction } from "@/app/landlord/actions";
import { FeeFields } from "@/components/landlord/building-fees-form";
import { feeRows, roomStatusOptions } from "@/lib/landlord/format";
import type {
  Building,
  BuildingFee,
  LandlordFormState,
  RoomFeature,
  RoomWithBuilding
} from "@/lib/landlord/types";

type RoomFormProps = {
  building?: Pick<Building, "id" | "name">;
  buildingFees?: BuildingFee | null;
  room?: RoomWithBuilding;
};

const featureFields: Array<{ name: keyof Omit<RoomFeature, "id" | "room_id">; label: string }> = [
  { name: "has_window", label: "Cửa sổ" },
  { name: "has_balcony", label: "Ban công" },
  { name: "has_private_bathroom", label: "WC riêng" },
  { name: "has_private_kitchen", label: "Bếp riêng" },
  { name: "has_washing_machine", label: "Máy giặt" },
  { name: "has_elevator", label: "Thang máy" },
  { name: "has_air_conditioner", label: "Máy lạnh" },
  { name: "has_fridge", label: "Tủ lạnh" },
  { name: "has_bed", label: "Giường" },
  { name: "has_wardrobe", label: "Tủ đồ" },
  { name: "allows_pet", label: "Cho nuôi pet" },
  { name: "is_furnished", label: "Full nội thất" },
  { name: "has_parking", label: "Có chỗ để xe" },
  { name: "has_security", label: "Bảo vệ" }
];

export function RoomForm({ building, buildingFees, room }: RoomFormProps) {
  const action = room
    ? updateRoomAction.bind(null, room.id)
    : createRoomAction.bind(null, building?.id ?? "");
  const [state, formAction] = useActionState(action, {} satisfies LandlordFormState);
  const fees = room?.fees ?? null;
  const activeBuildingFees = room?.building_fees ?? buildingFees ?? null;
  const features = room?.features;

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormError message={state.error} />

      {building ? (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-sm font-bold text-[#0B3B82]">
          Tạo phòng trong căn: {building.name}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Thông tin cơ bản</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField defaultValue={room?.room_code} label="Mã phòng" name="room_code" required />
          <TextField defaultValue={room?.title ?? ""} label="Tiêu đề" name="title" />
          <TextField defaultValue={room?.floor ?? ""} label="Tầng" name="floor" />
          <NumberField defaultValue={room?.area_m2 ?? ""} label="Diện tích m2" name="area_m2" step="0.1" />
          <NumberField defaultValue={room?.rent_price ?? ""} label="Giá thuê" name="rent_price" required />
          <NumberField defaultValue={room?.deposit_amount ?? ""} label="Tiền cọc" name="deposit_amount" />
          <NumberField defaultValue={room?.max_people ?? ""} label="Số người tối đa" name="max_people" />
          <NumberField defaultValue={room?.min_lease_months ?? ""} label="Thời hạn thuê tối thiểu" name="min_lease_months" suffix="tháng" />
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Trạng thái</span>
            <select
              className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
              defaultValue={room?.status ?? "available"}
              name="status"
            >
              {roomStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <TextField defaultValue={room?.available_from ?? ""} label="Ngày có thể vào" name="available_from" type="date" />
          <TextField defaultValue={room?.commission ?? ""} label="Hoa hồng" name="commission" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Giá / cọc / phí</h2>
        {activeBuildingFees ? (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Phí chung hiện tại</p>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              {feeRows(activeBuildingFees).map((row) => (
                <p key={row.label}>
                  <span className="text-slate-500">{row.label}: </span>
                  <span className="font-medium text-slate-900">{row.value}</span>
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Căn này chưa có phí chung. Nếu chọn áp dụng cho toàn căn, bộ phí bên dưới sẽ được lưu làm phí chung.
          </div>
        )}

        <div className="mt-4 grid gap-3">
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
            <input
              defaultChecked={room?.fee_mode !== "room_override"}
              name="fee_mode"
              type="radio"
              value="building_default"
            />
            {activeBuildingFees ? "Dùng phí chung của căn nhà" : "Áp dụng bộ phí này làm phí chung cho toàn bộ căn"}
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800">
            <input
              defaultChecked={room?.fee_mode === "room_override"}
              name="fee_mode"
              type="radio"
              value="room_override"
            />
            Nhập phí riêng cho phòng này
          </label>
        </div>

        <div className="mt-4">
          <FeeFields fees={fees ?? activeBuildingFees} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Tiện ích</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {featureFields.map((field) => (
            <label
              className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800"
              key={field.name}
            >
              <input
                className="size-5 rounded border-slate-300 text-[#0F5FD7] focus:ring-[#93C5FD]"
                defaultChecked={features?.[field.name] ?? false}
                name={field.name}
                type="checkbox"
              />
              {field.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Ảnh / link Drive</h2>
        <div className="mt-4 grid gap-4">
          <TextField
            defaultValue={room?.room_drive_folder_url ?? ""}
            label="Link thư mục Google Drive"
            name="room_drive_folder_url"
            type="url"
          />
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Link từng ảnh</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
              name="image_links"
              placeholder="Dán mỗi link một dòng hoặc cách nhau bằng dấu phẩy"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Upload ảnh trực tiếp</span>
            <input
              accept="image/*"
              className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm"
              multiple
              name="uploaded_images"
              type="file"
            />
          </label>
          {room?.images?.length ? (
            <p className="text-sm text-slate-600">Phòng này hiện có {room.images.length} ảnh/link ảnh.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Trạng thái / ghi chú</h2>
        <div className="mt-4 grid gap-4">
          <TextArea defaultValue={room?.description ?? ""} label="Mô tả" name="description" />
          <TextArea defaultValue={room?.strengths ?? ""} label="Điểm mạnh" name="strengths" />
          <TextArea defaultValue={room?.weaknesses ?? ""} label="Điểm yếu" name="weaknesses" />
        </div>
      </section>

      <SubmitButton label={room ? "Lưu phòng" : "Tạo phòng"} />
    </form>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0F5FD7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5] disabled:cursor-not-allowed disabled:bg-[#94A3B8] sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Đang lưu..." : label}
    </button>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  required,
  type = "text"
}: {
  defaultValue?: string | number | null;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue ?? ""}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function NumberField({
  defaultValue,
  label,
  name,
  required,
  step = "1",
  suffix
}: {
  defaultValue?: string | number | null;
  label: string;
  name: string;
  required?: boolean;
  step?: string;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#0F5FD7] focus-within:ring-2 focus-within:ring-[#93C5FD]">
        <input
          className="h-12 min-w-0 flex-1 px-3 text-base outline-none"
          defaultValue={defaultValue ?? ""}
          min="0"
          name={name}
          required={required}
          step={step}
          type="number"
        />
        {suffix ? (
          <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function TextArea({
  defaultValue,
  label,
  name
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue ?? ""}
        name={name}
      />
    </label>
  );
}
