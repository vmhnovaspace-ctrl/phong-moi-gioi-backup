"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, RotateCcw, Search } from "lucide-react";
import type { BoundaryMode, BrokerInventoryFilters, BrokerInventoryOptions } from "@/lib/broker/types";
import { findHcmcDistrictName, getHcmcDistricts, getHcmcWards } from "@/lib/vietnam-hcmc-locations";
import { CURRENT_ADMIN_UNIT_OPTIONS } from "@/src/lib/location-options";
import { getCurrentAdminUnitByValue } from "@/src/lib/location-utils";

type BrokerFilterBarProps = {
  filters: BrokerInventoryFilters;
  options: BrokerInventoryOptions;
  resultCount: number;
  totalCount: number;
};

export function BrokerFilterBar({
  filters,
  resultCount,
  totalCount
}: BrokerFilterBarProps) {
  const initialMode = filters.boundaryMode ?? "old";
  const [boundaryMode, setBoundaryMode] = useState<BoundaryMode>(initialMode);
  const [district, setDistrict] = useState(() => {
    return initialMode === "new" ? "" : findHcmcDistrictName("old", filters.district);
  });
  const [ward, setWard] = useState(() => {
    if (initialMode === "new") {
      return getCurrentAdminUnitByValue(filters.ward)?.value ?? (filters.ward === "all" ? "all" : "");
    }

    const wards = getHcmcWards("old", filters.district);
    return filters.ward && wards.includes(filters.ward) ? filters.ward : "";
  });
  const isCurrentMode = boundaryMode === "new";
  const districts = useMemo(() => toSelectOptions(getHcmcDistricts("old")), []);
  const wards = useMemo(
    () => isCurrentMode ? CURRENT_ADMIN_UNIT_OPTIONS : toSelectOptions(getHcmcWards("old", district)),
    [district, isCurrentMode]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <form action="/broker/rooms" className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-[#0F5FD7]" aria-hidden />
              <h3 className="text-base font-black text-slate-950">Tìm phòng nhanh</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Đang hiển thị {resultCount}/{totalCount} phòng môi giới có quyền xem.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              href="/broker/rooms"
            >
              <RotateCcw className="size-4" aria-hidden />
              Xóa lọc
            </Link>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F5FD7] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
              type="submit"
            >
              <Search className="size-4" aria-hidden />
              Lọc
            </button>
          </div>
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Chủ nhà</legend>
          <div className="grid gap-3 lg:grid-cols-2">
            <TextInput
              defaultValue={filters.landlord ?? ""}
              label="Chủ nhà"
              name="landlord"
              placeholder="Tên hoặc số điện thoại chủ nhà"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Vị trí</legend>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kiểu địa giới</span>
              <select
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
                name="boundaryMode"
                onChange={(event) => {
                  const nextMode = event.target.value === "new" ? "new" : "old";
                  setBoundaryMode(nextMode);
                  setDistrict("");
                  setWard("");
                }}
                value={boundaryMode}
              >
                <option value="old">Cũ/quen thuộc</option>
                <option value="new">Mới/hiện hành</option>
              </select>
            </label>
            <SelectInput
              disabled={isCurrentMode}
              label="Quận/Khu vực"
              name="district"
              onChange={(value) => {
                setDistrict(value);
                setWard("");
              }}
              options={districts}
              placeholder={isCurrentMode ? "Không dùng trong địa giới hiện hành" : "Tất cả"}
              value={isCurrentMode ? "" : district}
            />
            <SelectInput
              disabled={!isCurrentMode && !district}
              label="Phường"
              name="ward"
              onChange={setWard}
              options={wards}
              placeholder={
                isCurrentMode
                  ? "Chọn phường/xã hiện hành"
                  : district
                    ? "Tất cả"
                    : "Chọn quận/khu vực trước"
              }
              value={ward}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Giá và diện tích</legend>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</span>
              <select
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
                defaultValue={filters.status ?? "all"}
                name="status"
              >
                <option value="all">Tất cả</option>
                <option value="available">Đang trống</option>
                <option value="coming_soon">Sắp trống</option>
              </select>
            </label>
            <NumberInput label="Giá từ" name="minPrice" placeholder="VD: 3000000" value={filters.minPrice} />
            <NumberInput label="Giá đến" name="maxPrice" placeholder="VD: 6000000" value={filters.maxPrice} />
            <NumberInput label="Diện tích từ" name="minArea" placeholder="VD: 20" value={filters.minArea} />
            <NumberInput label="Diện tích đến" name="maxArea" placeholder="VD: 35" value={filters.maxArea} />
          </div>
        </fieldset>

        <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Tiện ích</legend>
          <div className="flex flex-wrap gap-2">
            <CheckboxPill checked={Boolean(filters.furnished)} label="Có nội thất" name="furnished" />
            <CheckboxPill checked={Boolean(filters.allowsPet)} label="Cho nuôi thú cưng" name="allowsPet" />
          </div>
        </fieldset>
      </form>
    </section>
  );
}

type SelectOption = {
  label: string;
  value: string;
};

function toSelectOptions(options: string[]): SelectOption[] {
  return options.map((option) => ({ label: option, value: option }));
}

function TextInput({
  defaultValue,
  label,
  name,
  placeholder
}: {
  defaultValue: string;
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectInput({
  disabled = false,
  label,
  name,
  onChange,
  options,
  placeholder,
  value
}: {
  disabled?: boolean;
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({
  label,
  name,
  placeholder,
  value
}: {
  label: string;
  name: string;
  placeholder: string;
  value?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        defaultValue={value ?? ""}
        inputMode="numeric"
        min={0}
        name={name}
        placeholder={placeholder}
        type="text"
      />
    </label>
  );
}

function CheckboxPill({
  checked,
  label,
  name
}: {
  checked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
      <input className="size-4 accent-[#0F5FD7]" defaultChecked={checked} name={name} type="checkbox" value="1" />
      {label}
    </label>
  );
}
