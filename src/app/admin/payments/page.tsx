import { CircleDollarSign, Clock, CreditCard, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import type { BillingStatus, Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { PLAN_NAMES } from "@/lib/plans";
import { type SearchParams, param } from "@/lib/search-params";
import { confirmBillingPayment, rejectBillingPayment } from "../actions";
import { Kpi, Pager, PageTitle, card, dateTime, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Ödənişlər" };

const PAGE = 40;
const STATUS: Record<BillingStatus, { label: string; cls: string }> = {
  PENDING: { label: "Gözləyir", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "Ödənilib", cls: "bg-sky-100 text-sky-800" },
  ACTIVATED: { label: "Aktivləşdi", cls: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rədd edildi", cls: "bg-red-100 text-red-800" },
  FAILED: { label: "Alınmadı", cls: "bg-gray-100 text-gray-600" },
};

export default async function AdminPayments({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status");
  const page = Math.max(1, Number(param(sp, "page")) || 1);
  const where: Prisma.SubscriptionPaymentWhereInput = {
    ...(q && { OR: [{ reference: { contains: q.toUpperCase() } }, { user: { email: { contains: q, mode: "insensitive" } } }] }),
    ...(status in STATUS && { status: status as BillingStatus }),
  };
  const d30 = new Date(Date.now() - 30 * 86_400_000);
  const [total, rows, pending, revenue30, revenueAll, activeSubs] = await Promise.all([
    db.subscriptionPayment.count({ where }),
    db.subscriptionPayment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { user: { select: { id: true, email: true, profile: { select: { displayName: true } } } } } }),
    db.subscriptionPayment.count({ where: { status: "PENDING", method: "BANK_TRANSFER" } }),
    db.subscriptionPayment.aggregate({ where: { status: "ACTIVATED", activatedAt: { gte: d30 } }, _sum: { amountQepik: true } }),
    db.subscriptionPayment.aggregate({ where: { status: "ACTIVATED" }, _sum: { amountQepik: true } }),
    db.subscription.count({ where: { plan: { not: "FREE" }, currentPeriodEnd: { gt: new Date() } } }),
  ]);

  return (
    <div>
      <PageTitle title="Ödənişlər" text="Karvan abunəlikləri: kart ödənişləri gateway təsdiqi ilə avtomatik aktivləşir, bank köçürmələrini burada təsdiqləyin" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Clock} label="Təsdiq gözləyir" value={String(pending)} href="/admin/payments?status=PENDING" />
        <Kpi icon={CircleDollarSign} label="Gəlir (30 gün)" value={formatMoney(revenue30._sum.amountQepik ?? 0, "AZN")} />
        <Kpi icon={TrendingUp} label="Ümumi gəlir" value={formatMoney(revenueAll._sum.amountQepik ?? 0, "AZN")} />
        <Kpi icon={CreditCard} label="Ödənişli abunə" value={String(activeSubs)} hint="Müddəti bitməmiş" />
      </div>
      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Ödəniş kodu (KRV-...) və ya e-poçt..." },
          { type: "select", name: "status", label: "Status", options: [{ value: "", label: "Status: hamısı" }, ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))] },
        ]}
      />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Kod</th>
              <th className={th}>Satıcı</th>
              <th className={th}>Tarif</th>
              <th className={th}>Üsul</th>
              <th className={`${th} text-right`}>Məbləğ</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Tarix</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((p) => (
              <tr key={p.id} className={`border-t border-gray-100 ${p.status === "PENDING" ? "bg-amber-50/40" : ""}`}>
                <td className={`${td} font-mono text-xs`}>{p.reference}</td>
                <td className={td}>
                  <Link href={`/admin/users/${p.user.id}`} className="hover:underline">{p.user.profile?.displayName ?? p.user.email}</Link>
                  <span className="block text-xs text-gray-500">{p.user.email}</span>
                </td>
                <td className={td}>{PLAN_NAMES[p.plan]} · {p.months === 12 ? "illik" : "aylıq"}</td>
                <td className={td}>{p.method === "CARD" ? `Kart${p.provider ? ` · ${p.provider}` : ""}` : "Köçürmə"}{p.provider === "sandbox" && <span className="ml-1 text-xs text-sky-700">(test)</span>}</td>
                <td className={`${td} text-right font-medium`}>{formatMoney(p.amountQepik, "AZN")}</td>
                <td className={td}><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[p.status].cls}`}>{STATUS[p.status].label}</span></td>
                <td className={`${td} text-right text-xs text-gray-500`}>{dateTime(p.createdAt)}</td>
                <td className={`${td} text-right`}>
                  {p.status === "PENDING" && p.method === "BANK_TRANSFER" && (
                    <div className="flex justify-end gap-1.5">
                      <form action={confirmBillingPayment.bind(null, p.id)}>
                        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">Təsdiqlə</button>
                      </form>
                      <form action={rejectBillingPayment.bind(null, p.id)}>
                        <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50">Rədd et</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-sm text-gray-500">Ödəniş yoxdur.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/payments", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
