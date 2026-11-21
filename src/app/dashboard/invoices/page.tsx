import { Plus } from "lucide-react";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Pager, buttonClass, hrefWith } from "@/components/ui";
import type { Prisma } from "@/generated/prisma/client";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { CURRENCIES } from "@/lib/money";
import { type SearchParams, dayEnd, dayStart, param } from "@/lib/search-params";

const PAGE_SIZE = 20;

// Gecikmə cron gələnə qədər oxuma zamanı hesablanır (bax: effectiveStatus)
const STATUS_FILTERS: Record<string, { label: string; where: (now: Date) => Prisma.InvoiceWhereInput }> = {
  waiting: {
    label: "Ödəniş gözlənilir",
    where: (now) => ({ status: { in: ["SENT", "VIEWED"] }, OR: [{ dueAt: null }, { dueAt: { gte: now } }] }),
  },
  claimed: { label: "Müştəri ödədiyini bildirib", where: () => ({ status: "CLAIMED_PAID" }) },
  overdue: {
    label: "Gecikib",
    where: (now) => ({ OR: [{ status: "OVERDUE" }, { status: { in: ["SENT", "VIEWED"] }, dueAt: { lt: now } }] }),
  },
  paid: { label: "Ödənilib", where: () => ({ status: "PAID" }) },
  cancelled: { label: "Ləğv edilib", where: () => ({ status: "CANCELLED" }) },
};

export default async function Invoices({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const now = new Date();
  const q = param(sp, "q");
  const status = param(sp, "status");
  const currency = param(sp, "currency");
  const from = dayStart(param(sp, "from"));
  const to = dayEnd(param(sp, "to"));
  const page = Math.max(1, Number(sp.page) || 1);

  const base: Prisma.InvoiceWhereInput = { profileId: profile.id };
  const where: Prisma.InvoiceWhereInput = {
    AND: [
      base,
      q
        ? {
            OR: [
              { customerName: { contains: q, mode: "insensitive" } },
              { number: { contains: q, mode: "insensitive" } },
              { customerPhone: { contains: q.replace(/\s/g, "") } },
            ],
          }
        : {},
      STATUS_FILTERS[status]?.where(now) ?? {},
      currency ? { currency } : {},
      from || to ? { issuedAt: { gte: from, lte: to } } : {},
    ],
  };

  // Statuslar üzrə saylar bir qruplaşdırma ilə alınır (əvvəl hər status üçün ayrıca COUNT gedirdi).
  // Gecikmə statusda yazılmır, tarixdən hesablanır — ona görə yalnız o, ayrıca sayılır.
  const [invoices, total, byStatus, lateCount] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { issuedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.invoice.count({ where }),
    db.invoice.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
    db.invoice.count({ where: { ...base, status: { in: ["SENT", "VIEWED"] }, dueAt: { lt: now } } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (n: number) => hrefWith("/dashboard/invoices", sp, { page: n > 1 ? String(n) : null });
  const keys = Object.keys(STATUS_FILTERS);
  const byKey = (status: string) => byStatus.find((r) => r.status === status)?._count._all ?? 0;
  const counts: Record<string, number> = {
    waiting: byKey("SENT") + byKey("VIEWED") - lateCount,
    claimed: byKey("CLAIMED_PAID"),
    overdue: byKey("OVERDUE") + lateCount,
    paid: byKey("PAID"),
    cancelled: byKey("CANCELLED"),
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fakturalar</h1>
          <p className="text-sm text-gray-500">Göndərdiyiniz bütün fakturalar və ödəniş statusları</p>
        </div>
        <Link href="/dashboard/invoices/new" className={`${buttonClass} gap-1.5`}>
          <Plus size={16} aria-hidden /> Yeni faktura
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {keys.map((k) => (
          <Link
            key={k}
            href={status === k ? "/dashboard/invoices" : `/dashboard/invoices?status=${k}`}
            scroll={false}
            className={`rounded-2xl border bg-white p-4 transition hover:border-[var(--brand)] ${status === k ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/15" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500">{STATUS_FILTERS[k].label}</p>
            <p className={`mt-1 text-2xl font-semibold ${k === "overdue" && counts[k] ? "text-red-600" : ""}`}>{counts[k]}</p>
          </Link>
        ))}
      </div>

      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Müştəri, faktura nömrəsi və ya telefon..." },
          { type: "select", name: "status", label: "Status", options: keys.map((k) => ({ value: k, label: STATUS_FILTERS[k].label })) },
          { type: "select", name: "currency", label: "Valyuta", options: CURRENCIES.map((c) => ({ value: c.code, label: c.label })) },
          { type: "date", name: "from", label: "Tarix:" },
          { type: "date", name: "to", label: "—" },
        ]}
      />
      <InvoiceTable invoices={invoices} emptyText={q || status || currency || from || to ? "Filtrə uyğun faktura tapılmadı." : "Hələ faktura yoxdur."} />
      <Pager page={page} pages={pages} href={pageHref} />
    </div>
  );
}
