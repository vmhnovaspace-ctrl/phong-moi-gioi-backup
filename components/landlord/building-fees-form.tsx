"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { upsertBuildingFeesAction } from "@/app/landlord/actions";
import { feeRows, hasAnyFee } from "@/lib/landlord/format";
import type { BuildingFee, FeeFields as FeeFieldsType, LandlordFormState } from "@/lib/landlord/types";

type BuildingFeesFormProps = {
  buildingId: string;
  fees: BuildingFee | null;
};

export function BuildingFeesForm({ buildingId, fees }: BuildingFeesFormProps) {
  const [state, formAction] = useActionState(
    upsertBuildingFeesAction.bind(null, buildingId),
    {} satisfies LandlordFormState
  );
  const rows = feeRows(fees);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Phí chung căn nhà</h2>
          <p className="mt-1 text-sm text-slate-600">
            Phòng mặc định dùng bộ phí này, trừ khi chọn phí riêng cho từng phòng.
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {hasAnyFee(fees) ? "Đã thiết lập" : "Chưa nhập phí"}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div className="rounded-md bg-slate-50 px-3 py-2" key={row.label}>
              <p className="text-xs font-medium text-slate-500">{row.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{row.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Chưa có phí chung. Bấm chỉnh sửa phí để nhập điện, nước, internet và các khoản phí cố định.
        </p>
      )}

      {state.error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.message ? (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.message}
        </div>
      ) : null}

      <details className="mt-4 rounded-md border border-slate-200 bg-slate-50">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-teal-800 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
          Chỉnh sửa phí
          <span className="text-xs font-medium text-slate-500">Mở form</span>
        </summary>
        <form action={formAction} className="space-y-4 border-t border-slate-200 bg-white p-4">
          <FeeFields fees={fees} />
          <SubmitButton />
        </form>
      </details>
    </section>
  );
}

export function FeeFields({ fees }: { fees?: Partial<FeeFieldsType> | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField defaultValue={fees?.electricity_price ?? ""} label="Điện" name="electricity_price" placeholder="4.000" />
      <TextField defaultValue={fees?.electricity_unit ?? "kWh"} label="Đơn vị điện" name="electricity_unit" placeholder="kWh" />
      <TextField defaultValue={fees?.water_price ?? ""} label="Nước" name="water_price" placeholder="100.000" />
      <TextField defaultValue={fees?.water_unit ?? "m3"} label="Đơn vị nước" name="water_unit" placeholder="m3" />
      <TextField defaultValue={fees?.bicycle_parking_fee ?? ""} label="Phí xe đạp" name="bicycle_parking_fee" />
      <TextField defaultValue={fees?.motorbike_parking_fee ?? ""} label="Phí xe máy" name="motorbike_parking_fee" />
      <TextField defaultValue={fees?.car_parking_fee ?? ""} label="Phí ô tô" name="car_parking_fee" />
      <TextField defaultValue={fees?.internet_fee ?? ""} label="Internet" name="internet_fee" />
      <TextField defaultValue={fees?.service_fee ?? ""} label="Dịch vụ" name="service_fee" />
      <TextField defaultValue={fees?.management_fee ?? ""} label="Quản lý" name="management_fee" />
      <label className="block sm:col-span-2">
        <span className="text-sm font-medium text-slate-800">Phí khác</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          defaultValue={fees?.other_fees ?? ""}
          name="other_fees"
        />
      </label>
    </div>
  );
}

function TextField({
  defaultValue,
  label,
  name,
  placeholder
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-12 w-full items-center justify-center rounded-md bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? "Đang lưu..." : "Lưu phí chung"}
    </button>
  );
}
