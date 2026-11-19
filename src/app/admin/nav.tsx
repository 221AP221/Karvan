"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: React.ReactNode; badge?: number };
export type NavGroup = { label?: string; items: NavItem[] };

export function AdminNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-4 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
      {groups.map((group, gi) => (
        <div key={gi} className="flex shrink-0 flex-col gap-0.5 lg:shrink">
          {group.label && <p className="hidden px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 lg:block">{group.label}</p>}
          <div className="flex gap-1 lg:flex-col lg:gap-0.5">
            {group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex shrink-0 items-center gap-3 rounded-lg py-2 pl-3 pr-2.5 text-sm transition ${
                    active ? "bg-white/[0.08] font-medium text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[#EC1C8C]" aria-hidden />}
                  <span className={active ? "text-[#EC1C8C]" : "text-gray-500 group-hover:text-gray-300"}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {!!item.badge && (
                    <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-[#EC1C8C] px-1 text-[10px] font-semibold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
