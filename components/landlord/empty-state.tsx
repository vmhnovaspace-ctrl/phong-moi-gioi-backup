import Link from "next/link";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  actionHref,
  actionLabel,
  description,
  title
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-sm">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        <Inbox className="size-5" aria-hidden />
      </div>
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0F5FD7] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0B4FB5]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
