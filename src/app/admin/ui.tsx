import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Plan } from "@/generated/prisma/client";
import { PLAN_NAMES } from "@/lib/plans";

export const card = "rounded-2xl border border-gray-200 bg-white";
export const th = "px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500";
export const td = "px-4 py-3 align-middle";

export function PageTitle({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
      </div>
      {children}
    </div>
  );
}

export function Kpi({ icon: Icon, label, value, hint, href }: { icon: LucideIcon; label: string; value: string; hint?: string; href?: string }) {
  const body = (
    <>
      <span className="flex items-center gap-2 text-sm text-gray-500">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-100 text-gray-700">
          <Icon size={15} strokeWidth={1.9} aria-hidden />
        </span>
        {label}
      </span>
      <span className="mt-2 block text-2xl font-semibold tabular-nums text-gray-900">{value}</span>
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </>
  );
  return href ? (
    <Link href={href} className={`${card} block p-4 transition hover:border-gray-400`}>
      {body}
    </Link>
  ) : (
    <div className={`${card} p-4`}>{body}</div>
  );
}

const PLAN_STYLE: Record<Plan, string> = {
  FREE: "bg-gray-100 text-gray-700",
  PRO: "bg-violet-100 text-violet-800",
  PRO_MAX: "bg-amber-100 text-amber-900",
};

export function PlanBadge({ plan }: { plan: Plan }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_STYLE[plan]}`}>{PLAN_NAMES[plan]}</span>;
}

export function StatusBadge({ blocked, admin }: { blocked: boolean; admin?: boolean }) {
  if (admin) return <span className="inline-flex rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">Admin</span>;
  return blocked ? (
    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Bloklanıb</span>
  ) : (
    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Aktiv</span>
  );
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
};
