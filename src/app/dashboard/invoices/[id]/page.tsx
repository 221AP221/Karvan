import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, buttonClass, secondaryButtonClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveStatus } from "@/lib/invoice-status";
import { invoiceUrl } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { invoiceShareText, whatsappShareLink } from "@/lib/notify";
import { cancelInvoice, markInvoicePaid, reopenInvoice } from "../../actions";
import { CopyLink, ReminderDraft } from "./client";

const date = (d: Date) => d.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const invoice = await db.invoice.findFirst({
    where: { id: (await params).id, profileId: profile.id },
    include: { items: { orderBy: { position: "asc" } }, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!invoice) notFound();

  const status = effectiveStatus(invoice);
  const url = invoiceUrl(invoice.publicId);
  const open = !["PAID", "CANCELLED"].includes(invoice.status);
  const shareText = invoiceShareText({
    sellerName: profile.displayName,
    number: invoice.number,
    amount: formatMoney(invoice.totalQepik, invoice.currency),
    url,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-bold">{invoice.number}</h1>
          <StatusBadge status={status} />
        </div>
      </div>

      {invoice.status === "CLAIMED_PAID" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">Müştəri ödədiyini bildirib. Hesabınızı yoxlayıb təsdiqləyin.</p>
          <div className="flex gap-2">
            <form action={markInvoicePaid.bind(null, invoice.id)}>
              <button className={buttonClass}>Pul gəlib, təsdiqlə</button>
            </form>
            <form action={reopenInvoice.bind(null, invoice.id)}>
              <button className={secondaryButtonClass}>Gəlməyib</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Müştəri</p>
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.customerPhone && <p className="text-gray-600">{invoice.customerPhone}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-500">Tarix</p>
              <p>{date(invoice.issuedAt)}</p>
              {invoice.dueAt && <p className="text-gray-600">Son ödəniş: {date(invoice.dueAt)}</p>}
            </div>
          </div>
          <ul className="divide-y divide-gray-100 border-y border-gray-100 text-sm">
            {invoice.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 py-2">
                <span>{item.title} × {item.quantity}</span>
                <span>{formatMoney(item.quantity * item.unitQepik, invoice.currency)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between text-lg font-semibold">
            <span>Ümumi</span>
            <span>{formatMoney(invoice.totalQepik, invoice.currency)}</span>
          </p>
          {invoice.note && <p className="mt-3 text-sm text-gray-600">{invoice.note}</p>}
          {invoice.paidAt && <p className="mt-3 text-sm text-green-700">Ödənilib: {date(invoice.paidAt)}</p>}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Göndər">
            <div className="flex flex-col gap-2">
              {invoice.customerPhone && (
                <a href={whatsappShareLink(invoice.customerPhone, shareText)} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                  WhatsApp ilə göndər
                </a>
              )}
              <CopyLink url={url} />
              <a href={`/api/invoices/${invoice.publicId}/pdf`} target="_blank" className={secondaryButtonClass}>PDF-ə bax</a>
              <a href={url} target="_blank" className="text-center text-sm text-gray-500 hover:underline">Müştəri səhifəsi ↗</a>
            </div>
          </Card>

          {open && (
            <Card title="Xatırlatma">
              <ReminderDraft invoiceId={invoice.id} phone={invoice.customerPhone} />
            </Card>
          )}

          {open && (
            <div className="flex flex-col gap-2">
              {invoice.status !== "CLAIMED_PAID" && (
                <form action={markInvoicePaid.bind(null, invoice.id)}>
                  <button className={`${secondaryButtonClass} w-full`}>Ödənildi kimi qeyd et</button>
                </form>
              )}
              <form action={cancelInvoice.bind(null, invoice.id)}>
                <button className="w-full rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">Fakturanı ləğv et</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
