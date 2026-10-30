"use client";

import { Briefcase, Share2, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/profile", label: "Əsas məlumat", icon: UserRound },
  { href: "/dashboard/profile/social", label: "Sosial və linklər", icon: Share2 },
  { href: "/dashboard/profile/portfolio", label: "Gördüyüm işlər", icon: Briefcase },
];

export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
