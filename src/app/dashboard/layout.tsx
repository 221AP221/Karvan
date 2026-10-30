import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import Link from "next/link";
import { isImpersonating, requireProfile } from "@/lib/auth";
import { stopImpersonationAction } from "./impersonation";
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
  { href: "/dashboard/billing", label: "Abunəlik" },
  { href: "/dashboard/settings", label: "Parametrlər" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const pending = await db.order.count({ where: { profileId: profile.id, status: "PENDING_APPROVAL" } });
  const impersonating = await isImpersonating();
  const brand = (profile.theme as { primary?: string } | null)?.primary;

  return (
    <div className="panel" style={{ "--brand": brand } as React.CSSProperties}>
      {impersonating && (
        <div className="flex items-center justify-center gap-3 bg-violet-700 px-4 py-2 text-sm text-white">
          Admin kimi <strong>@{profile.username}</strong> hesabına baxırsınız
          <form action={stopImpersonationAction}>
            <button className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">Admin panelə qayıt</button>
          </form>
        </div>
      )}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" aria-label="Panel">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {profile.user.role !== "USER" && (
              <Link href="/admin" className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                Admin
              </Link>
            )}
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
