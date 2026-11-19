import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Plan } from "@/generated/prisma/client";
import { PLAN_NAMES } from "@/lib/plans";

// Brend rəngi (bax: src/components/Logo.tsx — BRAND.pink). Admin bölməsində vurğu rəngi kimi.
export const ACCENT = "#EC1C8C";

export const card = "rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";
export const th = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500";
export const td = "px-4 py-3 align-middle";

export function PageTitle({ icon: Icon, title, text, children }: { icon?: LucideIcon; title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-900 text-white">
            <Icon size={18} strokeWidth={1.9} aria-hidden />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {text && <p className="mt-0.5 text-sm text-gray-500">{text}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// KPI kartları: hər kateqoriya öz rənginə bağlıdır ki, siyahı gözlə tez oxuna bilsin
const KPI_TONE = {
  neutral: "bg-gray-100 text-gray-700",
  brand: "bg-pink-50 text-[#EC1C8C]",
  money: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  info: "bg-sky-50 text-sky-700",
  danger: "bg-red-50 text-red-700",
  violet: "bg-violet-50 text-violet-700",
} as const;

export function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone = "neutral",
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: keyof typeof KPI_TONE;
  trend?: number; // müsbət/mənfi faiz: ox və rəng özü seçilir
}) {
  const body = (
    <>
      <span className="flex items-center gap-2.5 text-sm text-gray-500">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${KPI_TONE[tone]}`}>
          <Icon size={16} strokeWidth={1.9} aria-hidden />
        </span>
        {label}
      </span>
      <span className="mt-2.5 flex items-baseline gap-2">
        <span className="block text-2xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</span>
        {trend !== undefined && Number.isFinite(trend) && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
            {Math.abs(Math.round(trend))}%
          </span>
        )}
      </span>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={`${card} block p-4 transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={`${card} p-4`}>{body}</div>
  );
}

// Bütün status/plan/kanal nişanları bu komponentdən keçir ki, admin boyu eyni görünsün
const BADGE_TONE = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-900",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  dark: "bg-gray-900 text-white",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONE; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_TONE[tone]}`}>{children}</span>;
}

const PLAN_TONE: Record<Plan, keyof typeof BADGE_TONE> = { FREE: "neutral", PRO: "violet", PRO_MAX: "warning" };

export function PlanBadge({ plan }: { plan: Plan }) {
  return <Badge tone={PLAN_TONE[plan]}>{PLAN_NAMES[plan]}</Badge>;
}

export function StatusBadge({ blocked, admin }: { blocked: boolean; admin?: boolean }) {
  if (admin) return <Badge tone="dark">Admin</Badge>;
  return blocked ? <Badge tone="danger">Bloklanıb</Badge> : <Badge tone="success">Aktiv</Badge>;
}

export const dateTime = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export const date = (d: Date) => dateTime(d).split(",")[0];

export function Pager({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="Səhifələr">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:border-gray-500">
          Əvvəlki
        </Link>
      )}
      <span className="text-gray-500">
        {page} / {pages}
      </span>
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:border-gray-500">
          Növbəti
        </Link>
      )}
    </nav>
  );
}

// searchParams-dan yeni URL (səhifə nömrəsi dəyişəndə filtrlər qalsın)
export function hrefWith(path: string, sp: Record<string, string | string[] | undefined>, changes: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) next.set(k, v);
  for (const [k, v] of Object.entries(changes)) if (v) next.set(k, v);
  else next.delete(k);
  return `${path}${next.size ? `?${next}` : ""}`;
}

export const ACTION_LABELS: Record<string, string> = {
  plan_change: "Plan dəyişdi",
  coupon_create: "Endirim kodu yaratdı",
  coupon_update: "Endirim kodunu dəyişdi",
  coupon_toggle: "Endirim kodunu aktiv/deaktiv etdi",
  coupon_delete: "Endirim kodunu sildi",
  review_hide: "Rəyi gizlətdi",
  review_show: "Rəyi bərpa etdi",
  block: "Hesab bloklandı",
  unblock: "Blok götürüldü",
  delete_user: "Hesab silindi",
  service_block: "Xidmət bloklandı",
  service_unblock: "Xidmət bərpa edildi",
  logout_sessions: "Sessiyalar bağlandı",
  user_edit: "Məlumatlar dəyişdi",
  password_set: "Şifrə dəyişdirildi",
  role_change: "Rol dəyişdi",
  impersonate: "İstifadəçi kimi daxil oldu",
  ai_settings: "AI ayarı dəyişdi",
  billing_confirm: "Ödəniş təsdiqləndi",
  billing_reject: "Ödəniş rədd edildi",
  membership_remove: "Komanda üzvünü çıxartdı",
};
