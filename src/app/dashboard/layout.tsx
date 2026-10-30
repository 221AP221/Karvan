import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { BackButton } from "@/components/BackButton";
import { Logo } from "@/components/Logo";
import { logout } from "../(auth)/actions";

const NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/dashboard/orders", label: "Sifarişlər" },
  { href: "/dashboard/invoices", label: "Fakturalar" },
  { href: "/dashboard/services", label: "Xidmətlər" },
  { href: "/dashboard/analytics", label: "Analitika" },
  { href: "/dashboard/profile", label: "Səhifəm" },
  { href: "/dashboard/settings", label: "Parametrlər" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const pending = await db.order.count({ where: { profileId: profile.id, status: "PENDING_APPROVAL" } });
  const brand = (profile.theme as { primary?: string } | null)?.primary;

  return (
    <div style={{ "--brand": brand } as React.CSSProperties}>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" aria-label="Panel">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/${profile.username}`} target="_blank" className="hidden text-gray-600 sm:inline">
              /{profile.username} ↗
            </Link>
            <form action={logout}>
              <button className="text-gray-500 hover:text-gray-900">Çıxış</button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-gray-100">
              {item.label}
              {item.href === "/dashboard/orders" && pending > 0 && (
                <span className="ml-1 rounded-full bg-[var(--brand)] px-1.5 text-xs text-white">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <BackButton hideOn={["/dashboard"]} className="-ml-2 mb-3" />
        {children}
      </main>
    </div>
  );
}
