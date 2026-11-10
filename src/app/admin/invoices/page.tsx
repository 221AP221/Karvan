import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import type { InvoiceStatus, Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { type SearchParams, dayEnd, dayStart, param } from "@/lib/search-params";
import { Pager, PageTitle, card, date, hrefWith, td, th } from "../ui";

export const metadata: Metadata = { title: "Fakturalar" };

const PAGE = 40;

export default async function AdminInvoices({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = param(sp, "status");
  const from = dayStart(param(sp, "from"));
  const to = dayEnd(param(sp, "to"));
  const page = Math.max(1, Number(param(sp, "page")) || 1);

  const where: Prisma.InvoiceWhereInput = {
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { profile: { username: { contains: q.toLowerCase() } } },
        { profile: { displayName: { contains: q, mode: "insensitive" } } },
      ],
    }),
    ...(status in STATUS_LABEL && { status: status as InvoiceStatus }),
    ...((from || to) && { issuedAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }),
  };

  const [total, sums, invoices] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.groupBy({ by: ["currency"], where, _sum: { totalQepik: true } }),
    db.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { profile: { select: { username: true, displayName: true, userId: true } } },
    }),
  ]);

  return (
    <div>
      <PageTitle title="Fakturalar" text={`Bütün platforma üzrə · cəmi ${sums.map((s) => formatMoney(s._sum.totalQepik ?? 0, s.currency)).join(" + ") || "0,00 AZN"}`} />
      <FilterBar
        total={total}
        fields={[
          { type: "search", name: "q", placeholder: "Nömrə, müştəri və ya satıcı..." },
          { type: "select", name: "status", label: "Status", options: [{ value: "", label: "Status: hamısı" }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))] },
          { type: "date", name: "from", label: "Başlanğıc" },
          { type: "date", name: "to", label: "Son" },
        ]}
      />
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Nömrə</th>
              <th className={th}>Satıcı</th>
              <th className={th}>Müştəri</th>
              <th className={`${th} text-right`}>Məbləğ</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Tarix</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {invoices.map((i) => (
              <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className={`${td} font-mono text-xs`}>
                  <Link href={`/i/${i.publicId}`} target="_blank" className="hover:underline">
                    {i.number}
                  </Link>
                </td>
                <td className={td}>
                  <Link href={`/admin/users/${i.profile.userId}`} prefetch={false} className="hover:underline">
                    {i.profile.displayName}
                  </Link>
                </td>
                <td className={td}>{i.customerName}</td>
                <td className={`${td} text-right font-medium`}>{formatMoney(i.totalQepik, i.currency)}</td>
                <td className={td}>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                </td>
                <td className={`${td} text-right text-xs text-gray-500`}>{date(i.issuedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!invoices.length && <p className="p-8 text-center text-sm text-gray-500">Heç nə tapılmadı.</p>}
      </div>
      <Pager page={page} pages={Math.ceil(total / PAGE)} href={(n) => hrefWith("/admin/invoices", sp, { page: n > 1 ? String(n) : null })} />
    </div>
  );
}
