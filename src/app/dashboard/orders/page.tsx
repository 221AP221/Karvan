import { CalendarDays, Inbox, MessageSquareText, Phone } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { requireProfile } from "@/lib/auth";
import { type Dict, getDictionary, getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { effectiveStatus } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { whatsappShareLink } from "@/lib/notify";
import { type SearchParams, dayEnd, dayStart, param } from "@/lib/search-params";
import { rejectOrder } from "../actions";
import { ApproveForm } from "./ApproveForm";

// Status adları dildən gəlir, rənglər sabitdir
const ORDER_STYLE: Record<OrderStatus, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-gray-100 text-gray-500",
};
const statusLabel = (status: OrderStatus, t: Dict["panel"]["orders"]) =>
  status === "PENDING_APPROVAL" ? t.pending : status === "APPROVED" ? t.approved : t.rejected;

const dateTime = (d: Date, locale: string) =>
  d.toLocaleString(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function Orders({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const locale = await getLocale();
  const dict = getDictionary(locale).panel;
  const t = dict.orders;
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status") as OrderStatus | "";
  const serviceId = param(sp, "service");
  const from = dayStart(param(sp, "from"));
  const to = dayEnd(param(sp, "to"));

  const where: Prisma.OrderWhereInput = {
    profileId: profile.id,
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q.replace(/\s/g, "") } },
        { note: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(status in ORDER_STYLE && { status: status as OrderStatus }),
    ...(serviceId && { serviceId }),
    ...((from || to) && { createdAt: { gte: from, lte: to } }),
  };

  const [orders, services, counts] = await Promise.all([
    // Yalnız ekranda işlənən sahələr: 100 sifarişin bütün sütunlarını daşımağa ehtiyac yoxdur
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        service: { select: { title: true, amountQepik: true, currency: true } },
        invoice: { select: { id: true, number: true, totalQepik: true, currency: true, status: true, dueAt: true } },
      },
    }),
    db.service.findMany({ where: { profileId: profile.id }, select: { id: true, title: true }, orderBy: { position: "asc" } }),
    db.order.groupBy({ by: ["status"], where: { profileId: profile.id }, _count: true }),
  ]);
  const count = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.text}</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {(Object.keys(ORDER_STYLE) as OrderStatus[]).map((s) => (
          <Link
            key={s}
            href={status === s ? "/dashboard/orders" : `/dashboard/orders?status=${s}`}
            scroll={false}
            className={`rounded-2xl border bg-white p-4 transition hover:border-[var(--brand)] ${status === s ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/15" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500">{statusLabel(s, t)}</p>
            <p className="mt-1 text-2xl font-semibold">{count(s)}</p>
          </Link>
        ))}
      </div>

      <FilterBar
        labels={dict.common}
        total={orders.length}
        fields={[
          { type: "search", name: "q", placeholder: t.search },
          { type: "select", name: "status", label: t.status, options: (Object.keys(ORDER_STYLE) as OrderStatus[]).map((s) => ({ value: s, label: statusLabel(s, t) })) },
          { type: "select", name: "service", label: t.service, options: services.map((s) => ({ value: s.id, label: s.title })) },
          { type: "date", name: "from", label: t.dateFrom },
          { type: "date", name: "to", label: t.dateTo },
        ]}
      />

      {orders.length === 0 ? (
        <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <Inbox size={26} strokeWidth={1.5} aria-hidden />
          </span>
          <p className="font-medium">{t.empty}</p>
          <p className="max-w-sm text-sm text-gray-500">{t.emptyHint}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {order.service?.title ?? t.service}
                      {order.quantity > 1 && ` × ${order.quantity}`}
                    </p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STYLE[order.status]}`}>{statusLabel(order.status, t)}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="font-medium text-gray-800">{order.customerName}</span>
                    <a href={whatsappShareLink(order.customerPhone, t.greeting.replace("{name}", order.customerName))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--brand)] hover:underline">
                      <Phone size={13} aria-hidden /> {order.customerPhone}
                    </a>
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <CalendarDays size={13} aria-hidden /> {dateTime(order.createdAt, locale)}
                    </span>
                  </p>
                  {order.note && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                      <MessageSquareText size={15} className="mt-0.5 shrink-0 text-gray-400" aria-hidden /> {order.note}
                    </p>
                  )}
                </div>
                {order.invoice && (
                  <Link href={`/dashboard/invoices/${order.invoice.id}`} prefetch={false} className="flex flex-col items-end gap-1 rounded-xl px-3 py-2 text-right hover:bg-gray-50">
                    <span className="font-mono text-xs text-gray-500">{order.invoice.number}</span>
                    <span className="font-semibold">{formatMoney(order.invoice.totalQepik, order.invoice.currency)}</span>
                    <StatusBadge status={effectiveStatus(order.invoice)} words={dict.common} />
                  </Link>
                )}
              </div>

              {order.status === "PENDING_APPROVAL" && (
                <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-gray-100 pt-4">
                  <ApproveForm
                    orderId={order.id}
                    suggestedAmount={order.service?.amountQepik ? String(order.service.amountQepik / 100) : ""}
                    currency={order.service?.currency ?? "AZN"}
                    t={t}
                  />
                  <form action={rejectOrder.bind(null, order.id)}>
                    <button className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">{t.reject}</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
