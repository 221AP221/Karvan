import Link from "next/link";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Card, buttonClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { getDictionary, getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/invoice-status";
import { formatTotals } from "@/lib/money";
import { PLAN_LIMITS, startOfMonth } from "@/lib/plans";
import { parseTime } from "@/lib/booking";
import { invoicesUsedThisMonth } from "@/lib/invoices";
import { CopyLink } from "./invoices/[id]/client";
import { MonthCalendar } from "./MonthCalendar";
import { PageQr } from "./PageQr";

export default async function Dashboard() {
  const profile = await requireProfile();
  const locale = await getLocale();
  const dict = getDictionary(locale).panel;
  const t = dict.home;
  const plan = profile.user.subscription?.plan ?? "FREE";
  const where = { profileId: profile.id };

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [recent, pendingOrders, usedThisMonth, paidThisMonth, outstanding, serviceCount, linkCount, workCount, monthOrders] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { issuedAt: "desc" }, take: 5 }),
    db.order.count({ where: { ...where, status: "PENDING_APPROVAL" } }),
    invoicesUsedThisMonth(profile.id),
    db.invoice.groupBy({ by: ["currency"], where: { ...where, status: "PAID", paidAt: { gte: startOfMonth() } }, _sum: { totalQepik: true } }),
    db.invoice.groupBy({ by: ["currency"], where: { ...where, status: { in: OPEN_STATUSES } }, _sum: { totalQepik: true } }),
    db.service.count({ where }),
    db.socialLink.count({ where }),
    db.portfolioItem.count({ where }),
    // Cari ayın sifarişləri: təqvimdə günlərin yüklənməsi üçün
    db.order.findMany({
      where: {
        ...where,
        status: { not: "REJECTED" },
        OR: [{ scheduledAt: { gte: startOfMonth(), lt: nextMonth } }, { scheduledAt: null, createdAt: { gte: startOfMonth(), lt: nextMonth } }],
      },
      select: { createdAt: true, scheduledAt: true, scheduledEndAt: true },
    }),
  ]);
  const limit = PLAN_LIMITS[plan].invoicesPerMonth;
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${profile.username}`;

  // Aylıq təqvim: günlərə görə sifariş sayı və günün dolub-dolmadığı.
  // Rezervasiya açıqdırsa, tutulan dəqiqələr iş gününü doldurubsa gün "dolu" sayılır.
  const workMinutes = Math.max(0, (parseTime(profile.workEnd) ?? 1080) - (parseTime(profile.workStart) ?? 540));
  const byDay = new Map<number, { orders: number; minutes: number }>();
  for (const o of monthOrders) {
    const day = (o.scheduledAt ?? o.createdAt).getDate();
    const entry = byDay.get(day) ?? { orders: 0, minutes: 0 };
    entry.orders += 1;
    if (o.scheduledAt && o.scheduledEndAt) entry.minutes += (o.scheduledEndAt.getTime() - o.scheduledAt.getTime()) / 60000;
    byDay.set(day, entry);
  }
  const load = [...byDay.entries()].map(([day, v]) => ({
    day,
    orders: v.orders,
    full: profile.bookingEnabled && workMinutes > 0 && v.minutes >= workMinutes,
  }));

  const steps = [
    { done: Boolean(profile.avatarUrl), label: t.stepAvatar, href: "/dashboard/profile" },
    { done: linkCount > 0, label: t.stepSocial, href: "/dashboard/profile/social" },
    { done: Boolean(profile.about) || workCount > 0, label: t.stepAbout, href: "/dashboard/profile/portfolio" },
    { done: serviceCount > 0, label: t.stepService, href: "/dashboard/services/new" },
    { done: Boolean(profile.cardNumber || profile.iban), label: t.stepPayment, href: "/dashboard/settings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.hello.replace("{name}", profile.displayName)}</h1>

      {/* Sol sütun: başlanğıc və göstəricilər; sağda ayın təqvimi */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {steps.some((s) => !s.done) && (
            <Card title={t.start}>
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
            <Stat label={t.paidThisMonth} value={formatTotals(paidThisMonth)} />
            <Stat label={t.outstanding} value={formatTotals(outstanding)} />
            <Stat label={t.pendingOrders} value={String(pendingOrders)} href={pendingOrders ? "/dashboard/orders" : undefined} />
            <Stat label={t.invoiceLimit} value={limit === Infinity ? t.unlimited : `${usedThisMonth} / ${limit}`} />
          </section>

          {/* FR-FAK-18: limitin 80%-inə çatanda yüksəltmə təklifi */}
          {limit !== Infinity && usedThisMonth >= limit * 0.8 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-4">
              <p className="text-sm text-gray-700">
                {t.upgradeNudge.replace("{used}", String(usedThisMonth)).replace("{limit}", String(limit))}
              </p>
              <Link href="/dashboard/settings" className={buttonClass}>{t.upgradeCta}</Link>
            </div>
          )}

          <Card title={t.yourPage}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href={pageUrl} target="_blank" className="font-mono text-sm text-[var(--brand)] hover:underline">{pageUrl}</a>
              <CopyLink url={pageUrl} />
            </div>
            <p className="mt-2 text-xs text-gray-500">{t.bioHint}</p>
            <PageQr url={pageUrl} username={profile.username} />
          </Card>
        </div>

        <MonthCalendar year={now.getFullYear()} month={now.getMonth()} load={load} today={now} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t.recentInvoices}</h2>
          <Link href="/dashboard/invoices/new" className={buttonClass}>{t.newInvoice}</Link>
        </div>
        <InvoiceTable invoices={recent} words={dict.common} locale={locale} emptyText={dict.common.noInvoices} />
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
