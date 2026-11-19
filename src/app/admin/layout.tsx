import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import {
  Bell,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  Ticket,
  Users,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { logout } from "../(auth)/actions";
import { type NavGroup, AdminNav } from "./nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | Karvan" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const name = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "Admin";
  const initials = (admin.firstName?.[0] ?? admin.email?.[0] ?? "A").toUpperCase() + (admin.lastName?.[0]?.toUpperCase() ?? "");

  // Yan paneldəki diqqət nişanları: nəzarət tələb edən şeylər bir baxışda görünsün
  const [failedNotifications, claimedInvoices] = await Promise.all([
    db.notification.count({ where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - 24 * 3_600_000) } } }),
    db.invoice.count({ where: { status: "CLAIMED_PAID" } }),
  ]);

  const groups: NavGroup[] = [
    { items: [{ href: "/admin", label: "İcmal", icon: <LayoutDashboard size={17} strokeWidth={1.8} aria-hidden /> }] },
    {
      label: "Satıcılar",
      items: [
        { href: "/admin/users", label: "İstifadəçilər", icon: <Users size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/team", label: "Komanda üzvləri", icon: <UsersRound size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/services", label: "Xidmətlər", icon: <LayoutGrid size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/reviews", label: "Rəylər", icon: <Star size={17} strokeWidth={1.8} aria-hidden /> },
      ],
    },
    {
      label: "Maliyyə",
      items: [
        { href: "/admin/payments", label: "Ödənişlər", icon: <CreditCard size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/campaigns", label: "Kampaniyalar", icon: <Ticket size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/invoices", label: "Fakturalar", icon: <FileText size={17} strokeWidth={1.8} aria-hidden />, badge: claimedInvoices },
      ],
    },
    {
      label: "Sistem",
      items: [
        { href: "/admin/notifications", label: "Bildirişlər", icon: <Bell size={17} strokeWidth={1.8} aria-hidden />, badge: failedNotifications },
        { href: "/admin/ai", label: "AI istifadəsi", icon: <Sparkles size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/logs", label: "Jurnal", icon: <ScrollText size={17} strokeWidth={1.8} aria-hidden /> },
        { href: "/admin/settings", label: "Parametrlər", icon: <Settings size={17} strokeWidth={1.8} aria-hidden /> },
      ],
    },
  ];

  return (
    <div className="panel min-h-screen bg-gray-50 text-gray-900 lg:grid lg:grid-cols-[252px_1fr]">
      <aside className="flex flex-col bg-[#15171C] text-gray-300 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Logo tone="dark" size="sm" />
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">Admin</span>
        </div>
        <AdminNav groups={groups} />
        <div className="mt-auto hidden px-5 py-4 lg:block">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={15} aria-hidden /> Sayta keç
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        {/* Yuxarı panel: hesab və çıxış hər səhifədə sağ yuxarıda */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-2 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 lg:hidden">
            <ExternalLink size={15} aria-hidden /> <span className="hidden sm:inline">Sayta keç</span>
          </Link>
          <span className="mx-1 hidden h-6 w-px bg-gray-200 lg:block" aria-hidden />
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
