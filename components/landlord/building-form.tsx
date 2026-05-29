"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createBuildingAction,
  updateBuildingAction
} from "@/app/landlord/actions";
import type { Building, LandlordFormState } from "@/lib/landlord/types";
import { buildGoogleMapsUrl } from "@/lib/maps";

type BuildingFormProps = {
  building?: Building;
};

export function BuildingForm({ building }: BuildingFormProps) {
  const action = building
    ? updateBuildingAction.bind(null, building.id)
    : createBuildingAction;
  const [state, formAction] = useActionState(action, {} satisfies LandlordFormState);
  const mapUrl = building ? buildGoogleMapsUrl(building) : null;

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Thông tin cơ bản</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            defaultValue={building?.name}
            label="Tên căn"
            name="name"
            required
          />
          <TextField
            defaultValue={building?.city ?? "TP.HCM"}
            label="Thành phố"
            name="city"
            required
          />
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.address}
            label="Địa chỉ"
            name="address"
            required
          />
          <TextField defaultValue={building?.ward ?? ""} label="Phường" name="ward" />
          <TextField defaultValue={building?.district ?? ""} label="Quận" name="district" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">Địa chỉ / vị trí</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Tự động chấm tọa độ bằng Google Maps API sẽ được làm ở module sau.
              Hiện tại có thể nhập Google Maps URL hoặc tọa độ thủ công.
            </p>
          </div>
          {mapUrl ? (
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              href={mapUrl}
              rel="noreferrer"
              target="_blank"
            >
              Mở Google Maps
            </a>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.google_maps_url ?? ""}
            label="Google Maps URL"
            name="google_maps_url"
            type="url"
          />
          <TextField
            defaultValue={building?.latitude?.toString() ?? ""}
            label="Latitude"
            name="latitude"
            inputMode="decimal"
          />
          <TextField
            defaultValue={building?.longitude?.toString() ?? ""}
            label="Longitude"
            name="longitude"
            inputMode="decimal"
          />
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.formatted_address ?? ""}
            label="Địa chỉ chuẩn Google"
            name="formatted_address"
          />
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.google_place_id ?? ""}
            label="Google Place ID"
            name="google_place_id"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Tiện ích / quy định</h2>
        <div className="mt-4 grid gap-4">
          <TextArea
            defaultValue={building?.description ?? ""}
            label="Mô tả"
            name="description"
          />
          <TextArea
            defaultValue={building?.common_amenities ?? ""}
            label="Tiện ích chung"
            name="common_amenities"
          />
          <TextArea
            defaultValue={building?.house_rules ?? ""}
            label="Quy định căn nhà"
            name="house_rules"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Ảnh / link Drive</h2>
        <div className="mt-4">
          <TextField
            defaultValue={building?.building_drive_folder_url ?? ""}
            label="Link thư mục Drive căn nhà"
            name="building_drive_folder_url"
            type="url"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Ghi chú chia sẻ</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Dùng khi căn này có nhóm Zalo riêng để gửi phòng đang sell.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.zalo_group_url ?? ""}
            label="Link nhóm Zalo của căn này"
            name="zalo_group_url"
            type="url"
          />
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.zalo_group_name ?? ""}
            label="Tên nhóm Zalo"
            name="zalo_group_name"
          />
        </div>
      </section>

      <SubmitButton label={building ? "Lưu căn nhà" : "Tạo căn nhà"} />
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
  className = "",
  defaultValue,
  label,
  name,
  required,
  type = "text",
  inputMode
}: {
  className?: string;
  defaultValue?: string | null;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue ?? ""}
        inputMode={inputMode}
        name={name}
        required={required}
        type={type}
      />
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
