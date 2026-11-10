import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { Settings } from "lucide-react";
import Link from "next/link";
import { isImpersonating, requireProfile } from "@/lib/auth";
import { NAV_PERMISSION, ROLE_LABELS, can, workspacesFor } from "@/lib/team";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { getDictionary, getLocale } from "@/i18n/server";
import { stopImpersonationAction } from "./impersonation";
import { db } from "@/lib/db";
import { BackButton } from "@/components/BackButton";
import { Logo } from "@/components/Logo";
import { logout } from "../(auth)/actions";

// Paneldəki bölmələr: adlar seçilmiş dildən gəlir (FR-DIL-06)
const NAV = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/dashboard/orders", key: "orders" },
  { href: "/dashboard/invoices", key: "invoices" },
  { href: "/dashboard/services", key: "services" },
  { href: "/dashboard/analytics", key: "analytics" },
  { href: "/dashboard/reviews", key: "reviews" },
  { href: "/dashboard/notifications", key: "notifications" },
  { href: "/dashboard/profile", key: "profile" },
  { href: "/dashboard/team", key: "team" },
  { href: "/dashboard/billing", key: "billing" },
] as const;

// Parametrlər menyuda yox, yuxarıdakı sətirdə (Çıxışın yanında) durur: menyu bir sətrə sığsın
const SETTINGS = { href: "/dashboard/settings", key: "settings" } as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  // Başlığın bütün məlumatı bir anda istənilir: lokal bazada sorğular növbəyə düzülür,
  // ardıcıl gözləmək hər keçidə əlavə onlarla millisaniyə yazırdı.
  const [locale, pending, memberships, impersonating] = await Promise.all([
    getLocale(),
    db.order.count({ where: { profileId: profile.id, status: "PENDING_APPROVAL" } }),
    workspacesFor(profile.actor.id),
    isImpersonating(),
  ]);
  const t = getDictionary(locale).panel;

  // Rolu görmədiyi bölmələr menyuda göstərilmir
  const nav = NAV.filter((item) => {
    const permission = NAV_PERMISSION[item.href];
    if (!permission) return true;
    if (permission === "team") return profile.isOwner;
    return can(profile.role, permission);
  });

  // İş sahələri: öz səhifəsi + aktiv üzvlüklər
  const own = profile.isOwner ? { profileId: profile.id, username: profile.username, displayName: profile.displayName, role: "OWNER", isOwn: true } : null;
  const workspaces = [
    ...(own ? [own] : memberships.filter((w) => w.role === "OWNER").map((w) => ({ ...w, isOwn: true }))),
    ...memberships.filter((w) => w.role !== "OWNER" && w.status === "ACTIVE").map((w) => ({ ...w, isOwn: false })),
  ].map((w) => ({ profileId: w.profileId, username: w.username, displayName: w.displayName, role: w.role, isOwn: w.isOwn, isCurrent: w.profileId === profile.id }));
  const brand = (profile.theme as { primary?: string } | null)?.primary;

  return (
    <div className="panel" style={{ "--brand": brand } as React.CSSProperties}>
      {impersonating && (
        <div className="flex items-center justify-center gap-3 bg-violet-700 px-4 py-2 text-sm text-white">
          {t.shell.impersonating.split("{user}")[0]}<strong>@{profile.username}</strong>{t.shell.impersonating.split("{user}")[1]}
          <form action={stopImpersonationAction}>
            <button className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">{t.shell.backToAdmin}</button>
          </form>
        </div>
      )}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" aria-label={t.shell.panel}>
            <Logo />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <WorkspaceSwitcher workspaces={workspaces} roleLabels={ROLE_LABELS} />
            {profile.user.role !== "USER" && (
              <Link href="/admin" className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                {t.shell.admin}
              </Link>
            )}
            <Link href={`/${profile.username}`} target="_blank" className="hidden text-gray-600 sm:inline">
              /{profile.username} ↗
            </Link>
            {can(profile.role, "account") && (
              <Link href={SETTINGS.href} className="text-gray-600 hover:text-gray-900" title={t.nav[SETTINGS.key]}>
                <Settings size={17} aria-hidden />
                <span className="sr-only">{t.nav[SETTINGS.key]}</span>
              </Link>
            )}
            <form action={logout}>
              <button className="text-gray-500 hover:text-gray-900">{t.shell.logout}</button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl flex-wrap gap-x-1 gap-y-0.5 px-4 pb-2 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-gray-100">
              {t.nav[item.key]}
              {item.href === "/dashboard/orders" && pending > 0 && (
                <span className="ml-1 rounded-full bg-[var(--brand)] px-1.5 text-xs text-white">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <BackButton hideOn={["/dashboard"]} label={t.analytics.back} className="-ml-2 mb-3" />
        {children}
      </main>
    </div>
  );
}
