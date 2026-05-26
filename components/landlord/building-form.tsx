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

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Thông tin căn nhà</h2>
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

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Vị trí bản đồ</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Tự động chấm tọa độ bằng Google Maps API sẽ được làm ở module sau.
              Hiện tại có thể nhập Google Maps URL hoặc tọa độ thủ công.
            </p>
          </div>
          {mapUrl ? (
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Mô tả và quy định</h2>
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

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Ảnh Google Drive</h2>
        <div className="mt-4">
          <TextField
            defaultValue={building?.building_drive_folder_url ?? ""}
            label="Link thư mục Drive căn nhà"
            name="building_drive_folder_url"
            type="url"
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
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-12 w-full items-center justify-center rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
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
        className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
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
        className="mt-2 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        defaultValue={defaultValue ?? ""}
        name={name}
      />
    </label>
  );
}
