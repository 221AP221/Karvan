import { HomeButton } from "@/components/HomeButton";
import { notFound } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/server";
import { db } from "@/lib/db";
import { depositState } from "@/lib/deposit";
import { getPublicInvoice } from "@/lib/invoices";
import { formatMoney } from "@/lib/money";
import { reviewableInvoice } from "@/lib/reviews";
import { fill } from "@/lib/seo";
import { ClaimPaidButton, CopyValue } from "./ClaimPaidButton";
import { ReviewForm } from "./ReviewForm";

export default async function InvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const invoice = await getPublicInvoice(publicId);
  if (!invoice || invoice.status === "DRAFT") notFound();

  if (invoice.status === "SENT") {
    await db.invoice.update({ where: { id: invoice.id }, data: { status: "VIEWED" } });
  }

  const locale = await getLocale();
  const t = getDictionary(locale).invoicePublic;
  const { profile } = invoice;
  const payable = ["SENT", "VIEWED", "OVERDUE"].includes(invoice.status);
  const deposit = depositState(invoice, invoice.payments);
  // Ödəniş təsdiqləndikdən sonra müştəri bir dəfə rəy yaza bilər (FR-KAT-09)
  const { invoice: reviewable, existing: review } = await reviewableInvoice(invoice);

  return (
    <main
      className="mx-auto max-w-md px-4 py-10"
      style={{ "--brand": (profile.theme as { primary?: string } | null)?.primary } as React.CSSProperties}
    >
      <HomeButton className="mb-6" label={t.home} ariaLabel={t.homeAria} />
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">{profile.displayName}</p>
        <h1 className="text-xl font-bold">{fill(t.invoiceNo, { n: invoice.number })}</h1>
        <p className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm">{t.status[invoice.status]}</p>
        {invoice.dueAt && payable && (
          <p className="mt-2 text-sm text-gray-500">{fill(t.dueDate, { date: invoice.dueAt.toLocaleDateString(locale) })}</p>
        )}

        <ul className="mt-6 divide-y divide-gray-100">
          {invoice.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatMoney(item.quantity * item.unitQepik, invoice.currency)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-lg font-semibold">
          <span>{t.total}</span>
          <span>{formatMoney(invoice.totalQepik, invoice.currency)}</span>
        </p>

        {deposit && !deposit.fullyPaid && (
          <div className="mt-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 p-4 text-sm">
            <p className="flex justify-between font-semibold text-[var(--brand)]">
              <span>{deposit.depositPaid ? t.depositPaid : t.depositDue}</span>
              <span>{formatMoney(deposit.depositPaid ? deposit.remaining : deposit.required - deposit.paid, invoice.currency)}</span>
            </p>
            <p className="mt-1 text-gray-600">
              {deposit.depositPaid ? t.depositRest : t.depositHint}
              {invoice.cancelWindowHours ? ` ${fill(t.cancelNote, { hours: String(invoice.cancelWindowHours) })}` : ""}
            </p>
          </div>
        )}

        {payable && invoice.paymentMethod !== "ONLINE" && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm">
            <p className="font-medium">{t.requisites}</p>
            {profile.accountName && <p>{fill(t.payee, { name: profile.accountName })}</p>}
            {profile.bankName && <p>{fill(t.bank, { name: profile.bankName })}</p>}
            {profile.cardNumber && <CopyValue label="Kart" value={profile.cardNumber} words={t} />}
            {profile.iban && <CopyValue label="IBAN" value={profile.iban} words={t} />}
            <ClaimPaidButton publicId={invoice.publicId} words={t} />
          </div>
        )}
        {/* TODO(M5): ONLINE / BOTH üçün gateway düyməsi — hələlik belə fakturalarda müştəriyə ödəniş yolu göstərilmir */}

        {reviewable && <ReviewForm publicId={invoice.publicId} sellerName={profile.displayName} words={t} />}
        {review && (
          <p className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
            {fill(t.alreadyReviewed, { n: review.rating })}
          </p>
        )}

        <a
          href={`/api/invoices/${invoice.publicId}/pdf`}
          className="mt-6 block rounded-full border border-gray-300 py-2 text-center font-medium"
        >
          {t.downloadPdf}
        </a>
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">{t.disclaimer}</p>
    </main>
  );
}
