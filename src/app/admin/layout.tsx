import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { FileText, LayoutDashboard, LayoutGrid, LogOut, ScrollText, Users } from "lucide-react";
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
  { href: "/admin/invoices", label: "Fakturalar", icon: FileText },
  { href: "/admin/logs", label: "Jurnal", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
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
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-xs lg:block lg:p-4">
          <p className="truncate text-gray-400">{admin.email}</p>
          <div className="flex gap-2 lg:mt-3">
            <Link href="/" className="rounded-lg px-2 py-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
              Sayt
            </Link>
            <form action={logout}>
              <button className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
                <LogOut size={13} aria-hidden /> Çıxış
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
