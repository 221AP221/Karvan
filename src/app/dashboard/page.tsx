import Link from "next/link";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Card, buttonClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/invoice-status";
import { formatAzn } from "@/lib/money";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";
import { CopyLink } from "./invoices/[id]/client";

export default async function Dashboard() {
  const profile = await requireProfile();
  const plan = profile.user.subscription?.plan ?? "FREE";
  const where = { profileId: profile.id };

  const [recent, pendingOrders, usedThisMonth, paidThisMonth, outstanding, serviceCount, linkCount, workCount] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { issuedAt: "desc" }, take: 5 }),
    db.order.count({ where: { ...where, status: "PENDING_APPROVAL" } }),
    db.invoice.count({ where: { ...where, issuedAt: { gte: startOfMonth() } } }),
    db.invoice.aggregate({ where: { ...where, status: "PAID", paidAt: { gte: startOfMonth() } }, _sum: { totalQepik: true } }),
    db.invoice.aggregate({ where: { ...where, status: { in: OPEN_STATUSES } }, _sum: { totalQepik: true } }),
    db.service.count({ where }),
    db.socialLink.count({ where }),
    db.portfolioItem.count({ where }),
  ]);
  const limit = PLAN_LIMITS[plan].invoicesPerMonth;
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${profile.username}`;

  const steps = [
    { done: Boolean(profile.avatarUrl), label: "Şəkil və ya loqo yükləyin", href: "/dashboard/profile" },
    { done: linkCount > 0, label: "Sosial hesablarınızı əlavə edin", href: "/dashboard/profile/social" },
    { done: Boolean(profile.about) || workCount > 0, label: "Haqqınızda yazın və ya gördüyünüz işləri əlavə edin", href: "/dashboard/profile/portfolio" },
    { done: serviceCount > 0, label: "İlk xidmətinizi yaradın", href: "/dashboard/services/new" },
    { done: Boolean(profile.cardNumber || profile.iban), label: "Ödəniş rekvizitlərini yazın", href: "/dashboard/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Salam, {profile.displayName}</h1>

      {steps.some((s) => !s.done) && (
        <Card title="Başlamaq üçün">
          <ul className="flex flex-col gap-2 text-sm">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-2">
                <span className={step.done ? "text-green-600" : "text-gray-300"}>{step.done ? "✓" : "○"}</span>
                {step.done ? (
                  <span className="text-gray-500 line-through">{step.label}</span>
                ) : (
                  <Link href={step.href} className="text-[var(--brand)] hover:underline">{step.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Bu ay ödənilib" value={formatAzn(paidThisMonth._sum.totalQepik ?? 0)} />
        <Stat label="Gözləyən məbləğ" value={formatAzn(outstanding._sum.totalQepik ?? 0)} />
        <Stat label="Təsdiq gözləyən sorğu" value={String(pendingOrders)} href={pendingOrders ? "/dashboard/orders" : undefined} />
        <Stat label="Faktura limiti" value={limit === Infinity ? "Limitsiz" : `${usedThisMonth} / ${limit}`} />
      </section>

      <Card title="Səhifəniz">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a href={pageUrl} target="_blank" className="font-mono text-sm text-[var(--brand)] hover:underline">{pageUrl}</a>
          <CopyLink url={pageUrl} />
        </div>
        <p className="mt-2 text-xs text-gray-500">Bu linki Instagram və TikTok bio-nuza qoyun.</p>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Son fakturalar</h2>
          <Link href="/dashboard/invoices/new" className={buttonClass}>+ Yeni faktura</Link>
        </div>
        <InvoiceTable invoices={recent} />
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </>
  );
  const className = "rounded-2xl border border-gray-200 bg-white p-4";
  return href ? <Link href={href} className={`${className} hover:border-[var(--brand)]`}>{body}</Link> : <div className={className}>{body}</div>;
}
