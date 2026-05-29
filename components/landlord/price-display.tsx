import clsx from "clsx";
import { formatCurrencyVnd } from "@/lib/landlord/format";

export function PriceDisplay({
  className,
  value
}: {
  className?: string;
  value: number | null | undefined;
}) {
  return (
    <span className={clsx("font-black tabular-nums text-slate-950", className)}>
      {formatCurrencyVnd(value)}
    </span>
  );
}
