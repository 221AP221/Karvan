import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { CreditCard, ExternalLink, FileText, LayoutDashboard, LayoutGrid, LogOut, ScrollText, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KarvanMark } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";
import { logout } from "../(auth)/actions";
import { AdminNav } from "./nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | Karvan" }, robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "İcmal", icon: LayoutDashboard },
  { href: "/admin/users", label: "İstifadəçilər", icon: Users },
  { href: "/admin/services", label: "Xidmətlər", icon: LayoutGrid },
  { href: "/admin/payments", label: "Ödənişlər", icon: CreditCard },
  { href: "/admin/invoices", label: "Fakturalar", icon: FileText },
  { href: "/admin/logs", label: "Jurnal", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const name = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "Admin";
  const initials = (admin.firstName?.[0] ?? admin.email?.[0] ?? "A").toUpperCase() + (admin.lastName?.[0]?.toUpperCase() ?? "");
  return (
    <div className="panel min-h-screen bg-gray-50 text-gray-900 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-[#111318] text-gray-300 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <KarvanMark className="h-8 w-8" />
          <span className="text-sm font-semibold text-white">
            Karvan <span className="font-normal text-gray-500">Admin</span>
          </span>
        </div>
        <AdminNav items={NAV.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon size={17} strokeWidth={1.8} aria-hidden /> }))} />
      </aside>
      <div className="min-w-0">
        {/* Yuxarı panel: hesab və çıxış hər səhifədə sağ yuxarıda */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900">
            <ExternalLink size={15} aria-hidden /> <span className="hidden sm:inline">Sayta keç</span>
          </Link>
          <span className="mx-1 h-6 w-px bg-gray-200" aria-hidden />
          <span className="flex items-center gap-2.5 pr-1">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gray-900 text-xs font-semibold text-white" aria-hidden>
              {initials}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-medium text-gray-900">{name}</span>
              <span className="block text-xs text-gray-500">
                {admin.role === "SUPER_ADMIN" ? "Super admin" : "Admin"} · {admin.email}
              </span>
            </span>
          </span>
          <form action={logout}>
            <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
              <LogOut size={15} aria-hidden /> Çıxış
            </button>
          </form>
        </header>
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
