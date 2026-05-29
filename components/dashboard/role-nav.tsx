"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RoleNavItem = {
  badge?: number;
  href: string;
  label: string;
  hiddenOn?: string[];
};

type RoleNavProps = {
  items: RoleNavItem[];
};

export function RoleNav({ items }: RoleNavProps) {
  const pathname = usePathname();
  const visibleItems = items.filter((item) => !item.hiddenOn?.includes(pathname));
  const activeHref = visibleItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-4">
      {visibleItems.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition-colors",
              isActive
                ? "border-[#0F5FD7] bg-[#0F5FD7] text-white shadow-sm"
                : "border-[#D8E2F0] bg-white text-[#334155] hover:border-[#BFDBFE] hover:bg-[#EFF6FF] hover:text-[#0F5FD7]"
            ].join(" ")}
            href={item.href}
            key={item.href}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                className={[
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-black",
                  isActive ? "bg-white text-[#0F5FD7]" : "bg-amber-100 text-amber-800"
                ].join(" ")}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
