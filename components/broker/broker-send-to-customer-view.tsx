"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
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
import { markCustomerInterestEventRead } from "@/app/broker/actions";
import {
  hideCustomerRoomPackage,
  type CreateCustomerRoomPackageResult
} from "@/app/broker/send/actions";
import {
  rankCustomerNeedRooms,
  type CustomerNeedRoomMatch
} from "@/lib/broker/customer-needs-parser";
import {
  matchesBrokerRoomSmartSearch,
  normalizeBrokerSearchText,
  parseBrokerRoomSearchQuery
} from "@/lib/broker/search";
import type {
  BrokerInventoryFilters,
  BrokerInventoryRoom,
  CustomerRoomPackageEvent,
  CustomerRoomPackageSummary
} from "@/lib/broker/types";
import {
  buildTenantSafeLocation,
  mapRoomFeaturesToVietnamese
} from "@/lib/broker/post-templates";
import { formatArea, formatCurrencyVnd } from "@/lib/landlord/format";
import { getHcmcDistricts, getHcmcWards } from "@/lib/vietnam-hcmc-locations";
import { CURRENT_ADMIN_UNIT_OPTIONS } from "@/src/lib/location-options";
import { matchesLocationFilter } from "@/src/lib/location-utils";

type BrokerSendToCustomerViewProps = {
  customerInterestEvents: CustomerRoomPackageEvent[];
  packages: CustomerRoomPackageSummary[];
  rooms: BrokerInventoryRoom[];
  unreadCustomerInterestCount: number;
};

type CreatedPackageResult = Extract<CreateCustomerRoomPackageResult, { ok: true }>;

type CustomerFormState = {
  customerName: string;
  customerNeed: string;
  customerPhone: string;
  customerZaloLink: string;
};

type MatchedRoom = CustomerNeedRoomMatch;

type SelectOption = {
  label: string;
  value: string;
};

export function BrokerSendToCustomerView({
  customerInterestEvents,
  packages,
  rooms,
  unreadCustomerInterestCount
}: BrokerSendToCustomerViewProps) {
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
  const rankedRooms = useMemo(
    () => rankCustomerNeedRooms(filteredRooms, form.customerNeed),
    [filteredRooms, form.customerNeed]
  );
  const matchedRooms = rankedRooms.matches;
  const parsedNeed = rankedRooms.parsed;
  const visibleRooms = hasSearched
    ? matchedRooms
    : filteredRooms.slice(0, 8).map(toSuggestedRoom);
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
        needChips={parsedNeed.chips}
        needsFallbackKeyword={Boolean(form.customerNeed.trim()) && !parsedNeed.hasStructuredCriteria}
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

      <CustomerInterestPanel
        events={customerInterestEvents}
        unreadCount={unreadCustomerInterestCount}
      />

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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5] disabled:opacity-60"
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
  needChips,
  needsFallbackKeyword,
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
  needChips: string[];
  needsFallbackKeyword: boolean;
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
  const district = filters.district ?? "";
  const ward = filters.ward ?? "";
  const districts = useMemo(() => toSelectOptions(getHcmcDistricts("old")), []);
  const wards = useMemo(
    () => isCurrentMode ? CURRENT_ADMIN_UNIT_OPTIONS : toSelectOptions(getHcmcWards("old", district)),
    [district, isCurrentMode]
  );
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">Tìm phòng và Gửi khách</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Nhập nhanh nhu cầu khách, hệ thống sẽ hiểu điều kiện chính và xếp phòng phù hợp lên trước.
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

      <div className="mt-5 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#0F5FD7]" aria-hidden />
            <h3 className="font-bold text-slate-950">Tìm phòng theo nhu cầu</h3>
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-600">
            {selectedCount}/5 phòng đã chọn
          </p>
        </div>

        <textarea
          className="mt-3 min-h-24 w-full rounded-md border border-[#BFDBFE] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
          onChange={(event) => updateField("customerNeed", event.target.value)}
          placeholder="Ví dụ: 20m2 8tr Tân Bình có thang máy, full nội thất"
          value={form.customerNeed}
        />

        {needChips.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đã hiểu nhu cầu</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {needChips.map((chip) => (
              <button
                className="h-9 rounded-full border border-[#BFDBFE] bg-white px-3 text-sm font-semibold text-[#0B3B82]"
                key={chip}
                type="button"
              >
                {chip}
              </button>
              ))}
            </div>
          </div>
        ) : null}
        {needsFallbackKeyword ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-800">
            Chưa nhận diện được điều kiện cụ thể, đang tìm theo từ khóa.
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
        <SelectInput
          label="Quận/Khu vực"
          onChange={(value) => updateFilters({ district: value || undefined, ward: undefined })}
          options={districts}
          placeholder="Tất cả"
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
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#BFDBFE] bg-white px-4 text-sm font-semibold text-[#0F5FD7] hover:bg-[#EFF6FF]"
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
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D8E2F0] bg-white px-4 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-4 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
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
            className="absolute left-3 top-3 size-5 accent-[#0F5FD7]"
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
          {room.matchReasons.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.matchReasons.slice(0, 4).map((reason) => (
                <span
                  className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#0B3B82]"
                  key={reason}
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
          {room.score > 0 ? (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Điểm phù hợp: {room.score}
            </p>
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
        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
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
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
  const [draft, setDraft] = useState(formatNumberInputValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatNumberInputValue(value));
    }
  }, [focused, value]);

  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-[#0F5FD7] focus:ring-2 focus:ring-[#93C5FD]"
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        min={0}
        onBlur={() => {
          setFocused(false);
          setDraft(formatNumberInputValue(value));
        }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          onChange(numberFromInput(nextDraft, mode));
        }}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        type="text"
        value={draft}
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
        className="size-4 accent-[#0F5FD7]"
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
    <section className="rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-4">
      <h3 className="text-base font-bold text-slate-950">Đã tạo gói gửi khách</h3>
      <div className="mt-3 rounded-md border border-[#BFDBFE] bg-white p-3 text-sm font-semibold text-[#0B3B82]">
        {result.packageUrl}
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
        {result.message}
      </pre>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
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
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
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

function CustomerInterestPanel({
  events,
  unreadCount
}: {
  events: CustomerRoomPackageEvent[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 size-5 text-amber-700" aria-hidden />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-950">Khách quan tâm</h3>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-black text-amber-900">
                  {unreadCount} mới
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Khi khách bấm “Tôi quan tâm phòng này”, danh sách sẽ cập nhật từ database và realtime.
            </p>
          </div>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {events.map((event) => (
            <article
              className={event.is_read
                ? "rounded-md border border-amber-100 bg-white/80 p-3"
                : "rounded-md border border-amber-300 bg-white p-3 shadow-sm"}
              key={event.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-950">
                    {event.customer_name ? `Khách ${event.customer_name}` : "Khách"} quan tâm {roomLabel(event)}
                  </p>
                  {event.customer_phone ? (
                    <p className="mt-1 text-sm font-semibold text-slate-700">SĐT/Zalo: {event.customer_phone}</p>
                  ) : null}
                  {event.customer_need ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">Nhu cầu: {event.customer_need}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">{formatEventTime(event.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    href={`/p/${event.package_public_slug}`}
                    target="_blank"
                  >
                    Mở gói
                  </Link>
                  {!event.is_read ? (
                    <button
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-[#0F5FD7] px-3 text-xs font-bold text-white hover:bg-[#0B4FB5] disabled:opacity-60"
                      disabled={isPending && pendingId === event.id}
                      onClick={() => {
                        setPendingId(event.id);
                        startTransition(async () => {
                          await markCustomerInterestEventRead(event.id);
                          setPendingId(null);
                          router.refresh();
                        });
                      }}
                      type="button"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden />
                      Đã xử lý
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md border border-dashed border-amber-200 bg-white/70 px-3 py-4 text-sm text-amber-900">
          Chưa có khách quan tâm từ các gói đã gửi.
        </p>
      )}
    </section>
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
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-[#0F5FD7] px-3 text-sm font-semibold text-white hover:bg-[#0B4FB5]"
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
    blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700"
  }[tone];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function cleanFilters(filters: BrokerInventoryFilters): BrokerInventoryFilters {
  const boundaryMode = filters.boundaryMode ?? "old";

  return {
    allowsPet: filters.allowsPet || undefined,
    boundaryMode,
    district: filters.district?.trim() || undefined,
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

function formatNumberInputValue(value?: number) {
  return value === undefined ? "" : String(value);
}

function toSuggestedRoom(room: BrokerInventoryRoom): MatchedRoom {
  return {
    ...room,
    matchLevel: "near",
    matchReasons: [],
    score: 0
  };
}

function roomLabel(event: CustomerRoomPackageEvent) {
  return event.room_name || (event.room_code ? `Phòng ${event.room_code}` : "một phòng");
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
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
