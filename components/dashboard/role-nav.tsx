"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type RoleNavItem = {
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

  return (
    <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-4">
      {visibleItems.map((item) => (
        <Link
          className="whitespace-nowrap rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal-700 hover:text-teal-800"
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
