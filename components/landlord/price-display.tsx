import { formatCurrencyVnd } from "@/lib/landlord/format";

export function PriceDisplay({ value }: { value: number | null | undefined }) {
  return <span className="font-semibold text-slate-950">{formatCurrencyVnd(value)}</span>;
}
