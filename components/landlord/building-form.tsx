"use client";

import { useActionState, useState, type HTMLInputTypeAttribute, type InputHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { createBuildingAction, updateBuildingAction } from "@/app/landlord/actions";
import type { Building, LandlordFormState } from "@/lib/landlord/types";
import { buildGoogleMapsUrl } from "@/lib/maps";
import { getHcmcDistricts, getHcmcWards } from "@/lib/vietnam-hcmc-locations";

type BuildingFormProps = {
  building?: Building & {
    images?: Array<{ id: string; image_url: string }>;
  };
};

export function BuildingForm({ building }: BuildingFormProps) {
  const action = building ? updateBuildingAction.bind(null, building.id) : createBuildingAction;
  const [state, formAction] = useActionState(action, {} satisfies LandlordFormState);
  const mapUrl = building ? buildGoogleMapsUrl(building) : null;
  const [oldDistrict, setOldDistrict] = useState(building?.old_district ?? building?.district ?? "");
  const [oldWard, setOldWard] = useState(building?.old_ward ?? building?.ward ?? "");
  const [newDistrict, setNewDistrict] = useState(building?.new_district ?? "");
  const [newWard, setNewWard] = useState(building?.new_ward ?? "");
  const oldDistrictOptions = withCurrentValue(getHcmcDistricts("old"), oldDistrict);
  const oldWardOptions = withCurrentValue(getHcmcWards("old", oldDistrict), oldWard);
  const newDistrictOptions = withCurrentValue(getHcmcDistricts("new"), newDistrict);
  const newWardOptions = withCurrentValue(getHcmcWards("new", newDistrict), newWard);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <FormError message={state.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Thông tin cơ bản</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField defaultValue={building?.name} label="Tên căn" name="name" required />
          <TextField defaultValue={building?.city ?? "TP.HCM"} label="Thành phố" name="city" required />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Địa chỉ cũ</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.old_address ?? building?.address}
            label="Địa chỉ cũ / số nhà, tên đường"
            name="old_address"
            required
          />
          <SelectField
            label="Quận cũ"
            name="old_district"
            onChange={(value) => {
              setOldDistrict(value);
              if (!getHcmcWards("old", value).includes(oldWard)) {
                setOldWard("");
              }
            }}
            options={oldDistrictOptions}
            placeholder="Chọn quận cũ"
            value={oldDistrict}
          />
          <SelectField
            label="Phường cũ"
            name="old_ward"
            onChange={setOldWard}
            options={oldWardOptions}
            placeholder="Chọn phường cũ"
            value={oldWard}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Địa chỉ mới</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            className="sm:col-span-2"
            defaultValue={building?.new_address ?? ""}
            label="Địa chỉ mới / số nhà, tên đường"
            name="new_address"
          />
          <SelectField
            label="Quận mới"
            name="new_district"
            onChange={(value) => {
              setNewDistrict(value);
              if (!getHcmcWards("new", value).includes(newWard)) {
                setNewWard("");
              }
            }}
            options={newDistrictOptions}
            placeholder="Chọn quận mới"
            value={newDistrict}
          />
          <SelectField
            label="Phường mới"
            name="new_ward"
            onChange={setNewWard}
            options={newWardOptions}
            placeholder="Chọn phường mới"
            value={newWard}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-base font-black text-slate-950">Vị trí</h2>
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
        <div className="mt-4 grid gap-4">
          <TextField
            defaultValue={building?.google_maps_url ?? ""}
            label="Google Maps URL"
            name="google_maps_url"
            type="url"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-slate-950">Tiện ích / quy định</h2>
        <div className="mt-4 grid gap-4">
          <TextArea defaultValue={building?.description ?? ""} label="Mô tả" name="description" />
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
        <div className="mt-4 space-y-4">
          <TextField
            defaultValue={building?.building_drive_folder_url ?? ""}
            label="Link thư mục Drive căn nhà"
            name="building_drive_folder_url"
            type="url"
          />
          <label className="block">
            <span className="text-sm font-medium text-slate-800">Upload ảnh căn nhà</span>
            <input
              accept="image/*"
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#EFF6FF] file:px-3 file:py-2 file:font-semibold file:text-[#0F5FD7]"
              multiple
              name="uploaded_building_images"
              type="file"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Có thể chọn nhiều ảnh một lần. Ảnh sẽ gắn với căn nhà và hiển thị cho môi giới.
            </p>
          </label>

          {building?.images?.length ? (
            <div>
              <p className="text-sm font-medium text-slate-800">Ảnh đã upload</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {building.images.map((image, index) => (
                  <a
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    href={image.image_url}
                    key={image.id}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <img
                      alt={`Ảnh căn ${index + 1}`}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                      src={image.image_url}
                    />
                    <div className="px-3 py-2 text-xs font-semibold text-slate-600">Ảnh {index + 1}</div>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
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

function withCurrentValue(options: string[], value: string) {
  if (!value || options.includes(value)) {
    return options;
  }

  return [value, ...options];
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
  inputMode,
  label,
  name,
  required,
  type = "text"
}: {
  className?: string;
  defaultValue?: string | null;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  name: string;
  required?: boolean;
  type?: HTMLInputTypeAttribute;
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

function SelectField({
  label,
  name,
  onChange,
  options,
  placeholder,
  value
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <select
        className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
