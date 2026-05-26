"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Copy,
  ExternalLink,
  ImageIcon,
  Link2,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2
} from "lucide-react";
import {
  hideCustomerRoomPackage,
  type CreateCustomerRoomPackageResult
} from "@/app/broker/send/actions";
import {
  matchesBrokerRoomSmartSearch,
  normalizeBrokerSearchText,
  parseBrokerRoomSearchQuery
} from "@/lib/broker/search";
import type {
  BrokerInventoryFilters,
  BrokerInventoryRoom,
  CustomerRoomPackageSummary
} from "@/lib/broker/types";
import {
  buildTenantSafeLocation,
  mapRoomFeaturesToVietnamese
} from "@/lib/broker/post-templates";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";
import { getHcmcDistricts, getHcmcWards } from "@/lib/vietnam-hcmc-locations";
import { CURRENT_ADMIN_UNIT_OPTIONS } from "@/src/lib/location-options";
import { getCurrentAdminUnitByValue, matchesLocationFilter } from "@/src/lib/location-utils";

type BrokerSendToCustomerViewProps = {
  packages: CustomerRoomPackageSummary[];
  rooms: BrokerInventoryRoom[];
};

type CreatedPackageResult = Extract<CreateCustomerRoomPackageResult, { ok: true }>;

type CustomerFormState = {
  customerName: string;
  customerNeed: string;
  customerPhone: string;
  customerZaloLink: string;
};

type MatchedRoom = BrokerInventoryRoom & {
  score: number;
};

type SelectOption = {
  label: string;
  value: string;
};

const featureKeywords = [
  { keys: ["thang may", "thang máy", "elevator"], feature: "has_elevator" },
  { keys: ["ban cong", "ban công"], feature: "has_balcony" },
  { keys: ["cua so", "cửa sổ"], feature: "has_window" },
  { keys: ["noi that", "nội thất", "full"], feature: "is_furnished" },
  { keys: ["may lanh", "máy lạnh", "dieu hoa", "điều hòa"], feature: "has_air_conditioner" },
  { keys: ["tu lanh", "tủ lạnh"], feature: "has_fridge" },
  { keys: ["bep rieng", "bếp riêng"], feature: "has_private_kitchen" },
  { keys: ["wc rieng", "wc riêng", "ve sinh rieng", "vệ sinh riêng"], feature: "has_private_bathroom" },
  { keys: ["may giat", "máy giặt"], feature: "has_washing_machine" },
  { keys: ["giu xe", "giữ xe", "de xe", "để xe"], feature: "has_parking" }
] as const;

export function BrokerSendToCustomerView({ packages, rooms }: BrokerSendToCustomerViewProps) {
  const [form, setForm] = useState<CustomerFormState>({
    customerName: "",
    customerNeed: "",
    customerPhone: "",
    customerZaloLink: ""
  });
  const [filters, setFilters] = useState<BrokerInventoryFilters>({
    boundaryMode: "old",
    status: "all"
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [result, setResult] = useState<CreatedPackageResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRooms = useMemo(
    () => rooms.filter((room) => filterSendRoom(room, filters)),
    [filters, rooms]
  );
  const matchedRooms = useMemo(
    () => matchRoomsByNeed(filteredRooms, form.customerNeed),
    [filteredRooms, form.customerNeed]
  );
  const visibleRooms = hasSearched
    ? matchedRooms
    : filteredRooms.slice(0, 8).map((room) => ({ ...room, score: 0 }));
  const overLimit = selectedRoomIds.length > 5;

  function updateField(key: keyof CustomerFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError(null);
  }

  function updateFilters(next: Partial<BrokerInventoryFilters>) {
    setFilters((current) => cleanFilters({ ...current, ...next }));
    setSelectedRoomIds([]);
    setResult(null);
    setError(null);
  }

  function resetFilters() {
    setForm((current) => ({ ...current, customerNeed: "" }));
    setFilters({ boundaryMode: "old", status: "all" });
    setAdvancedOpen(false);
    setHasSearched(false);
    setSelectedRoomIds([]);
    setResult(null);
    setError(null);
  }

  function toggleRoom(roomId: string) {
    setSelectedRoomIds((current) =>
      current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId]
    );
  }

  function createPackage() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/broker/send/create", {
          body: JSON.stringify({
            customerName: form.customerName,
            customerNeed: form.customerNeed,
            customerPhone: form.customerPhone,
            customerZaloLink: form.customerZaloLink,
            roomIds: selectedRoomIds
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        });
        const nextResult = (await response.json()) as CreateCustomerRoomPackageResult;

        if (!nextResult.ok) {
          setError(nextResult.error);
          return;
        }

        setResult(nextResult);
        setToast("Đã tạo gói gửi khách.");
        window.setTimeout(() => setToast(null), 1800);
      } catch (packageError) {
        setError(packageError instanceof Error ? packageError.message : "Không tạo được gói gửi khách.");
      }
    });
  }

  async function copyText(text: string, message = "Đã copy.") {
    await navigator.clipboard.writeText(text);
    setToast(message);
    window.setTimeout(() => setToast(null), 1600);
  }

  return (
    <div className="space-y-5">
      <SendCustomerSearchCard
        advancedOpen={advancedOpen}
        filters={filters}
        form={form}
        matchedCount={matchedRooms.length}
        onSearch={() => {
          setHasSearched(true);
          setSelectedRoomIds([]);
          setResult(null);
          setError(null);
        }}
        onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
        resetFilters={resetFilters}
        selectedCount={selectedRoomIds.length}
        totalCount={rooms.length}
        updateField={updateField}
        updateFilters={updateFilters}
      />

      {result ? <SuccessPanel copyText={copyText} result={result} /> : null}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-950">
              {hasSearched ? "Kết quả phù hợp" : "Phòng gợi ý gần đây"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Chọn 1-5 phòng để tạo gói gửi khách.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-500">{visibleRooms.length} phòng</p>
        </div>

        {visibleRooms.length > 0 ? (
          <div className="grid gap-3">
            {visibleRooms.map((room) => (
              <SendRoomCard
                checked={selectedRoomIds.includes(room.id)}
                key={room.id}
                onToggle={() => toggleRoom(room.id)}
                room={room}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
            Chưa tìm thấy phòng phù hợp. Thử nới ngân sách hoặc khu vực.
          </div>
        )}
      </section>

      <RecentPackages packages={packages} copyText={copyText} />

      {selectedRoomIds.length > 0 ? (
        <div className="sticky bottom-3 z-30 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-950">Đã chọn {selectedRoomIds.length} phòng</p>
              {overLimit ? (
                <p className="text-sm font-medium text-amber-700">
                  Nên gửi tối đa 5 phòng để khách dễ chọn.
                </p>
              ) : error ? (
                <p className="text-sm font-medium text-rose-700">{error}</p>
              ) : null}
            </div>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              disabled={isPending || overLimit || selectedRoomIds.length < 1}
              onClick={createPackage}
              type="button"
            >
              <Send className="size-4" aria-hidden />
              Tạo gói gửi khách
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SendCustomerSearchCard({
  advancedOpen,
  filters,
  form,
  matchedCount,
  onSearch,
  onToggleAdvanced,
  resetFilters,
  selectedCount,
  totalCount,
  updateField,
  updateFilters
}: {
  advancedOpen: boolean;
  filters: BrokerInventoryFilters;
  form: CustomerFormState;
  matchedCount: number;
  onSearch: () => void;
  onToggleAdvanced: () => void;
  resetFilters: () => void;
  selectedCount: number;
  totalCount: number;
  updateField: (key: keyof CustomerFormState, value: string) => void;
  updateFilters: (filters: Partial<BrokerInventoryFilters>) => void;
}) {
  const boundaryMode = filters.boundaryMode ?? "old";
  const isCurrentMode = boundaryMode === "new";
  const district = isCurrentMode ? "" : filters.district ?? "";
  const ward = filters.ward ?? "";
  const districts = useMemo(() => toSelectOptions(getHcmcDistricts("old")), []);
  const wards = useMemo(
    () => isCurrentMode ? CURRENT_ADMIN_UNIT_OPTIONS : toSelectOptions(getHcmcWards("old", district)),
    [district, isCurrentMode]
  );
  const chips = buildNeedChips(form.customerNeed, filters);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">Gửi khách</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Gộp nhu cầu khách và lọc phòng vào một luồng, tránh bị trùng nút tìm phòng.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <TextInput
          label="Tên khách"
          onChange={(value) => updateField("customerName", value)}
          placeholder="Ví dụ: Anh Hoàng"
          value={form.customerName}
        />
        <TextInput
          label="Số điện thoại/Zalo"
          onChange={(value) => updateField("customerPhone", value)}
          placeholder="Ví dụ: 0384532123"
          value={form.customerPhone}
        />
        <TextInput
          label="Link Zalo khách"
          onChange={(value) => updateField("customerZaloLink", value)}
          placeholder="https://zalo.me/..."
          value={form.customerZaloLink}
        />
      </div>

      <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-indigo-700" aria-hidden />
            <h3 className="font-bold text-slate-950">Tìm phòng theo nhu cầu</h3>
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-600">
            {selectedCount}/5 phòng đã chọn
          </p>
        </div>

        <textarea
          className="mt-3 min-h-24 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => updateField("customerNeed", event.target.value)}
          placeholder="Ví dụ: Khách cần phòng ban công Tân Bình, dưới 8 triệu, 2 người, có nội thất, ưu tiên gần Nhất Chi Mai."
          value={form.customerNeed}
        />

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                className="h-9 rounded-full border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-800"
                key={chip}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
        <SelectInput
          disabled={isCurrentMode}
          label="Quận/Khu vực"
          onChange={(value) => updateFilters({ district: value || undefined, ward: undefined })}
          options={districts}
          placeholder={isCurrentMode ? "Không dùng trong địa giới hiện hành" : "Tất cả"}
          value={district}
        />
        <NumberInput
          label="Giá đến"
          mode="money"
          onChange={(value) => updateFilters({ maxPrice: value })}
          placeholder="8.000.000"
          value={filters.maxPrice}
        />
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</span>
          <select
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            onChange={(event) =>
              updateFilters({
                status:
                  event.target.value === "available" || event.target.value === "coming_soon"
                    ? event.target.value
                    : "all"
              })
            }
            value={filters.status ?? "all"}
          >
            <option value="all">Tất cả</option>
            <option value="available">Đang trống</option>
            <option value="coming_soon">Sắp trống</option>
          </select>
        </label>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onToggleAdvanced}
          type="button"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Nâng cao
        </button>
      </div>

      {advancedOpen ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kiểu địa giới</span>
            <select
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) =>
                updateFilters({
                  boundaryMode: event.target.value === "new" ? "new" : "old",
                  district: undefined,
                  ward: undefined
                })
              }
              value={boundaryMode}
            >
              <option value="old">Cũ/quen thuộc</option>
              <option value="new">Mới/hiện hành</option>
            </select>
          </label>
          <SelectInput
            disabled={!isCurrentMode && !district}
            label="Phường"
            onChange={(value) => updateFilters({ ward: value || undefined })}
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
          <TextInput
            label="Chủ nhà"
            onChange={(value) => updateFilters({ landlord: value })}
            placeholder="Tên hoặc số điện thoại chủ nhà"
            value={filters.landlord ?? ""}
          />
          <NumberInput
            label="Giá từ"
            mode="money"
            onChange={(value) => updateFilters({ minPrice: value })}
            placeholder="3.000.000"
            value={filters.minPrice}
          />
          <NumberInput
            label="Diện tích từ"
            mode="decimal"
            onChange={(value) => updateFilters({ minArea: value })}
            placeholder="20"
            value={filters.minArea}
          />
          <NumberInput
            label="Diện tích đến"
            mode="decimal"
            onChange={(value) => updateFilters({ maxArea: value })}
            placeholder="35"
            value={filters.maxArea}
          />
          <CheckboxPill
            checked={Boolean(filters.furnished)}
            label="Có nội thất"
            onChange={(checked) => updateFilters({ furnished: checked })}
          />
          <CheckboxPill
            checked={Boolean(filters.allowsPet)}
            label="Cho nuôi thú cưng"
            onChange={(checked) => updateFilters({ allowsPet: checked })}
          />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          onClick={resetFilters}
          type="button"
        >
          <RotateCcw className="size-4" aria-hidden />
          Xóa lọc
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-slate-500">
            {matchedCount}/{totalCount} phòng phù hợp
          </p>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            onClick={onSearch}
            type="button"
          >
            <Search className="size-4" aria-hidden />
            Tìm phòng phù hợp
          </button>
        </div>
      </div>
    </section>
  );
}

function SendRoomCard({
  checked,
  onToggle,
  room
}: {
  checked: boolean;
  onToggle: () => void;
  room: MatchedRoom;
}) {
  const imageUrl = room.cover_image_url || room.thumbnail?.image_url;
  const featureLabels = mapRoomFeaturesToVietnamese(room.features).slice(0, 5);
  const hasImage = Boolean(imageUrl);
  const hasDrive = Boolean(room.room_drive_folder_url);
  const location = buildTenantSafeLocation(room.building);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <label className="grid cursor-pointer gap-0 sm:grid-cols-[156px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] bg-slate-100 sm:aspect-auto">
          {imageUrl ? (
            <img
              alt={room.title || "Ảnh phòng"}
              className="h-full min-h-36 w-full object-cover"
              src={imageUrl}
            />
          ) : (
            <div className="flex h-full min-h-36 items-center justify-center text-slate-400">
              <ImageIcon className="size-8" aria-hidden />
            </div>
          )}
          <input
            checked={checked}
            className="absolute left-3 top-3 size-5 accent-teal-700"
            onChange={onToggle}
            type="checkbox"
          />
        </div>
        <div className="min-w-0 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <ImageBadge hasDrive={hasDrive} hasImage={hasImage} />
            {!hasImage && !hasDrive ? (
              <span className="text-xs font-semibold text-amber-700">Không nên gửi khách</span>
            ) : null}
          </div>
          <h4 className="mt-2 line-clamp-1 text-base font-bold text-slate-950">
            {room.title || "Phòng phù hợp"}
          </h4>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{location || "Khu vực đang cập nhật"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-lg font-black text-slate-950">{formatCurrencyVnd(room.rent_price)}</p>
            {room.deposit_amount ? (
              <p className="text-sm text-slate-500">Cọc {formatCurrencyVnd(room.deposit_amount)}</p>
            ) : null}
            {room.area_m2 ? <p className="text-sm text-slate-500">{formatArea(room.area_m2)}</p> : null}
          </div>
          {featureLabels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {featureLabels.map((feature) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  key={feature}
                >
                  {feature}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </label>
    </article>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectInput({
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  value
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
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
  mode = "money",
  onChange,
  placeholder,
  value
}: {
  label: string;
  mode?: "decimal" | "money";
  onChange: (value: number | undefined) => void;
  placeholder: string;
  value?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        min={0}
        onChange={(event) => onChange(numberFromInput(event.target.value, mode))}
        placeholder={placeholder}
        type="text"
        value={value ?? ""}
      />
    </label>
  );
}

function CheckboxPill({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <input
        checked={checked}
        className="size-4 accent-teal-700"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function SuccessPanel({
  copyText,
  result
}: {
  copyText: (text: string, message?: string) => Promise<void>;
  result: CreatedPackageResult;
}) {
  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-4">
      <h3 className="text-base font-bold text-slate-950">Đã tạo gói gửi khách</h3>
      <div className="mt-3 rounded-md border border-teal-200 bg-white p-3 text-sm font-semibold text-teal-800">
        {result.packageUrl}
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
        {result.message}
      </pre>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
          onClick={() => copyText(result.message, "Đã copy tin nhắn Zalo.")}
          type="button"
        >
          <Copy className="size-4" aria-hidden />
          Copy tin nhắn
        </button>
        <a
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={result.packageUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-4" aria-hidden />
          Mở link gói phòng
        </a>
        <ZaloSendButton
          copyText={copyText}
          customerPhone={result.customerPhone}
          customerZaloLink={result.customerZaloLink}
          message={result.message}
        />
        {result.customerZaloLink ? (
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={result.customerZaloLink}
            rel="noreferrer"
            target="_blank"
          >
            <Link2 className="size-4" aria-hidden />
            Mở Zalo khách
          </a>
        ) : null}
      </div>
      {result.customerPhone ? (
        <p className="mt-2 text-sm text-slate-600">Số khách: {result.customerPhone}</p>
      ) : null}
    </section>
  );
}

function ZaloSendButton({
  copyText,
  customerPhone,
  customerZaloLink,
  message
}: {
  copyText: (text: string, message?: string) => Promise<void>;
  customerPhone: string | null;
  customerZaloLink: string | null;
  message: string | (() => string);
}) {
  const zaloUrl = buildZaloUrl(customerPhone, customerZaloLink);

  if (!customerPhone || !zaloUrl) {
    return (
      <div className="space-y-1">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-semibold text-slate-400"
          disabled
          title="Nhập số điện thoại khách để gửi Zalo"
          type="button"
        >
          <Send className="size-4" aria-hidden />
          Gửi Zalo
        </button>
        <p className="text-xs text-slate-500">Nhập số điện thoại khách để gửi Zalo</p>
      </div>
    );
  }

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
      onClick={async () => {
        const resolvedMessage = typeof message === "function" ? message() : message;
        await copyText(resolvedMessage, "Đã copy tin nhắn. Đang mở Zalo khách.");
        window.open(zaloUrl, "_blank", "noopener,noreferrer");
      }}
      type="button"
    >
      <Send className="size-4" aria-hidden />
      Gửi Zalo
    </button>
  );
}

function RecentPackages({
  copyText,
  packages
}: {
  copyText: (text: string, message?: string) => Promise<void>;
  packages: CustomerRoomPackageSummary[];
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-slate-950">Gói đã tạo gần đây</h3>
        <p className="mt-1 text-sm text-slate-500">Mở lại hoặc copy lại tin nhắn gửi khách.</p>
      </div>
      <div className="grid gap-3">
        {packages.map((item) => (
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-950">{item.customer_name || "Khách chưa đặt tên"}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.customer_need}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {item.room_count} phòng · {new Intl.DateTimeFormat("vi-VN").format(new Date(item.created_at))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  href={`/p/${item.public_slug}`}
                  target="_blank"
                >
                  Mở link
                  <ExternalLink className="size-4" aria-hidden />
                </Link>
                <ZaloSendButton
                  copyText={copyText}
                  customerPhone={item.customer_phone}
                  customerZaloLink={item.customer_zalo_link}
                  message={() =>
                    buildZaloMessage(item.customer_name, `${window.location.origin}/p/${item.public_slug}`)
                  }
                />
                <button
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
                  onClick={() => {
                    const packageUrl = `${window.location.origin}/p/${item.public_slug}`;
                    copyText(buildZaloMessage(item.customer_name, packageUrl), "Đã copy lại tin nhắn.");
                  }}
                  type="button"
                >
                  <Copy className="size-4" aria-hidden />
                  Copy
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  disabled={isPending && pendingId === item.id}
                  onClick={() => {
                    if (!window.confirm("Ẩn gói gửi khách này?")) {
                      return;
                    }

                    setPendingId(item.id);
                    startTransition(async () => {
                      const result = await hideCustomerRoomPackage(item.id);

                      if (!result.ok) {
                        window.alert(result.error ?? "Không ẩn được gói gửi khách.");
                      }

                      setPendingId(null);
                    });
                  }}
                  type="button"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Ẩn
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImageBadge({ hasDrive, hasImage }: { hasDrive: boolean; hasImage: boolean }) {
  if (hasImage && hasDrive) {
    return <Badge tone="green">Có ảnh + Drive</Badge>;
  }

  if (hasImage) {
    return <Badge tone="green">Có ảnh</Badge>;
  }

  if (hasDrive) {
    return <Badge tone="blue">Có Drive</Badge>;
  }

  return <Badge tone="amber">Chưa có ảnh</Badge>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "amber" | "blue" | "green" }) {
  const className = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700"
  }[tone];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function buildNeedChips(need: string, filters: BrokerInventoryFilters) {
  const normalizedNeed = normalizeBrokerSearchText(need);
  const chips = new Set<string>();

  if (filters.boundaryMode === "new" && filters.ward) {
    chips.add(getCurrentAdminUnitByValue(filters.ward)?.label ?? filters.ward);
  } else if (filters.district) {
    chips.add(filters.district);
  }

  if (filters.maxPrice) {
    chips.add(`Dưới ${formatCompactPrice(filters.maxPrice)}`);
  }

  if (filters.furnished || normalizedNeed.includes("noi that")) {
    chips.add("Có nội thất");
  }

  const peopleMatch = normalizedNeed.match(/\b(\d+)\s*(nguoi|ng)\b/);
  if (peopleMatch?.[1]) {
    chips.add(`${peopleMatch[1]} người`);
  }

  if (normalizedNeed.includes("ban cong")) {
    chips.add("Ban công");
  }

  return Array.from(chips).slice(0, 5);
}

function cleanFilters(filters: BrokerInventoryFilters): BrokerInventoryFilters {
  const boundaryMode = filters.boundaryMode ?? "old";

  return {
    allowsPet: filters.allowsPet || undefined,
    boundaryMode,
    district: boundaryMode === "new" ? undefined : filters.district?.trim() || undefined,
    furnished: filters.furnished || undefined,
    landlord: filters.landlord?.trim() || undefined,
    maxArea: filters.maxArea,
    maxPrice: filters.maxPrice,
    minArea: filters.minArea,
    minPrice: filters.minPrice,
    q: filters.q?.trim() || undefined,
    status: filters.status ?? "all",
    ward: filters.ward?.trim() || undefined
  };
}

function filterSendRoom(room: BrokerInventoryRoom, rawFilters: BrokerInventoryFilters) {
  const filters = cleanFilters(rawFilters);

  if (filters.status && filters.status !== "all" && room.status !== filters.status) {
    return false;
  }

  if (
    !matchesLocationFilter({
      geoMode: filters.boundaryMode === "new" ? "current" : "old",
      selectedDistrict: filters.boundaryMode === "new" ? undefined : filters.district,
      selectedWard: filters.ward,
      district: room.building.district,
      ward: room.building.ward,
      address: locationAddress(room.building)
    })
  ) {
    return false;
  }

  if (filters.landlord) {
    const needle = normalizeBrokerSearchText(filters.landlord);
    const haystack = normalizeBrokerSearchText(
      `${room.landlord?.full_name ?? ""} ${room.landlord?.phone ?? ""}`
    );

    if (!haystack.includes(needle)) {
      return false;
    }
  }

  if (filters.minPrice !== undefined && room.rent_price < filters.minPrice) {
    return false;
  }

  if (filters.maxPrice !== undefined && room.rent_price > filters.maxPrice) {
    return false;
  }

  const area = numberValue(room.area_m2);

  if (filters.minArea !== undefined && (area === null || area < filters.minArea)) {
    return false;
  }

  if (filters.maxArea !== undefined && (area === null || area > filters.maxArea)) {
    return false;
  }

  if (filters.furnished && !room.features?.is_furnished) {
    return false;
  }

  if (filters.allowsPet && !room.features?.allows_pet) {
    return false;
  }

  return matchesBrokerRoomSmartSearch(room, parseBrokerRoomSearchQuery(filters.q));
}

function numberValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function locationAddress(building: { address?: string | null; formatted_address?: string | null; name?: string | null }) {
  return [building.address, building.formatted_address, building.name].filter(Boolean).join(" ");
}

function toSelectOptions(options: string[]): SelectOption[] {
  return options.map((option) => ({ label: option, value: option }));
}

function numberFromInput(value: string, mode: "decimal" | "money") {
  const normalized =
    mode === "decimal" ? value.replace(",", ".").replace(/[^\d.]/g, "") : value.replace(/[^\d]/g, "");

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function matchRoomsByNeed(rooms: BrokerInventoryRoom[], need: string): MatchedRoom[] {
  const normalizedNeed = normalizeBrokerSearchText(need);
  const maxPrice = parseMaxPrice(normalizedNeed);
  const requiredFeatures = featureKeywords
    .filter((item) => item.keys.some((key) => normalizedNeed.includes(normalizeBrokerSearchText(key))))
    .map((item) => item.feature);

  return rooms
    .map((room) => {
      let score = 0;
      const haystack = normalizeBrokerSearchText(
        [
          room.building.address,
          room.building.ward,
          room.building.district,
          room.title,
          room.description,
          room.strengths
        ].join(" ")
      );

      if (normalizedNeed && haystack.includes(normalizedNeed)) {
        score += 10;
      }

      for (const token of normalizedNeed.split(" ").filter((part) => part.length >= 3)) {
        if (haystack.includes(token)) {
          score += 2;
        }
      }

      if (maxPrice && room.rent_price <= maxPrice) {
        score += 8;
      }

      if (maxPrice && room.rent_price > maxPrice) {
        score -= 20;
      }

      for (const feature of requiredFeatures) {
        if (room.features?.[feature]) {
          score += 5;
        } else {
          score -= 4;
        }
      }

      if (room.status === "available") {
        score += 3;
      }

      if (room.cover_image_url || room.thumbnail?.image_url || room.room_drive_folder_url) {
        score += 2;
      }

      return { ...room, score };
    })
    .filter((room) => {
      if (!normalizedNeed) {
        return true;
      }

      return room.score > 0;
    })
    .sort((a, b) => b.score - a.score || a.rent_price - b.rent_price)
    .slice(0, 30);
}

function parseMaxPrice(normalizedNeed: string) {
  const millionMatch = normalizedNeed.match(/(?:duoi|toi da|khong qua|<=|<)?\s*(\d+(?:[,.]\d+)?)\s*(?:tr|trieu)/);

  if (millionMatch?.[1]) {
    return Math.round(Number(millionMatch[1].replace(",", ".")) * 1_000_000);
  }

  const rawMatch = normalizedNeed.match(/(?:duoi|toi da|khong qua|<=|<)?\s*(\d{7,9})/);

  if (rawMatch?.[1]) {
    return Number(rawMatch[1]);
  }

  return null;
}

function formatCompactPrice(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} triệu`;
  }

  return formatCurrencyVnd(value);
}

function buildZaloUrl(customerPhone: string | null, customerZaloLink: string | null) {
  const cleanLink = customerZaloLink?.trim();

  if (cleanLink) {
    return cleanLink;
  }

  const digits = customerPhone?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  const normalizedPhone = digits.startsWith("84")
    ? digits
    : digits.startsWith("0")
      ? `84${digits.slice(1)}`
      : digits;

  return `https://zalo.me/${normalizedPhone}`;
}

function buildZaloMessage(customerName: string | null, packageUrl: string) {
  const greeting = customerName
    ? `Em gửi anh/chị ${customerName} danh sách phòng em đã lọc theo nhu cầu.`
    : "Em gửi anh/chị danh sách phòng em đã lọc theo nhu cầu.";

  return [
    greeting,
    "",
    "Xem ảnh, giá và thông tin từng phòng tại link này:",
    packageUrl,
    "",
    "Anh/chị xem phòng nào phù hợp thì nhắn em, em hẹn lịch xem thực tế."
  ].join("\n");
}
